// app.config.js
export default ({ config }) => ({
  expo: {
    ...config,
    name: "rtr",
    slug: "rtr",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/transparent.png", // Optional: a transparent image
      resizeMode: "contain",
      backgroundColor: "#0a1a2f", // Match your loading screen background
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.wcathey.rtr",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0a1a2f", // Also match here
      },
      package: "com.wcathey.rtr",
    },
    web: {
      bundler: "metro",
    },
    plugins: [
      "expo-secure-store",
      [
        "@rnmapbox/maps",
        {
          RNMapboxMapsDownloadToken: process.env.PUBLIC_MAPBOX_ACCESS_TOKEN || "sk.ey...",
        },
      ],
    ],
    extra: {
      PUBLIC_MAPBOX_ACCESS_TOKEN: process.env.PUBLIC_MAPBOX_ACCESS_TOKEN,
      eas: {
        projectId: "a86991dd-3987-4f22-8f0e-f9075fc38a56",
      },
    },
  },
});
