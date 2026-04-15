import { NextRequest, NextResponse } from "next/server";

type MistralOCRResponse = {
  pages?: Array<{
    markdown?: string;
    text?: string;
  }>;
};

export async function POST(req: NextRequest) {
  try {
    const { image } = (await req.json()) as { image?: string };

    if (!image) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing image payload"
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.MISTRAL_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "MISTRAL_API_KEY is not configured"
        },
        { status: 500 }
      );
    }

    const base64 = image.replace(/^data:image\/\w+;base64,/, "");

    const mistralRes = await fetch("https://api.mistral.ai/v1/ocr", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "mistral-ocr-latest",
        document: {
          type: "image_base64",
          image_base64: base64
        }
      })
    });

    const result = (await mistralRes.json()) as MistralOCRResponse & {
      message?: string;
    };

    if (!mistralRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error: result.message ?? "OCR processing failed"
        },
        { status: mistralRes.status }
      );
    }

    const text =
      result.pages?.map((page) => page.markdown ?? page.text ?? "").join("\n\n") ?? "";

    return NextResponse.json({
      success: true,
      data: result,
      text
    });
  } catch (error) {
    console.error("OCR processing failed", error);

    return NextResponse.json(
      {
        success: false,
        error: "OCR processing failed"
      },
      { status: 500 }
    );
  }
}
