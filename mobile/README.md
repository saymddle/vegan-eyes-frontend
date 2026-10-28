# Vegan Eyes app (iPhone and Android)

The native app, built with Expo (React Native). It shares the ingredient
checker and recipe converter with the rest of the repo (`../lib`), and
carries a copy of the ingredient database (`../tests/fixtures/ingredients.json`)
so checks work offline. When online it fetches the latest rows from Supabase
and keeps them for next time.

Reading photos and PDFs, barcode lookups and step rewording still go through
the server (`/api/scan`, `/api/product`, `/api/rewrite`) because they need
secret keys. Set `EXPO_PUBLIC_API_BASE` to point at a different server.

## Try it on your phone

1. Install **Expo Go** from the App Store or Google Play.
2. On your computer, in this folder:
   ```bash
   npm install
   npx expo start
   ```
3. Scan the QR code: with the Camera app on iPhone, or from Expo Go on Android.
   Your phone and computer need to be on the same Wi-Fi (or run
   `npx expo start --tunnel`).

## Layout

- `src/app/` screens (Expo Router): the Scan tab holds Scan and its Results;
  the Library tab holds saved scans, Recent, Recipes and Deeper; the Profile
  tab holds Profile and Delete account. Sign-in opens over any screen.
- `src/components/` buttons, cards and the recipe view.
- `src/lib/` the scan store, server calls, saving to Supabase (`data.ts`), the
  on-phone database and helpers.
- `src/theme.ts` colors, fonts and sizes.

## Checks

```bash
npx tsc --noEmit
```
