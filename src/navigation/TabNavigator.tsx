import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { memo, useCallback } from "react"
import HomeScreen from '../screens/HomeScreen'
import { useTheme } from "react-native-paper"
import { Image, Text, View } from "react-native"
import StackBottomTabBar from "../components/layout/StackBottomTabBar"

// Optimized Tab Navigator
const Tab = createBottomTabNavigator()

export const TabNavigator = memo((props: {
  initRouteName: string
}) => {
  const { initRouteName } = props
  // Memoized components to prevent unnecessary re-renders
  const theme = useTheme()
  const MemoizedHomeHeader = memo(() => {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: "space-between", width: '100%' }}>
        <View>
          <Image
            source={require('../assets/img/logo-full.png')}
            style={{
              width: 130,
              resizeMode: 'contain',
              marginLeft: 0,
            }}
          />
        </View>
      </View>
    )
  })
  const getTabScreenOptions = useCallback(
    () => ({
      lazy: true,
      animation: 'shift' as const,
      headerShadowVisible: false,
      headerTitleAlign: 'center',
      headerTitle: ({ children }: { children: string }) => (
        <Text
          style={{
            textAlign: 'center',
            fontWeight: 'bold',
          }}
        >
          {children}
        </Text>
      ),
    }),
    []
  )
  const StackBottomTabBarAdapter = (props: any) => {
    return <StackBottomTabBar {...props} />;
  };

  return (
    <Tab.Navigator
      initialRouteName={initRouteName}
      tabBar={(props) => <StackBottomTabBarAdapter {...props} />}
      screenOptions={getTabScreenOptions as any}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          headerTitleAlign: 'left',
          headerTitle: () => <MemoizedHomeHeader />,
          headerStyle: {
            backgroundColor: theme.colors.secondary, // warna header
          },
          tabBarLabel: 'home',
          title: 'Home',
        }}
      />
    </Tab.Navigator>
  )
})