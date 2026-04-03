import type { CheckResponse } from "../types/check";
import type { UIResult, UIStatus } from "../types/result";

const statusMap = {
  vegan: "vegan",
  non_vegan: "not_vegan",
  unclear: "maybe"
} as const satisfies Record<Exclude<CheckResponse["status"], "error">, UIStatus>;

export function adaptCheckResponse(data: CheckResponse): UIResult {
  if (data.status === "error") {
    throw new Error("Backend error");
  }

  return {
    status: statusMap[data.status],
    ingredients: data.flagged.map((item) => ({
      name: item.name,
      status: item.vegan_status === "non_vegan" ? "not_vegan" : "maybe",
      reason: item.nourishment_fact,
      swap: item.swap_static || item.swap_functional,
      isComplex: item.is_complex
    }))
  };
}
