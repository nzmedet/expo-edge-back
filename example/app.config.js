const path = require('path');

const asset = (file) => path.join(__dirname, 'assets', file);

module.exports = {
  expo: {
    name: 'ExpoEdgeBack Example',
    slug: 'expo-edge-back-example',
    version: '1.0.0',
    orientation: 'portrait',
    icon: asset('icon.png'),
    userInterfaceStyle: 'light',
    splash: {
      image: asset('splash-icon.png'),
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'expoedgeback.example',
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: asset('android-icon-foreground.png'),
        backgroundImage: asset('android-icon-background.png'),
        monochromeImage: asset('android-icon-monochrome.png'),
      },
      package: 'expoedgeback.example',
    },
    web: {
      favicon: asset('favicon.png'),
    },
  },
};
