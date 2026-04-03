export type BackendStatus = "vegan" | "non_vegan" | "unclear" | "error";

export type BackendIngredient = {
  name: string;
  vegan_status?: string;
  is_complex?: boolean;
  swap_static?: string;
  swap_functional?: string;
  nourishment_fact?: string;
};

export type CheckResponse = {
  status: BackendStatus;
  flagged: BackendIngredient[];
};
