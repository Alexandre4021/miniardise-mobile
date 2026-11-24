import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Trois variantes installables côte à côte : development, preview (recette), production.
 * APP_VARIANT est fixé par les profils de build dans eas.json.
 */
type Variant = 'development' | 'preview' | 'production';
const variant = (process.env.APP_VARIANT ?? 'development') as Variant;

const BASE_ID = 'fr.epiceriefineminiardise.app';
const suffix: Record<Variant, string> = { development: '.dev', preview: '.preview', production: '' };
const nameSuffix: Record<Variant, string> = { development: ' (Dev)', preview: ' (Recette)', production: '' };

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: `Miniardise${nameSuffix[variant]}`,
  slug: 'miniardise',
  owner: undefined,
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: variant === 'production' ? 'miniardise' : `miniardise-${variant}`,
  userInterfaceStyle: 'light', // Mode clair uniquement en V1 (décision ADR)
  ios: {
    bundleIdentifier: BASE_ID + suffix[variant],
    supportsTablet: false,
    icon: './assets/images/icon.png',
    config: { usesNonExemptEncryption: false },
    privacyManifests: {
      NSPrivacyTracking: false,
      NSPrivacyTrackingDomains: [],
      NSPrivacyCollectedDataTypes: [],
      NSPrivacyAccessedAPITypes: [],
    },
  },
  android: {
    package: BASE_ID + suffix[variant],
    adaptiveIcon: {
      backgroundColor: '#1E1A12',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    blockedPermissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.SYSTEM_ALERT_WINDOW',
    ],
  },
  web: { output: 'single', favicon: './assets/images/favicon.png' },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-splash-screen',
      { backgroundColor: '#FBF8F1', image: './assets/images/splash-icon.png', imageWidth: 168 },
    ],
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
  extra: { variant },
});
