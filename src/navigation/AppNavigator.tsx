import {
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native'
import { memo, useEffect, useRef } from 'react'
import LoginScreen from '../screens/LoginScreen'
import React from 'react'
import { Alert, BackHandler } from 'react-native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import BottomTabBar from '../components/layout/BottomTabBar'
import StreamScreen from '../screens/StreamScreen'
import RecentMedia from '../screens/RecentMedia'
import GalleryScreen from '../screens/GalleryScreen'
import QuickUserGuideScreen from '../screens/QuickUserGuideScreen'
import PDFViewerScreen from '../screens/PDFViewerScreen'
import FAQScreen from '../screens/FAQScreen'
import AboutScreen from '../screens/AboutScreen'
import DeviceHistoryScreen from '../screens/DeviceHistoryScreen'

type MainStackParamList = {
  Login: undefined
  Dashboard: undefined
  Stream: undefined
  RecentMedia: undefined
  GalleryStack: undefined
  Main: undefined
  Profile: undefined
  QuickUserGuide: undefined
  PDFViewer: { source: any, title: string }
  FAQ: undefined
  About: undefined
  DeviceHistory: undefined
}

const MainStack = createNativeStackNavigator<MainStackParamList>()

const AppNavigator = memo(
  (props: { isLoggedIn: boolean }) => {
    const { isLoggedIn } = props

    const navigationRef = useRef<NavigationContainerRef<any>>(null)
    const routeNameRef = useRef<string | undefined>(undefined)

    const mainStackOptions = {
      headerShown: false,
      animation: 'fade_from_bottom' as const,
      headerShadowVisible: false,
    }

    const backAction = () => {
      if (
        routeNameRef.current == 'Home' ||
        routeNameRef.current == 'Login' ||
        routeNameRef.current == 'Main'
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
        <MainStack.Navigator screenOptions={mainStackOptions}>
          {isLoggedIn ? (
            <>
              <MainStack.Screen
                name={'Main'}
                component={BottomTabBar}
                options={{ headerShown: false }}
              />
              <MainStack.Screen name={'Stream'} component={StreamScreen} />
              <MainStack.Screen name={'RecentMedia'} component={RecentMedia} />
              <MainStack.Screen name={'GalleryStack'} component={GalleryScreen} />
              <MainStack.Screen name={'QuickUserGuide'} component={QuickUserGuideScreen} />
              <MainStack.Screen name={'PDFViewer'} component={PDFViewerScreen} />
              <MainStack.Screen name={'FAQ'} component={FAQScreen} />
              <MainStack.Screen name={'About'} component={AboutScreen} />
              <MainStack.Screen name={'DeviceHistory'} component={DeviceHistoryScreen} />
            </>
          ) : (
            <MainStack.Screen name="Login" component={LoginScreen} />
          )}
        </MainStack.Navigator>
      </NavigationContainer>
    )
  }
)

export default AppNavigator