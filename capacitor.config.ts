import type { CapacitorConfig } from "@capacitor/cli";

// The iPhone app is a native shell around the live Vegan Eyes site, so the
// app and the website always run the same code and the same API routes.
// Set CAP_SERVER_URL to try a preview deployment before `npx cap sync ios`.
const serverUrl = process.env.CAP_SERVER_URL ?? "https://vegan-eyes-frontend.vercel.app";

const config: CapacitorConfig = {
  appId: "app.veganeyes.ios",
  appName: "Vegan Eyes",
  // Shown only when the site can't load (no internet).
  webDir: "native-shell",
  server: {
    url: serverUrl,
    errorPath: "offline.html",
    allowNavigation: ["*.supabase.co"]
  },
  ios: {
    contentInset: "never",
    backgroundColor: "#FFF7E8",
    limitsNavigationsToAppBoundDomains: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: "#214E34",
      showSpinner: false
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#FFF7E8",
      overlaysWebView: false
    }
  }
};

export default config;
