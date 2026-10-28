import type { VeganizedRecipe } from "@shared/ingredients/veganize";
import type { UIResult } from "@shared/types/result";
import type { RecipeSource } from "./scanStore";
import { supabase } from "./supabase";

// Everything the app saves to or reads from a signed-in account. Same
// tables and rules as the website.

export const AUTH_REQUIRED_ERROR = "AUTH_REQUIRED";

export function isAuthError(error: unknown) {
  return error instanceof Error && error.message === AUTH_REQUIRED_ERROR;
}

async function userId() {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error(AUTH_REQUIRED_ERROR);
  return id;
}

// Scans

export type SavedScan = { id: string; input: string; result: UIResult; timestamp: string };
type ScanRow = { id: string; input: string; result: UIResult; created_at: string };
const toScan = (row: ScanRow): SavedScan => ({
  id: row.id,
  input: row.input,
  result: row.result,
  timestamp: row.created_at
});

export async function saveScan(input: string, result: UIResult) {
  const user = await userId();
  const { data, error } = await supabase
    .from("scans")
    .insert({ user_id: user, input, result })
    .select("id, input, result, created_at")
    .single();
  if (error || !data) throw new Error("Failed to save scan");
  return toScan(data as ScanRow);
}

export async function getScans() {
  const user = await userId();
  const { data, error } = await supabase
    .from("scans")
    .select("id, input, result, created_at")
    .eq("user_id", user)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Failed to load scans");
  return (data ?? []).map((row) => toScan(row as ScanRow));
}

// Recipes

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
const RECIPE_COLUMNS = "id, title, source_type, source_input, veganized, is_favorite, created_at";
const toRecipe = (row: RecipeRow): SavedRecipe => ({
  id: row.id,
  title: row.title,
  sourceType: row.source_type,
  sourceInput: row.source_input ?? "",
  recipe: row.veganized,
  isFavorite: row.is_favorite,
  createdAt: row.created_at
});

export async function saveRecipe(
  title: string,
  sourceType: RecipeSource,
  sourceInput: string,
  recipe: VeganizedRecipe
) {
  const user = await userId();
  const { data, error } = await supabase
    .from("recipes")
    .insert({
      user_id: user,
      title,
      source_type: sourceType,
      source_input: sourceInput,
      original: { text: sourceInput },
      veganized: recipe,
      flagged_items: recipe.swaps
    })
    .select(RECIPE_COLUMNS)
    .single();
  if (error || !data) throw new Error("Failed to save recipe");
  return toRecipe(data as RecipeRow);
}

export async function getRecipes() {
  const user = await userId();
  const { data, error } = await supabase
    .from("recipes")
    .select(RECIPE_COLUMNS)
    .eq("user_id", user)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Failed to load recipes");
  return (data ?? []).map((row) => toRecipe(row as RecipeRow));
}

export async function getRecipeById(id: string) {
  const user = await userId();
  const { data, error } = await supabase
    .from("recipes")
    .select(RECIPE_COLUMNS)
    .eq("id", id)
    .eq("user_id", user)
    .maybeSingle();
  if (error) throw new Error("Failed to load recipe");
  return data ? toRecipe(data as RecipeRow) : null;
}

export async function deleteRecipe(id: string) {
  const user = await userId();
  const { error } = await supabase.from("recipes").delete().eq("id", id).eq("user_id", user);
  if (error) throw new Error("Failed to delete recipe");
}

// Deeper insights

export type DeeperItem = {
  id: string;
  ingredient: string;
  reason: string;
  substitutes: string[];
  is_favorite: boolean;
  created_at: string;
};
const DEEPER_COLUMNS = "id, ingredient, reason, substitutes, is_favorite, created_at";

export async function saveDeeper(item: { ingredient: string; reason: string; substitutes: string[] }) {
  const user = await userId();
  const ingredient = item.ingredient.trim();
  const { data: existing, error: lookupError } = await supabase
    .from("deeper_insights")
    .select(DEEPER_COLUMNS)
    .eq("user_id", user)
    .ilike("ingredient", ingredient)
    .limit(1)
    .maybeSingle();
  if (lookupError) throw new Error("Failed to check saved insights");
  if (existing) return existing as DeeperItem;

  const { data, error } = await supabase
    .from("deeper_insights")
    .insert({ user_id: user, ingredient, reason: item.reason, substitutes: item.substitutes, is_favorite: false })
    .select(DEEPER_COLUMNS)
    .single();
  if (error || !data) throw new Error("Failed to save insight");
  return data as DeeperItem;
}

export async function getDeeper() {
  const user = await userId();
  const { data, error } = await supabase
    .from("deeper_insights")
    .select(DEEPER_COLUMNS)
    .eq("user_id", user)
    .order("is_favorite", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error("Failed to load deeper insights");
  return (data ?? []) as DeeperItem[];
}

export async function toggleFavorite(id: string, nextFavorite: boolean) {
  const user = await userId();
  const { data, error } = await supabase
    .from("deeper_insights")
    .update({ is_favorite: nextFavorite })
    .eq("id", id)
    .eq("user_id", user)
    .select(DEEPER_COLUMNS)
    .single();
  if (error || !data) throw new Error("Failed to update favorite");
  return data as DeeperItem;
}

// Swap reports

export type SwapReportReason = "not_vegan" | "wrong_swap" | "already_vegan" | "other";

export async function reportSwap(report: {
  ingredient: string;
  suggestedSwap?: string;
  recipeLine?: string;
  reason: SwapReportReason;
  note?: string;
}) {
  const user = await userId();
  const { error } = await supabase.from("swap_reports").insert({
    user_id: user,
    ingredient: report.ingredient.slice(0, 200),
    suggested_swap: report.suggestedSwap?.slice(0, 300) ?? null,
    recipe_line: report.recipeLine?.slice(0, 500) ?? null,
    reason: report.reason,
    note: report.note?.trim().slice(0, 500) || null
  });
  if (error) throw error;
}

// Profile

export type Profile = { displayName: string; bio: string };

export async function getProfile(): Promise<Profile> {
  const user = await userId();
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, bio")
    .eq("id", user)
    .maybeSingle();
  if (error) throw error;
  return { displayName: data?.display_name ?? "", bio: data?.bio ?? "" };
}

// The sign-up trigger creates the row, but older accounts may not have one.
export async function saveProfile(profile: Profile) {
  const user = await userId();
  const { error } = await supabase.from("profiles").upsert({
    id: user,
    display_name: profile.displayName.trim() || null,
    bio: profile.bio.trim() || null,
    updated_at: new Date().toISOString()
  });
  if (error) throw error;
}

// Account deletion

export const DELETE_PHRASE = "me no longer need Vegan Eyes";

export function matchesDeletePhrase(text: string) {
  const clean = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();
  return clean(text) === clean(DELETE_PHRASE);
}

// Deletes the account and everything saved with it, then clears the
// sign-in on this phone.
export async function deleteMyAccount() {
  const { error } = await supabase.rpc("delete_my_account");
  if (error) throw error;
  await supabase.auth.signOut({ scope: "local" });
}
