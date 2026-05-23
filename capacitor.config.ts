import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mirror.app',
  appName: 'Mirror',
  webDir: 'public',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  }
};

export default config;
