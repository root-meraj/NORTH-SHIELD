import { cn } from "@/lib/utils";

export function Panel({ className, contour, children, ...rest }: React.HTMLAttributes<HTMLDivElement> & { contour?: boolean }) {
  return (
    <div className={cn("panel", contour && "panel-contour", className)} {...rest}>
      {children}
    </div>
  );
}

export function PanelHead({ eyebrow, title, aside }: { eyebrow: string; title: string; aside?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-hairline/40 px-5 py-4">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h3 className="mt-1 font-display text-base font-semibold tracking-tight">{title}</h3>
      </div>
      {aside}
    </div>
  );
}
