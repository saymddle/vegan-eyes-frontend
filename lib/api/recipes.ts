import { supabase } from "@/lib/supabase/client";
import type { VeganizedRecipe } from "@/lib/ingredients/veganize";
import type { RecipeSource } from "@/lib/store/recipeInput";
import { requireSupabaseUserId } from "./scansAuth";

export type SavedRecipe = {
  id: string;
  title: string;
  sourceType: RecipeSource;
  sourceInput: string;
  recipe: VeganizedRecipe;
  isFavorite: boolean;
  createdAt: string;
};

type RecipeRow = {
  id: string;
  title: string;
  source_type: RecipeSource;
  source_input: string | null;
  veganized: VeganizedRecipe;
  is_favorite: boolean;
  created_at: string;
};

const COLUMNS =
  "id, title, source_type, source_input, veganized, is_favorite, created_at";

function toSavedRecipe(row: RecipeRow): SavedRecipe {
  return {
    id: row.id,
    title: row.title,
    sourceType: row.source_type,
    sourceInput: row.source_input ?? "",
    recipe: row.veganized,
    isFavorite: row.is_favorite,
    createdAt: row.created_at
  };
}

function client() {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }
  return supabase;
}

export async function saveRecipe(
  title: string,
  sourceType: RecipeSource,
  sourceInput: string,
  recipe: VeganizedRecipe
): Promise<SavedRecipe> {
  const db = client();
  const userId = await requireSupabaseUserId();

  const { data, error } = await db
    .from("recipes")
    .insert({
      user_id: userId,
      title,
      source_type: sourceType,
      source_input: sourceInput,
      original: { text: sourceInput },
      veganized: recipe,
      flagged_items: recipe.swaps
    })
    .select(COLUMNS)
    .single();

  if (error || !data) {
    throw new Error("Failed to save recipe");
  }

  return toSavedRecipe(data as RecipeRow);
}

export async function getRecipes(): Promise<SavedRecipe[]> {
  const db = client();
  const userId = await requireSupabaseUserId();

  const { data, error } = await db
    .from("recipes")
    .select(COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to load recipes");
  }

  return (data || []).map((row) => toSavedRecipe(row as RecipeRow));
}

export async function getRecipeById(id: string): Promise<SavedRecipe | null> {
  const db = client();
  const userId = await requireSupabaseUserId();

  const { data, error } = await db
    .from("recipes")
    .select(COLUMNS)
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("Failed to load recipe");
  }

  return data ? toSavedRecipe(data as RecipeRow) : null;
}

export async function deleteRecipe(id: string) {
  const db = client();
  const userId = await requireSupabaseUserId();

  const { error } = await db
    .from("recipes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw new Error("Failed to delete recipe");
  }
}
