import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.colisan.mundoletras',
  appName: 'Mundo Letras',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1e3a8a",
      showSpinner: false
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#1e3a8a"
    }
  }
};

export default config;
