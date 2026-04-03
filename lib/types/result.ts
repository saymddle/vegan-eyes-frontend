export type UIStatus = "vegan" | "not_vegan" | "maybe";

export type UIIngredient = {
  name: string;
  status: UIStatus;
  reason?: string;
  swap?: string;
  isComplex?: boolean;
};

export type UIResult = {
  status: UIStatus;
  ingredients: UIIngredient[];
};
