export default ({ config }) => ({
  expo: {
    ...config,
    name: "rtr",
    slug: "rtr",
    version: "1.0.0",
    sdkVersion: "52.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.wcathey.rtr",
      infoPlist: {
        NSCameraUsageDescription: 'We need access to your camera to scan documents.',
      },
    },
    android: {
      permissions: ['CAMERA'],
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      package: "com.wcathey.rtr",
    },
    plugins: [
      "expo-secure-store",
      [
        "@rnmapbox/maps",
        {
          RNMapboxMapsDownloadToken: process.env.PUBLIC_MAPBOX_ACCESS_TOKEN || "sk.ey...",
        },
      ],
      [
        "expo-location",
        {
          locationWhenInUsePermission: "Show current location on map.",
        },
      ],
      [
        'react-native-document-scanner-plugin',
        {
          cameraPermission:
            'We need camera access, so you can scan documents',
        },
      ],
      [
        "expo-camera",
        {
          cameraPermission:
          "Allow this app to use your camera for document scanning"

        }
      ],
      
      "expo-dev-client", // Add the expo-dev-client plugin
    ],
    extra: {
      PUBLIC_MAPBOX_ACCESS_TOKEN: process.env.PUBLIC_MAPBOX_ACCESS_TOKEN,
      eas: {
        projectId: "a86991dd-3987-4f22-8f0e-f9075fc38a56",
      },
    },
  },
});
