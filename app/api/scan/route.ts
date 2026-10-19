import { processOCRIngredients } from "@/lib/utils/ocrIngredients";

export async function POST(req: Request) {
  const { imageBase64 } = (await req.json()) as { imageBase64?: string };

  const ocrResponse = await fetch("https://api.mistral.ai/v1/ocr", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "mistral-ocr-latest",
      document: {
        type: "image_base64",
        imageBase64
      }
    })
  });

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
