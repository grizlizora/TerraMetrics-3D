import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.terrametrics.globe3d',
  appName: 'TerraMetrics 3D',
  webDir: 'dist',
  bundledWebRuntime: false,
  backgroundColor: '#000000',
  server: {
    androidScheme: 'https',
    iosScheme: 'terrametrics',
    cleartext: false,
    allowNavigation: [
      'server.arcgisonline.com',
      'api.open-meteo.com',
      'api.worldbank.org',
      'studies.cs.helsinki.fi',
      'drive.google.com',
      '*.googleusercontent.com'
    ]
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    backgroundColor: '#000000'
  },
  ios: {
    contentInset: 'never',
    backgroundColor: '#000000',
    preferredContentMode: 'mobile',
    limitsNavigationsToAppBoundDomains: true,
    scrollEnabled: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#000000',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK'
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true
    }
  }
};

export default config;
