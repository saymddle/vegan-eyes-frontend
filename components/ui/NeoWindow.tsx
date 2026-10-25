import { colors } from "@/lib/theme/colors";

type Props = {
  title?: string;
  // A small control shown at the right end of the title row.
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  variant?: "vegan" | "not_vegan" | "maybe";
  size?: "sm" | "md" | "lg";
  // Outlined, colored box. Without it the section sits straight on the
  // cream background.
  boxed?: boolean;
  className?: string;
};

const bgMap = {
  vegan: colors.leaf,
  not_vegan: colors.tomato,
  maybe: colors.butter
};

const padMap = {
  lg: "p-5",
  md: "p-4",
  sm: "p-3"
};

export default function NeoWindow({
  title,
  headerAction,
  children,
  variant = "maybe",
  size = "md",
  boxed = false,
  className = ""
}: Props) {
  return (
    <div
      className={`neo-window ${boxed ? `boxed ${padMap[size]}` : ""} ${className}`}
      style={boxed ? { backgroundColor: bgMap[variant] } : undefined}
    >
      {title ? (
        <div className="neo-head flex items-center justify-between gap-2">
          <span>{title}</span>
          {headerAction}
        </div>
      ) : null}
      <div className="neo-content">{children}</div>
    </div>
  );
}
