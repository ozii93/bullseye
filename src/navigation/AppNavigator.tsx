import {
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { memo, useEffect, useRef } from 'react'
// import LoginScreen from '../screens/LoginScreen'
// import LiveControlScreen from '../screens/LiveControlScreen'
// import PairDeviceScreenOnBoard from '../screens/PairDeviceScreenOnBoard'
// import PairDeviceScreen from '../screens/PairDeviceScreen'
// import ScanDevicesScreen from '../screens/ScanDeviceScreen'
import React from 'react'
import BottomTabBar from '../components/layout/BottomTabBar'
import { Alert, BackHandler } from 'react-native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import HomeScreen from '../screens/HomeScreen'
// import FAQScreen from '../screens/FAQScreen'
// import AboutScreen from '../screens/AboutScreen'

type MainStackParamList = {
  Home: undefined
  Login: undefined
  Main: undefined
  LiveControl: undefined
  PairDeviceOnBoard: undefined
  PairDeviceScreen: undefined
  ScanDeviceScreen: undefined
  VoiceToTextScreen: undefined
  VoiceToTextRealtime: undefined
  HistoryScreen: undefined
  FAQScreen: undefined
  AboutScreen: undefined
  SoundRecording: undefined
}

const MainStack =
  createNativeStackNavigator<MainStackParamList>()

// Main App Navigator
const AppNavigator = memo(
  (props: { isLoggedIn: boolean }) => {
    const { isLoggedIn } = props

    const navigationRef =
      useRef<NavigationContainerRef<any>>(null)
    const routeNameRef = useRef<string | undefined>(
      undefined
    )

    const mainStackOptions = {
      headerShown: false,
      animation: 'fade_from_bottom' as const,
      headerShadowVisible: false,
    }

    const backAction = () => {
      if (
        routeNameRef.current == 'Home' ||
        routeNameRef.current == 'Login'
      ) {
        Alert.alert(
          'Hold on!',
          'Are you sure you want to exit app?',
          [
            {
              text: 'Cancel',
              onPress: () => {
                return true
              },
              style: 'cancel',
            },
            {
              text: 'YES',
              onPress: () => BackHandler.exitApp(),
            },
          ]
        )
        return true
      }
    }

    useEffect(() => {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction
      )
      console.log(backHandler)
      return () => {
        backHandler.remove()
      }
    }, [])


    return (
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
        }}
        onStateChange={() => {
          const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;
          routeNameRef.current = currentRouteName;
          console.log("Route changed:", currentRouteName);
        }}
      >
        <MainStack.Navigator
          screenOptions={mainStackOptions}
          initialRouteName={isLoggedIn ? 'Main' : 'Login'}
        >
          <MainStack.Screen
            name={'Main'}
            component={BottomTabBar}
            options={{ headerShown: false }}
          />
          {/* <MainStack.Screen
            name="Login"
            component={LoginScreen}
          />
          <MainStack.Screen
            name={'PairDeviceOnBoard'}
            component={PairDeviceScreenOnBoard}
          />
          <MainStack.Screen
            name={'ScanDeviceScreen'}
            component={ScanDevicesScreen}
          />
          <MainStack.Screen
            name={'PairDeviceScreen'}
            component={PairDeviceScreen}
          />
          <MainStack.Screen
            name={'LiveControl'}
            component={LiveControlScreen}
          />
          <MainStack.Screen
            name={'VoiceToTextScreen'}
            component={VoiceToTextScreen}
          />
          <MainStack.Screen
            name={'VoiceToTextRealtime'}
            component={VoiceToTextRealtime}
          />
          <MainStack.Screen
            name='HistoryScreen'
            component={HistoryScreen}
          />
          <MainStack.Screen
            name='FAQScreen'
            component={FAQScreen}
          />
          <MainStack.Screen
            name='AboutScreen'
            component={AboutScreen}
          />
          <MainStack.Screen
            name='SoundRecording'
            component={SoundRecording}
          /> */}
        </MainStack.Navigator>
      </NavigationContainer>
    )
  }
)

export default AppNavigator