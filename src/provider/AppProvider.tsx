import React, { useEffect, useState } from 'react'
import { StatusBar } from 'react-native'
import { AppLoading } from '../components/layout/AppLoading'
import AppNavigator from '../navigation/AppNavigator'
import { useTheme } from 'react-native-paper'
import BootSplash from 'react-native-bootsplash';

interface RootState {
  user: null
}
const AppProvider = () => {
  const [isLoading, setLoading] = useState(true)
  const [tokenChecked, setTokenChecked] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState<any>(true)
  const theme = useTheme()

  useEffect(() => {
    const init = async () => {
      // await getUser()
      return true
    }
    // getUser()

    init().finally(async () => {
      await BootSplash.hide({ fade: true });
      console.log("BootSplash has been hidden successfully");
    });
  }, [])

  // const getUser = async () => {
  //   try {
  //     var user = await AsyncStorage.getItem('user')
  //     if (user !== null) {
  //       setTokenChecked(true)
  //       setIsLoggedIn(true)
  //     } else {
  //       let authState = { isLoggedIn: false, user: null }
  //       setTokenChecked(true)
  //       setIsLoggedIn(false)
  //     }
  //   } catch (error) { }
  // }

  console.log('test')
  if (isLoggedIn != null) {
    return (
      <>
        <AppNavigator isLoggedIn={isLoggedIn} />
        {/* Loading */}
        <AppLoading></AppLoading>
      </>
    )
  }
}

export default AppProvider