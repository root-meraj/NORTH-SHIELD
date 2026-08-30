# Paste this into Antigravity

---

You are building **Northshield**, a Next.js 15 app for a Smart India Hackathon submission (MDoNER problem statement: AI-based smart logistics and accessibility intelligence for the North Eastern Region).

**A complete, working codebase is attached in this folder. Do not redesign it. Do not swap the colours, fonts, or layout for your own defaults.** Your job is to install it, make it run cleanly, and then extend it exactly where this brief says to extend it.

## Step 1 — Get it running

```bash
npm install
npm run dev
```

Then fix, in this order, until all three are clean:

1. `npm run typecheck` — zero TypeScript errors
2. `npm run lint` — zero errors (warnings acceptable)
3. `npm run build` — succeeds

Likely issues to expect and fix yourself:
- `react-leaflet` v5 requires React 19 — already matched in package.json, but if peer deps complain, install with `--legacy-peer-deps`
- Leaflet must never render server-side. It is already behind `next/dynamic` with `ssr: false` in `app/map/page.tsx`. Keep it that way.
- If `geist` fonts fail, replace with `next/font/google` Inter + JetBrains Mono and keep the same CSS variable names (`--font-sans`, `--font-mono`).
- Any hydration warning: the cause is a `Date` or `Math.random()` rendering on the server. Move it into a `useEffect`, as `LiveClock.tsx` already does.

## Step 2 — The design system is fixed

Read `app/globals.css` before writing a single line. It defines the entire visual identity:

- **Ground:** wet slate (`#0C1416`), never pure black, with a faint contour wash
- **One loud colour:** signal orange `#FF6B35`. Maximum one signal-coloured element per view. Everything else is quiet.
- **Status colours are earth-derived**, not neon: lichen green, ochre, deep red, glacier teal
- **Type:** Bricolage Grotesque for display, Geist Sans for body, Geist Mono for every number an operator reads
- **Elevation comes from hairline borders and contour texture, not drop shadows**
- **Structure encodes meaning.** Numbered markers (`01/02/03`) appear only where the content genuinely is a sequence. Eyebrow labels say what sheet of the survey you are on.

Use only the Tailwind tokens in `tailwind.config.ts` (`bg-ink`, `text-ash`, `border-hairline`, `text-signal`, etc.). Never write a raw hex value in a component. Never add a new colour.

The two signature elements are `ContourField.tsx` (hero terrain) and `ElevationStrip.tsx` (route cross-section). These are what make the project memorable — a route shown as a terrain profile with hazard columns is something no other team will have. Do not replace them with a generic chart.

## Step 3 — What already works

| Page | Route | State |
|---|---|---|
| Landing + operations dashboard | `/` | Complete |
| Live map + safe routing | `/map` | Complete |
| Citizen photo report | `/report` | Complete |
| What-if forecast | `/predictions` | Complete |
| Emergency SOS | `/sos` | Complete |
| Guided 60-second demo | any page | Complete |

Mobile: bottom tab bar with SOS raised in the centre, bottom-sheet map controls, `env(safe-area-inset-bottom)` respected, camera capture via `capture="environment"`.

## Step 4 — Build these, in this order

### 4a. Officials dashboard at `/dashboard`
Follow the exact visual language of `app/page.tsx`. Contents:
- District accessibility grid: all 8 NE states, each a card showing corridors open / degraded / blocked
- Convoy table (extend `ConvoyBoard.tsx` into a full-width sortable table)
- Three Recharts panels using the existing token colours only: incidents per day (line, 30 days), incidents by district (horizontal bar), incidents by type (donut)
- A "Next 24 hours" briefing card driven by `runScenario()` from `lib/api.ts`

Wire it into `TopNav.tsx` links.

### 4b. Real risk heatmap on the map
Add district polygons over the Leaflet map, filled by risk score using the `SEV` colour map from `lib/utils.ts` at 0.18 opacity. Source simplified GeoJSON for the 8 NE states, store it at `lib/geo/ne-districts.json`, and lazy-load it so it does not bloat the first paint.

### 4c. Layer toggles
Add a small control group to the map panel: Incidents, Risk heatmap, Convoys, Weather. Persist choices in the Zustand store.

### 4d. Offline queue
When `navigator.onLine` is false, `submitReport()` should write the payload to IndexedDB and flush on reconnect. Show a queued count in `ConnectivityWatch.tsx`. This directly answers requirement (h) in the problem statement.

### 4e. Multilingual strings
Install `next-intl`. Extract every user-facing string into `messages/en.json`. Add `hi.json`, `as.json`, `bn.json`, `mni.json` — machine translation is acceptable for the demo, but the switcher in `TopNav.tsx` must actually change the page.

## Step 5 — Quality floor, non-negotiable

- Works at 360 px, 768 px, and 1440 px. Test the map page hardest — that is where layouts break.
- Every interactive element reachable by keyboard, with the visible orange focus ring intact.
- `prefers-reduced-motion` respected (already handled globally; do not override it).
- No `console.log` in committed code. No `any` types.
- Every empty state and every error state has copy that says what happened and what to do next. Never "Something went wrong."
- Loading states are skeletons in `bg-hairline/25`, never spinners on full pages.

## Step 6 — Copy rules

Write like the interface is talking to a truck driver on a mountain road at night, not like a brochure.

- Buttons name the action and keep that name through the flow: "File the report" → toast says "Filed as INC-4419"
- Never "Submit". Never "Click here". Never exclamation marks.
- Numbers are specific: "23 corridors impassable", not "several closures"
- Errors state the fix: "Location blocked. Type a landmark instead."

## Step 7 — Before you say it is done

Run through the guided demo end to end on a 390 px viewport with the network throttled. If any panel overflows, any text truncates badly, or the map fails to fit its bounds, fix it. Judges will be holding a phone.

Then write `README.md` with a "Judges' quick start" section: clone, `npm install`, `npm run dev`, open `localhost:3000`, press **Watch the 60-second demo**.

---

## Backend contract (for the teammate wiring the trained model)

Set `NEXT_PUBLIC_API_URL` and every mock in `lib/api.ts` switches to a real call. Nothing else in the app touches `fetch`. The endpoints expected:

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/incidents` | — | `Incident[]` |
| POST | `/api/route` | `{ from, to }` | `{ direct: RoutePlan, recommended: RoutePlan }` |
| POST | `/api/classify` | multipart: `image`, `lat`, `lng` | `ClassificationResult` |
| POST | `/api/incidents` | `{ kind, severity, point, landmark, note }` | `{ id }` |
| POST | `/api/predict` | `ScenarioInput` | `ScenarioResult` |
| POST | `/api/sos` | `{ at, online }` | `SosDispatch` |

All shapes are defined in `lib/types.ts`. Match them exactly and no frontend change is needed.
