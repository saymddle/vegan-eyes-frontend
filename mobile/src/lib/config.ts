// Public settings. The Supabase publishable key is meant to ship inside
// apps; row level security decides what it can read and write.
export const SUPABASE_URL = "https://iemngokrktriicxcbvac.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_cHpI9-3lvruhguRl7JW8VA_lOU8-zn0";

// The private backend for work that needs secret keys: reading photos and
// PDFs, rewording steps with AI, and looking up barcodes.
export const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE ?? "https://vegan-eyes-frontend.vercel.app";
