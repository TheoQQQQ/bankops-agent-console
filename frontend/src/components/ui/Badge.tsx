import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Generic badge component.
 * Colour is controlled by the parent via className;
 * use the helper functions in utils.ts (riskBadgeBg, statusBadgeBg).
 */
export function Badge({ children, className }: BadgeProps) {
  return (
    <span className={cn("badge", className)}>
      {children}
    </span>
  );
}
