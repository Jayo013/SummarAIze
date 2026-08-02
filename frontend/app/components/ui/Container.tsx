import type { ReactNode } from "react";
import { cn } from "./cn";

export default function Container({
  children,
  className,
  size = "default",
}: {
  children: ReactNode;
  className?: string;
  size?: "default" | "wide" | "narrow";
}) {
  const maxWidth = size === "wide" ? "max-w-6xl" : size === "narrow" ? "max-w-2xl" : "max-w-5xl";
  return <div className={cn("mx-auto w-full px-4 sm:px-6", maxWidth, className)}>{children}</div>;
}
