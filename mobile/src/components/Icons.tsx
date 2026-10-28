import Svg, { Circle, Path } from "react-native-svg";

type Props = { color?: string; size?: number };

function Icon({
  color = "#20251F",
  size = 18,
  width = 2.5,
  children
}: Props & { width?: number; children: React.ReactNode }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  );
}

export function CameraIcon(props: Props) {
  return (
    <Icon {...props}>
      <Path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <Circle cx="12" cy="13" r="3.5" />
    </Icon>
  );
}

export function RetakeIcon(props: Props) {
  return (
    <Icon {...props}>
      <Path d="M20 11a8 8 0 1 0-2.3 5.7" />
      <Path d="M20 4v7h-7" />
    </Icon>
  );
}

export function UploadIcon(props: Props) {
  return (
    <Icon {...props}>
      <Path d="M12 16V4" />
      <Path d="M7 9l5-5 5 5" />
      <Path d="M4 16v4h16v-4" />
    </Icon>
  );
}

export function BarcodeIcon(props: Props) {
  return (
    <Icon {...props}>
      <Path d="M3 7V4h3M18 4h3v3M21 17v3h-3M6 20H3v-3" />
      <Path d="M7 8v8M10 8v8M14 8v8M17 8v8" strokeWidth={2} />
      <Path d="M12 8v8" strokeWidth={1} />
    </Icon>
  );
}

export function BackIcon(props: Props) {
  return (
    <Icon {...props}>
      <Path d="M15 5l-7 7 7 7" />
    </Icon>
  );
}

export function ScanTabIcon(props: Props) {
  return (
    <Icon {...props} width={2}>
      <Path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M7 12h10" />
    </Icon>
  );
}

export function LibraryTabIcon(props: Props) {
  return (
    <Icon {...props} width={2}>
      <Path d="M5 4h4v16H5zM10 4h4v16h-4zM15 5l4 1-3 14-4-1" />
    </Icon>
  );
}

export function ProfileTabIcon(props: Props) {
  return (
    <Icon {...props} width={2}>
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </Icon>
  );
}

export function DocumentIcon(props: Props) {
  return (
    <Icon {...props} width={2}>
      <Path d="M6 3h8l4 4v14H6z" />
      <Path d="M14 3v4h4M9 12h6M9 16h6" />
    </Icon>
  );
}

export function BoxIcon(props: Props) {
  return (
    <Icon {...props} width={2}>
      <Path d="M3 8l9-5 9 5v8l-9 5-9-5z" />
      <Path d="M3 8l9 5 9-5M12 13v8" />
    </Icon>
  );
}
