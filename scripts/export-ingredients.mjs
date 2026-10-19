// Refreshes tests/fixtures/ingredients.json from Supabase, so the converter
// tests use the current ingredient list.
//
//   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
//     npm run test:snapshot-db
//
// Then run `npm test` and review what changed.
import { writeFileSync } from "node:fs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
  process.exit(1);
}

async function get(path, from) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Range: `${from}-${from + 999}`
    }
  });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function all(path) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const page = await get(path, from);
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}

const ingredients = await all(
  "ingredients?select=name,vegan_status,lab_note,swap_static,swap_functional,is_complex,aliases&order=id"
);
const synonyms = (
  await all("synonyms?select=alias,ingredients(name)&order=alias")
)
  .map((row) => ({ alias: row.alias, ingredient_name: row.ingredients?.name }))
  .filter((row) => row.ingredient_name);

const line = (row) => `    ${JSON.stringify(row)}`;
const today = new Date().toISOString().slice(0, 10);
const note =
  "Snapshot of the Supabase ingredients and synonyms tables, used by the converter tests. Refresh with: npm run test:snapshot-db (see tests/README.md).";
writeFileSync(
  new URL("../tests/fixtures/ingredients.json", import.meta.url),
  [
    "{",
    `  "exported": "${today}",`,
    `  "note": ${JSON.stringify(note)},`,
    '  "ingredients": [',
    ingredients.map(line).join(",\n"),
    "  ],",
    '  "synonyms": [',
    synonyms.map(line).join(",\n"),
    "  ]",
    "}",
    ""
  ].join("\n")
);
console.log(
  `Saved ${ingredients.length} ingredients and ${synonyms.length} synonyms.`
);
