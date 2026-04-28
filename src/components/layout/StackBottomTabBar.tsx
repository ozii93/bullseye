import MaterialDesignIcons, { MaterialDesignIconsIconName } from '@react-native-vector-icons/material-design-icons';
import React, { memo, useState } from 'react';
import { View, StyleSheet, Image, DeviceEventEmitter } from 'react-native';
import { BottomNavigation, Text, useTheme } from 'react-native-paper';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DashboardScreen from '../../screens/DashboardScreen';
import ProfileScreen from '../../screens/ProfileScreen';
import HomeScreen from '../../screens/HomeScreen';
import GalleryScreen from '../../screens/GalleryScreen';
import { createStackNavigator } from '@react-navigation/stack';

// Menu kembali ke susunan asli
const menus: {
  key: string;
  title: string;
  icon: MaterialDesignIconsIconName;
}[] = [
    { key: 'dashboard', title: 'Home', icon: 'home' },
    { key: 'gallery', title: 'Gallery', icon: 'image-multiple' },
    { key: 'home', title: 'Camera', icon: 'video' },
    { key: 'profile', title: 'Profile', icon: 'account' },
  ];

// Scene Map - Tambahkan GalleryScreen
const renderScene = BottomNavigation.SceneMap({
  dashboard: DashboardScreen,
  gallery: GalleryScreen,
  home: HomeScreen,
  profile: ProfileScreen,
});

export default function StackBottomTabBar({ initRouteName }: any) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  const getInitialIndex = () => {
    if (typeof initRouteName === 'number') return initRouteName;
    const foundIndex = menus.findIndex(m => m.key === initRouteName);
    return foundIndex !== -1 ? foundIndex : 0;
  };

  const [index, setIndex] = useState(getInitialIndex());

  // Gunakan variabel konstan, jangan state, agar perubahan menu langsung terbaca
  const routes = menus.map(menu => ({
    key: menu.key,
    title: menu.title,
    icon: menu.icon,
  }));

  React.useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('changeTab', (tabKey: string) => {
      const tabIndex = menus.findIndex(m => m.key === tabKey);
      if (tabIndex !== -1) {
        setIndex(tabIndex);
      }
    });
    return () => subscription.remove();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <BottomNavigation
        navigationState={{ index, routes }}
        onIndexChange={setIndex}
        renderScene={renderScene}
        renderIcon={({ route, focused }: any) => {
          if (route.key === 'home') {
            return (
              <View style={styles.centerButtonWrapper}>
                <View style={[styles.centerButton, { backgroundColor: focused ? theme.colors.secondary : 'rgba(255, 255, 255, 0.05)' }]}>
                  <MaterialDesignIcons name={route.icon} size={30} color={focused ? '#FFF' : 'rgba(255, 255, 255, 0.4)'} />
                </View>
              </View>
            );
          }
          return (
            <View style={styles.iconContainer}>
              <MaterialDesignIcons 
                name={route.icon} 
                size={26} 
                color={focused ? theme.colors.secondary : 'rgba(255, 255, 255, 0.3)'} 
              />
              {focused && <View style={[styles.activeDot, { backgroundColor: theme.colors.secondary }]} />}
            </View>
          );
        }}
        labeled={false}
        shifting={false}
        activeColor={theme.colors.secondary}
        inactiveColor="rgba(255, 255, 255, 0.4)"
        renderIndicator={() => null}
        activeIndicatorStyle={{ backgroundColor: 'transparent' }}
        theme={{
          colors: {
            secondaryContainer: 'transparent',
          }
        }}
        barStyle={[
          styles.floatingBar,
          {
            backgroundColor: theme.colors.background, // Disamakan dengan background dashboard
            marginBottom: insets.bottom + 10,
          },
          index === 2 && { height: 0, opacity: 0, display: 'none' }
        ]}
      />
    </View>
  );
};





const styles = StyleSheet.create({
  floatingBar: {
    marginHorizontal: 15,
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    elevation: 10,
    zIndex: 99,
    overflow: 'hidden',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00E5FF',
    marginTop: 2,
  },
  centerButtonWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  centerButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    // Memberikan bayangan halus pada tombol tengah
    elevation: 4,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  scene: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});