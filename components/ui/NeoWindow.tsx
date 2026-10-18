import { colors } from "@/lib/theme/colors";

type Props = {
  title?: string;
  // A small control shown at the right end of the title bar.
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  variant?: "vegan" | "not_vegan" | "maybe";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const bgMap = {
  vegan: colors.primary,
  not_vegan: colors.alert,
  maybe: colors.secondary
};

const textMap = {
  vegan: colors.white,
  not_vegan: colors.white,
  maybe: colors.black
};

const sizeMap = {
  lg: "p-6 shadow-[12px_12px_0px_#000000]",
  md: "p-4 shadow-[8px_8px_0px_#000000]",
  sm: "p-3 shadow-[6px_6px_0px_#000000]"
};

export default function NeoWindow({
  title,
  headerAction,
  children,
  variant = "maybe",
  size = "md",
  className = ""
}: Props) {
  return (
    <div
      className={`neo-window ${sizeMap[size]} ${className}`}
      style={{
        backgroundColor: bgMap[variant],
        color: textMap[variant]
      }}
    >
      {title ? (
        <div className="neo-head flex items-center justify-between gap-2 text-black">
          <span>{title}</span>
          {headerAction}
        </div>
      ) : null}
      <div className="neo-content">{children}</div>
    </div>
  );
}
