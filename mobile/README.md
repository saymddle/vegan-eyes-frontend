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

## Publishing to the App Store

You need an Apple Developer account ($99 a year,
https://developer.apple.com/programs/enroll/). Apple can take a day or two to
approve it.

Then, on your computer, in this folder:

```bash
npm install -g eas-cli
eas login                 # the same Expo account you use for Expo Go
eas init                  # links this folder to a project on expo.dev (commit the app.json change it makes)
eas build --platform ios --profile production
```

The build runs on Expo's servers. The first time, it asks you to sign in with
your Apple ID and makes the signing certificates for you. When it finishes:

```bash
eas submit --platform ios --latest
```

That uploads the build to App Store Connect. It shows up in TestFlight first,
so you can install it on your own iPhone before anyone else sees it.

To release it, open https://appstoreconnect.apple.com, pick Vegan Eyes and fill
in the listing:

- Privacy policy URL: https://vegan-eyes-frontend.vercel.app/privacy
- Support URL: https://vegan-eyes-frontend.vercel.app/support
- Screenshots from a 6.9" iPhone (take them in the iOS Simulator or on a Pro Max).
- App Privacy: "Data linked to you" = email address and the content you save
  (recipes, scans); used for app functionality only; no tracking.
- Sign-in details for the reviewer: a test account email and password.

Then press Submit for Review. Review usually takes a day or two.

The bundle ID is `app.veganeyes` (in `app.json`). If Apple says it's taken,
change it there before the first build; it can't change after release.

Android later works the same way with `--platform android` and a Google Play
developer account ($25 once).
