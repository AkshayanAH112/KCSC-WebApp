import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonBaseProps = {
  variant?: "primary" | "secondary";
  size?: "md" | "lg";
  className?: string;
  children: React.ReactNode;
};

type ButtonAsLink = ButtonBaseProps & {
  href: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
};

type ButtonAsButton = ButtonBaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type ButtonProps = ButtonAsLink | ButtonAsButton;

// Pills, not rounded rectangles, and every variant carries a gold hairline —
// on a near-black page an unbordered button has no edge to read against the
// ground, so the border is what makes it look like a control at all.
const base =
  "cursor-pointer relative inline-flex items-center justify-center rounded-full font-bold tracking-wide transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]";

const variants = {
  primary:
    "bg-linear-to-r from-primary-fixed via-primary to-primary-container text-on-primary border border-tertiary-container/60 shadow-soft hover:border-tertiary-fixed-dim hover:shadow-[0_0_28px_-6px_rgba(251,191,36,0.45)]",
  secondary:
    "bg-surface-container/70 backdrop-blur-md text-tertiary-fixed border border-tertiary-container/30 hover:bg-surface-container-high hover:text-on-primary-container hover:border-tertiary-container/50",
};

const sizes = {
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-3.5 text-sm",
};

export default function Button({
  variant = "primary",
  size = "lg",
  className,
  children,
  href,
  ...rest
}: ButtonProps) {
  const classes = cn(base, variants[variant], sizes[size], className);

  if (href) {
    return (
      <Link href={href} className={classes} onClick={(rest as ButtonAsLink).onClick}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
