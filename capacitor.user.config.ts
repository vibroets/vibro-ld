import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vibro.user',
  appName: 'Vibro User',
  webDir: 'build-user',
  android: {
    path: 'android-user',
  },
  server: {
    androidScheme: 'http',
    cleartext: true,
  },
};

export default config;
