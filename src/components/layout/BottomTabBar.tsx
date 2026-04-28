// StackBottomTabBar.tsx
import React, { useEffect, useRef } from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import HomeScreen from '../../screens/HomeScreen'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import { COLORS } from '../../core/theme'
import ProfileScreen from '../../screens/ProfileScreen'

const Tab = createBottomTabNavigator()

const CustomHeader = () => (
  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: "space-between", width: '100%' }}>
    <View>
      <Image
        source={require('../../../assets/img/logo-full.png')}
        style={{
          width: 130,
          resizeMode: 'contain',
          marginLeft: 20,
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
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // headerShown:route.name != 'Home' ? false : true,
        headerShown:true,
        headerTitle: () => <CustomHeader />,
        headerTitleAlign: 'left',
        headerStyle: {
          backgroundColor: COLORS.background
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: string = ''

          if (route.name === 'Home') {
            iconName = 'home'
          } else if (route.name === 'Support') {
            iconName = 'devices'
          } else if (route.name === 'Profile') {
            iconName = 'account'
          }

          return <MaterialDesignIcons name={iconName as any} size={size} color={color} />
        },
        tabBarStyle: {
          backgroundColor: COLORS.background,
          height: 80,
          paddingHorizontal: 10,
          borderColor: 'transparent'
        },
        tabBarItemStyle: {
          borderRadius: 50,
          marginHorizontal: 30,
          marginTop: 15
        },
        // tabBarActiveBackgroundColor: COLORS.secondary,
        tabBarButton: (props) => <CustomTabBarButton {...props} />,
        tabBarActiveTintColor: COLORS.white
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButton: {
    width: 60,
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