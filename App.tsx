
import React, { useEffect } from 'react'
import { Alert, Linking, LogBox, PermissionsAndroid, Platform, NativeModules } from 'react-native';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import AppProvider from './src/provider/AppProvider';

function App(): React.JSX.Element {
  const theme = {
    ...MD3LightTheme, // or MD3DarkTheme
    roundness: 2,
    colors: {
      ...MD3LightTheme.colors,
      primary: '#EF5350',
      secondary: '#3087d8',
      tertiary: '#2b384b',
      background: '#10182b'
    },
  };

  useEffect(() => {
    // LogBox.ignoreAllLogs();

    const init = async () => {
      await requestMicrophonePermission();
      await requestPermissionSpeech();
      await requestPermissionWifi();
    };

    init();
  }, [])

  // Request microphone permission
  async function requestMicrophonePermission() {
    if (Platform.OS !== 'android') return true;

    try {
      const hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
      console.log(hasPermission)
      if (hasPermission) {
        return true;
      }

      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'This app needs access to your microphone for speech recognition',
          buttonPositive: 'OK',
          buttonNegative: 'Cancel',
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      } else if (granted === PermissionsAndroid.RESULTS.DENIED) {
        Alert.alert('Permission denied', 'You need to allow microphone access to use this feature');
        return false;
      } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        Alert.alert(
          'Permission denied permanently',
          'Please enable microphone permission from settings'
        );
        return false;
      }

      return false;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }

  async function requestPermissionSpeech() {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ]);

        if (
          grants['android.permission.WRITE_EXTERNAL_STORAGE'] ===
          PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.READ_EXTERNAL_STORAGE'] ===
          PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log('All permissions granted');
        } else {
          console.log('All required permissions not granted');
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }
  }

  async function requestPermissionWifi() {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      const allGranted = Object.values(granted).every(status => status === PermissionsAndroid.RESULTS.GRANTED);
      if (!allGranted) {
        throw new Error('Wifi connection permissions not granted');
      }
    }
  }

  return (
    <PaperProvider theme={theme}>
      <AppProvider />
    </PaperProvider>
  )
}

export default App;