import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 text-center">
      <span className="eyebrow">Off the survey sheet</span>
      <h1 className="t-h1 mt-2">No such page.</h1>
      <p className="mt-3 text-sm text-ash">The route you followed does not exist.</p>
      <Link href="/" className="btn-signal mt-7">Back to the dashboard</Link>
    </div>
  );
}
