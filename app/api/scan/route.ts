import { processOCRIngredients } from "@/lib/utils/ocrIngredients";

const PDF_PREFIX = "data:application/pdf;base64,";

export async function POST(req: Request) {
  const { imageBase64, pdfBase64 } = (await req.json()) as {
    imageBase64?: string;
    pdfBase64?: string;
  };

  // Photos come from the camera or Upload; PDFs only from Upload. Mistral
  // takes both as data: URLs.
  const document =
    pdfBase64 && pdfBase64.startsWith(PDF_PREFIX)
      ? { type: "document_url", document_url: pdfBase64 }
      : imageBase64 && imageBase64.startsWith("data:image/")
        ? { type: "image_url", image_url: imageBase64 }
        : null;

  if (!document) {
    return Response.json(
      { success: false, raw: "", ingredients: [] },
      { status: 400 }
    );
  }

  const ocrResponse = await fetch("https://api.mistral.ai/v1/ocr", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "mistral-ocr-latest",
      document
    })
  });

  if (!ocrResponse.ok) {
    // Only the status, never the recipe text.
    console.error("OCR FAILED:", ocrResponse.status);
  }

  const data = (await ocrResponse.json()) as {
    pages?: Array<{ markdown?: string }>;
  };

  const text = data.pages?.map((p) => p.markdown ?? "").join("\n") || "";

  const ingredients = processOCRIngredients(text);

  return Response.json({
    success: true,
    raw: text,
    ingredients
  });
}
