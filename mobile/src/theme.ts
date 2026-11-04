// The Modern Organic palette and type, same as the website had.
export const colors = {
  forest: "#214E34",
  cream: "#FFF7E8",
  leaf: "#A9D94C",
  tomato: "#E65A43",
  butter: "#F5CF61",
  ink: "#20251F",
  muted: "#5B6158",
  white: "#FFFFFF",
  swapHighlight: "#DCEFB3",
  skeleton: "#EADFC8"
} as const;

export const fonts = {
  display: "LilitaOne_400Regular",
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold"
} as const;

export const radius = { sm: 8, md: 12, lg: 18, pill: 999 } as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

// Status colors for verdicts and swap cards.
export const statusColors = {
  vegan: colors.leaf,
  not_vegan: colors.tomato,
  maybe: colors.butter
} as const;
