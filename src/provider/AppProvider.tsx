import React, { useEffect } from 'react'
import { AppLoading } from '../components/layout/AppLoading'
import AppNavigator from '../navigation/AppNavigator'
import { useTheme } from 'react-native-paper'
import BootSplash from 'react-native-bootsplash';
import { AuthProvider, useAuth } from './AuthContext'
import { NotificationProvider } from './NotificationContext'

const AppProviderContent = () => {
  const { isLoggedIn } = useAuth()
  const theme = useTheme()

  useEffect(() => {
    const init = async () => {
      if (isLoggedIn !== null) {
        await BootSplash.hide({ fade: true });
      }
    }
    init();
  }, [isLoggedIn])

  if (isLoggedIn === null) {
    return <AppLoading />
  }

  return (
    <>
      <AppNavigator isLoggedIn={isLoggedIn} />
      <AppLoading />
    </>
  )
}

const AppProvider = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppProviderContent />
      </NotificationProvider>
    </AuthProvider>
  )
}

export default AppProvider
