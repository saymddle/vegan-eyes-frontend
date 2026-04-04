export type DeeperItem = {
  id: string;
  ingredient: string;
  reason: string;
  substitutes: string[];
  is_favorite: boolean;
  created_at: string;
};

export type CreateDeeperItemInput = {
  ingredient: string;
  reason: string;
  substitutes: string[];
};
