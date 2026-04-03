import { adaptCheckResponse } from "../adapters/checkAdapter";
import type { CheckResponse } from "../types/check";
import type { UIResult } from "../types/result";

export async function checkIngredients(input: string): Promise<UIResult> {
  const res = await fetch("/api/check", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ ingredients: input })
  });

  if (!res.ok) {
    throw new Error("Request failed");
  }

  const data = (await res.json()) as CheckResponse;

  return adaptCheckResponse(data);
}
