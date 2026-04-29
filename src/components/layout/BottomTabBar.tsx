// StackBottomTabBar.tsx
import React, { useEffect, useRef } from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import HomeScreen from '../../screens/HomeScreen'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import { COLORS } from '../../core/theme'
import ProfileScreen from '../../screens/ProfileScreen'
import DashboardScreen from '../../screens/DashboardScreen'
import GalleryScreen from '../../screens/GalleryScreen'

const Tab = createBottomTabNavigator()

const CustomHeader = () => (
  <View style={{
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: "space-between",
    width: '100%',
    height: 40,
  }}>
    <View>
      <Image
        source={require('../../../assets/img/logo-full.png')}
        style={{
          width: 110,
          height: 30,
          resizeMode: 'contain',
          marginLeft: 15,
        }}
      />
    </View>
  </View>
)

const CustomTabBarButton = (props: any) => {
  const { children, onPress, accessibilityState } = props
  const focused =
    accessibilityState?.selected ??
    props?.['aria-selected'] ??
    false


  const scaleValue = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.spring(scaleValue, {
      toValue: focused ? 1.15 : 1, // zoom in kalau aktif
      useNativeDriver: true,
      friction: 5,
    }).start()
  }, [focused])

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={1}
      style={styles.wrapper}
    >
      <Animated.View
        style={[
          styles.tabButton,
          focused && styles.tabButtonActive,
          { transform: [{ scale: scaleValue }] },
        ]}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  )
}

export default function BottomTabBar() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // headerShown:route.name != 'Home' ? false : true,
        headerShown: true,
        headerTitle: () => <CustomHeader />,
        headerTitleAlign: 'left',
        headerStyle: {
          backgroundColor: COLORS.background
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: string = ''

          if (route.name === 'Dashboard') {
            iconName = 'home'
          } else if (route.name === 'Gallery') {
            iconName = 'image-multiple'
          } else if (route.name === 'Camera') {
            iconName = 'stabilization'
          } else if (route.name === 'Profile') {
            iconName = 'account'
          }

          return <MaterialDesignIcons name={iconName as any} size={size} color={color} />
        },
        tabBarStyle: {
          position: 'absolute', // Membuat melayang
          backgroundColor: COLORS.background,
          borderTopWidth: 0,
          elevation: 10,
          height: 70,
          borderRadius: 35,
          marginHorizontal: 15,
          marginBottom: insets.bottom + 10, // Jarak dari bawah layar
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.2)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
        },
        tabBarItemStyle: {
          borderRadius: 50,
          height: 70,
          // marginHorizontal: 30,
          // marginTop: 15
        },
        tabBarActiveBackgroundColor: COLORS.secondary,
        tabBarShowLabel: false,
        tabBarButton: (props) => <CustomTabBarButton {...props} />,
        tabBarActiveTintColor: COLORS.white
      })
      }
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Gallery" component={GalleryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </ Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButton: {
    width: 55,
    height: 45,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: COLORS.secondary,
    shadowColor: COLORS.white,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
})