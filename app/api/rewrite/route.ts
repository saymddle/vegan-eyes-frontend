import { getIngredientIndex } from "@/lib/ingredients/loadIndex";
import {
  acceptStep,
  isReasonableRequest,
  rewriteMessages,
  type RewriteRequest,
  type RewriteResult
} from "@/lib/ingredients/rewrite";

// POST /api/rewrite with a RewriteRequest. Returns { steps } with one entry
// per step: the reworded step, or null to keep the plain one. Any failure
// returns an error and the app simply shows the plain steps.
export async function POST(req: Request) {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) {
    return Response.json({ error: "not_configured" }, { status: 503 });
  }

  let request: RewriteRequest;
  try {
    request = (await req.json()) as RewriteRequest;
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  if (!request || !isReasonableRequest(request)) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  try {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: rewriteMessages(request)
      }),
      signal: AbortSignal.timeout(25000)
    });

    if (!res.ok) {
      console.error("REWRITE FAILED:", res.status);
      return Response.json({ error: "rewrite_failed" }, { status: 502 });
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = JSON.parse(data.choices?.[0]?.message?.content ?? "{}") as {
      steps?: unknown[];
    };
    if (
      !Array.isArray(reply.steps) ||
      reply.steps.length !== request.steps.length
    ) {
      return Response.json({ error: "rewrite_failed" }, { status: 502 });
    }

    // The database checks every reworded step before it is used.
    const index = await getIngredientIndex();
    const result: RewriteResult = {
      steps: request.steps.map((plain, at) =>
        acceptStep(plain, reply.steps?.[at], index)
      )
    };
    return Response.json(result);
  } catch (error) {
    console.error(
      "REWRITE FAILED:",
      error instanceof Error ? error.name : "unknown"
    );
    return Response.json({ error: "rewrite_failed" }, { status: 502 });
  }
}
