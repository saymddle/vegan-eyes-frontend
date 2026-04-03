import type { CheckResponse } from "@/lib/types/check";

const nonVeganMatches = [
  {
    match: "gelatin",
    name: "Gelatin",
    swap: "Agar agar",
    nourishment: "Gelatin is animal collagen and adds protein but not fiber."
  },
  {
    match: "milk",
    name: "Milk",
    swap: "Oat milk powder",
    nourishment: "Dairy milk contributes calcium and protein but is animal-derived."
  },
  {
    match: "whey",
    name: "Whey",
    swap: "Pea protein",
    nourishment: "Whey is a milk protein and may support amino acid intake."
  },
  {
    match: "casein",
    name: "Casein",
    swap: "Soy protein isolate",
    nourishment: "Casein is a dairy protein used for texture and slow digestion."
  },
  {
    match: "honey",
    name: "Honey",
    swap: "Maple syrup",
    nourishment: "Honey is bee-produced sugar with trace minerals."
  }
];

const unclearMatches = [
  {
    match: "natural flavor",
    name: "Natural Flavor",
    swap: "Certified vegan flavoring",
    nourishment: "Natural flavors can be plant or animal sourced depending on supplier."
  },
  {
    match: "mono-",
    name: "Mono- and Diglycerides",
    swap: "Sunflower lecithin",
    nourishment: "These emulsifiers can come from vegetable or animal fats."
  },
  {
    match: "enzymes",
    name: "Enzymes",
    swap: "Microbial enzymes",
    nourishment: "Enzyme sourcing varies and may require manufacturer verification."
  },
  {
    match: "lecithin",
    name: "Lecithin",
    swap: "Sunflower lecithin",
    nourishment: "Lecithin is often soy or sunflower based but should be source checked."
  }
];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { ingredients?: string };
    const ingredients = (body.ingredients || "").toLowerCase();

    if (!ingredients.trim()) {
      const emptyResponse: CheckResponse = {
        status: "error",
        flagged: []
      };

      return Response.json(emptyResponse, { status: 400 });
    }

    const flagged: CheckResponse["flagged"] = [];

    nonVeganMatches.forEach((entry) => {
      if (ingredients.includes(entry.match)) {
        flagged.push({
          name: entry.name,
          vegan_status: "non_vegan",
          is_complex: false,
          swap_static: entry.swap,
          nourishment_fact: entry.nourishment
        });
      }
    });

    unclearMatches.forEach((entry) => {
      if (ingredients.includes(entry.match)) {
        flagged.push({
          name: entry.name,
          vegan_status: "unclear",
          is_complex: true,
          swap_functional: entry.swap,
          nourishment_fact: entry.nourishment
        });
      }
    });

    const response: CheckResponse = {
      status: flagged.some((item) => item.vegan_status === "non_vegan")
        ? "non_vegan"
        : flagged.length > 0
          ? "unclear"
          : "vegan",
      flagged
    };

    return Response.json(response);
  } catch {
    const errorResponse: CheckResponse = {
      status: "error",
      flagged: []
    };

    return Response.json(errorResponse, { status: 500 });
  }
}
