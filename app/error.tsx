"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 text-center">
      <span className="eyebrow text-caution">Something stopped</span>
      <h1 className="t-h1 mt-2">This panel failed to load.</h1>
      <p className="mt-3 text-sm text-ash">
        The rest of the app is still running. Reload this section to try again.
      </p>
      <button onClick={reset} className="btn-signal mt-7">Reload the panel</button>
    </div>
  );
}
