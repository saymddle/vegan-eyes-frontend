# Vegan Eyes on the App Store

The iPhone app is a small native shell (Capacitor) around the live site at
`https://vegan-eyes-frontend.vercel.app`. The app and the website run the same
code, so every merge to `main` updates both, with no new App Store release
needed for most changes.

What lives where:

| Path | What it is |
| --- | --- |
| `capacitor.config.ts` | App name, bundle ID (`app.veganeyes.ios`), site URL, splash and status bar colors |
| `ios/` | The Xcode project. Icon and splash are in `ios/App/App/Assets.xcassets`; permission text is in `ios/App/App/Info.plist` |
| `native-shell/offline.html` | The page shown when there is no internet |
| `lib/features.ts` | Switches for parts of the app (Community is off for version 1) |

## Building it (needs a Mac)

1. Install Xcode from the Mac App Store and open it once to accept the license.
2. Join the Apple Developer Program ($99 a year) at developer.apple.com.
3. On the Mac:

   ```sh
   git clone https://github.com/saymddle/vegan-eyes-frontend.git
   cd vegan-eyes-frontend
   npm install
   npm run ios:sync   # copies the config and offline page into ios/
   npm run ios:open   # opens the project in Xcode
   ```

4. In Xcode, click **App** in the left sidebar, then **Signing & Capabilities**,
   and pick your team. If `app.veganeyes.ios` is taken, change the Bundle
   Identifier (and `appId` in `capacitor.config.ts`) to something you own.
5. Pick an iPhone simulator or your plugged-in iPhone at the top and press ▶.

To try a preview deployment instead of the live site:
`CAP_SERVER_URL=https://<preview-url> npm run ios:sync`, then run again.

## Sending it to Apple

1. In App Store Connect (appstoreconnect.apple.com), create a new app with the
   same bundle ID.
2. In Xcode: **Product → Archive**, then **Distribute App → App Store Connect**.
3. In App Store Connect, fill in:
   - Screenshots for 6.9" and 6.5" iPhones
   - Description, keywords, support URL
   - Privacy policy URL: `https://vegan-eyes-frontend.vercel.app/privacy`
   - App Privacy: email address (account), photos (only read to find
     ingredients, not stored by us unless you save a scan), user content
     (saved scans, swap reports)
   - Sign-in details for the reviewer: make a test account and give its
     email and password
4. Submit for review.

## Known limits of version 1

- Confirmation and password emails open in Safari, not in the app.
- Without internet the app shows the offline page; scanning needs a connection.
