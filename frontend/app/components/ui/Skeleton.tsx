import { cn } from "./cn";

export default function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-sm)] bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_25%,rgba(255,255,255,0.12)_37%,rgba(255,255,255,0.06)_63%)] bg-[length:400%_100%] animate-[shimmer_1.6s_ease-in-out_infinite]",
        className
      )}
    />
  );
}
