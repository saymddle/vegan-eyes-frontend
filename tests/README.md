# Converter tests

These check that recipes convert to vegan correctly, using a saved copy of
the ingredient database so they run offline and give the same result every
time.

```
npm test          # run everything
npm test -- -u    # accept intended changes to the saved vegan versions
```

They also run on every pull request (`.github/workflows/test.yml`).

## What is checked

- `ingredients.test.ts`: about 600 ingredient names as people write them. Every
  non-vegan one must be flagged, and no vegan one may be flagged as
  non-vegan.
- `recipes.test.ts`: the recipes in `recipes/`, written the many ways people
  paste them (website copies with checkboxes, OCR markdown, several items on
  one line, "vegan butter" and other vegan labels, words like "butternut").
  Each recipe has its expected verdict, its substitutions, lines that must
  appear, and a saved copy of the whole vegan version.

Known misses are listed in the tests and run as expected failures. When one
gets fixed, its test fails and says so; move it into the normal checks.

## Adding a recipe

1. Save it as `recipes/NN-short-name.txt`, exactly as a user would paste it.
2. Add a case for it in `recipes.test.ts`.
3. Run `npm test -- -u` once to save its vegan version, then read the saved
   copy in `__snapshots__/` to make sure it is right.

## After changing the ingredient database

Refresh the saved copy, then run the tests and review the differences:

```
NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... npm run test:snapshot-db
npm test
```
