import type { Product } from "@shared/products/openFoodFacts";
import type { RewriteResult } from "@shared/ingredients/rewrite";
import { API_BASE } from "./config";

// The few jobs that need a secret key stay on the server: reading text in
// photos and PDFs, looking up barcodes, and rewording steps.

export async function scanText(
  payload: { imageBase64: string } | { pdfBase64: string }
) {
  const res = await fetch(`${API_BASE}/api/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = (await res.json().catch(() => ({}))) as { raw?: string };
  return { ok: res.ok, raw: data.raw ?? "" };
}

export async function lookupBarcode(barcode: string) {
  const res = await fetch(
    `${API_BASE}/api/product?barcode=${encodeURIComponent(barcode)}`
  );
  const data = (await res.json().catch(() => ({}))) as { product?: Product };
  return { status: res.status, ok: res.ok, product: data.product ?? null };
}

export async function rewriteSteps(body: string): Promise<(string | null)[]> {
  try {
    const res = await fetch(`${API_BASE}/api/rewrite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body
    });
    if (!res.ok) return [];
    return ((await res.json()) as RewriteResult).steps ?? [];
  } catch {
    return [];
  }
}
