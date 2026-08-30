/**
 * POST /api/notify  { title, body, type? }  ->  { sent } | { skipped, reason }
 * ------------------------------------------------------------------
 * Sends an alert via the **Telegram Bot API** (replaces the earlier Twilio SMS
 * flow that required verified numbers and trial credits).
 *
 * How it works:
 *   1. A Telegram bot is created once via @BotFather.
 *   2. The bot's token and the target chat (group or personal) are stored
 *      server-side in env vars.  They never reach the browser.
 *   3. This endpoint formats a rich message and POSTs it to
 *      https://api.telegram.org/bot<TOKEN>/sendMessage.
 *
 * Required server env:
 *   TELEGRAM_BOT_TOKEN    The bot token from @BotFather
 *   TELEGRAM_CHAT_ID      The chat/group ID to send alerts to
 *                          (may be a comma-separated list for multiple recipients)
 *
 * If either is missing the route returns { skipped } with 200 so callers
 * (e.g. filing a blocked-road report) never fail because Telegram is not
 * configured yet.
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const DEFAULT_CHAT_IDS = process.env.TELEGRAM_CHAT_ID ?? "";

// Alert type -> emoji + label for the Telegram message
const TYPE_META: Record<string, { emoji: string; label: string }> = {
  road_blocked:    { emoji: "🚫", label: "ROAD BLOCKED" },
  sos:             { emoji: "🆘", label: "SOS DISTRESS" },
  high_risk:       { emoji: "⚠️",  label: "HIGH RISK ALERT" },
  landslide:       { emoji: "⛰️",  label: "LANDSLIDE DETECTED" },
  flood:           { emoji: "🌊", label: "FLOOD DETECTED" },
  road_damage:     { emoji: "🛣️",  label: "ROAD DAMAGE" },
  reroute:         { emoji: "🔄", label: "CONVOY REROUTED" },
  prediction:      { emoji: "📊", label: "RISK PREDICTION" },
  default:         { emoji: "📢", label: "NORTHSHIELD ALERT" },
};

export async function POST(request: Request) {
  let payload: { title?: string; body?: string; type?: string; chatId?: string };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON" }, { status: 400 });
  }

  // One chat ID or many — split on comma / semicolon / whitespace, dedupe.
  const chatIds = [...new Set(
    (payload.chatId || DEFAULT_CHAT_IDS)
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean),
  )];

  if (!BOT_TOKEN || !chatIds.length) {
    return Response.json({
      skipped: true,
      reason: !BOT_TOKEN
        ? "Telegram not configured: TELEGRAM_BOT_TOKEN missing"
        : "No recipient (TELEGRAM_CHAT_ID)",
    });
  }

  // Build a rich, readable Telegram message
  const meta = TYPE_META[payload.type ?? ""] ?? TYPE_META.default;
  const lines = [
    `${meta.emoji} *${meta.label}*`,
    "",
    payload.title ? `*${escapeMarkdown(payload.title)}*` : "",
    payload.body ? escapeMarkdown(payload.body) : "",
    "",
    `🕐 ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`,
    "━━━━━━━━━━━━━━━━━━━━",
    "_Northshield · Disaster Early Warning_",
  ].filter(Boolean);

  const text = lines.join("\n");

  const results = await Promise.all(
    chatIds.map(async (chatId) => {
      try {
        const res = await fetch(
          `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text,
              parse_mode: "Markdown",
              disable_web_page_preview: true,
            }),
          },
        );
        const data = (await res.json()) as { ok?: boolean; description?: string; result?: { message_id: number } };
        return res.ok && data.ok
          ? { chatId, sent: true, messageId: data.result?.message_id }
          : { chatId, sent: false, error: data.description || `Telegram ${res.status}` };
      } catch {
        return { chatId, sent: false, error: "request failed" };
      }
    }),
  );

  const sent = results.filter((r) => r.sent).length;
  return Response.json({ sent, total: chatIds.length, results }, { status: sent ? 200 : 502 });
}

/** Escape special Markdown V1 characters in user-supplied text */
function escapeMarkdown(s: string): string {
  return s.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, "\\$1");
}
