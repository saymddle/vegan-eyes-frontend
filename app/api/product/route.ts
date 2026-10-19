import { OFF_FIELDS, isBarcode, toProduct } from "@/lib/products/openFoodFacts";

// GET /api/product?barcode=5000159484695
// 200 { product } when found, 404 when the barcode isn't known, 502 when
// Open Food Facts can't be reached.
export async function GET(req: Request) {
  const barcode = new URL(req.url).searchParams.get("barcode")?.trim() ?? "";

  if (!isBarcode(barcode)) {
    return Response.json({ error: "invalid_barcode" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=${OFF_FIELDS}`,
      {
        // Open Food Facts asks every app to name itself.
        headers: {
          "User-Agent":
            "VeganEyes/1.0 (https://github.com/saymddle/vegan-eyes-frontend)"
        },
        signal: AbortSignal.timeout(8000),
        next: { revalidate: 86400 }
      }
    );

    if (res.status === 404) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    if (!res.ok) {
      console.error("PRODUCT LOOKUP FAILED:", res.status);
      return Response.json({ error: "lookup_failed" }, { status: 502 });
    }

    const product = toProduct(barcode, await res.json());
    if (!product) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    return Response.json({ product });
  } catch {
    return Response.json({ error: "lookup_failed" }, { status: 502 });
  }
}
