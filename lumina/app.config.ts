import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Lumina',
  slug: 'lumina',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0A0A14',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.lumina.app',
    buildNumber: '1',
    entitlements: {
      'com.apple.developer.family-controls': true,
      'com.apple.security.application-groups': ['group.com.lumina.app'],
    },
    infoPlist: {
      NSUserTrackingUsageDescription:
        'Lumina uses screen time data to generate personalized wellness insights.',
      UIBackgroundModes: ['fetch', 'remote-notification'],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0A0A14',
    },
    package: 'com.lumina.app',
    versionCode: 1,
    permissions: [
      'android.permission.PACKAGE_USAGE_STATS',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.VIBRATE',
    ],
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#7C5CFC',
        sounds: ['./assets/sounds/gentle-chime.wav'],
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#0A0A14',
        image: './assets/splash.png',
        imageWidth: 200,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    eas: {
      projectId: 'lumina-screen-time',
    },
  },
});
