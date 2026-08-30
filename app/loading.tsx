export default function Loading() {
  return (
    <div className="mx-auto max-w-shell px-5 pt-24 sm:px-8">
      <div className="h-3 w-28 animate-pulse rounded bg-hairline/50" />
      <div className="mt-4 h-10 w-2/3 animate-pulse rounded bg-hairline/40" />
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-hairline/25" />
        ))}
      </div>
    </div>
  );
}
