import React, { useEffect, useState, useRef } from 'react';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  DeviceEventEmitter,
  Linking,
  Platform,
  Dimensions,
  StatusBar
} from 'react-native';
import { Text, Surface, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../provider/AuthContext';

const { width } = Dimensions.get('window');

const DashboardScreen = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState('BullsEye Device');

  // Load last connected device on mount
  useEffect(() => {
    const loadLastDevice = async () => {
      try {
        const savedName = await AsyncStorage.getItem('lastConnectedDevice');
        if (savedName) {
          setDeviceName(savedName);
        }
      } catch (error) {
        console.error('Error loading last device:', error);
      }
    };
    loadLastDevice();
  }, []);

  const checkConnection = async () => {
    const endpoints = [
      'http://192.168.42.1/api/v1/peripheral/wifi',
      'http://192.168.42.1/api/v1/system/deviceinfo',
      'http://192.168.42.1/api/v1/paramline'
    ];

    let success = false;

    for (const url of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: { 'Cache-Control': 'no-cache' }
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          let name = '';

          if (url.includes('wifi')) {
            // Priority 1: SSID from wifi endpoint
            name = data.ssid || data.value?.ssid;
          } else if (url.includes('deviceinfo')) {
            // Priority 2: Device info fields
            name = data.deviceName || data.model || data.hostname;
          }

          if (name) {
            setDeviceName(name);
            await AsyncStorage.setItem('lastConnectedDevice', name);
          }

          success = true;
          break;
        }
      } catch (error) {
        // Fail fast for individual endpoints
      }
    }

    setIsConnected(success);
    return success;
  };

  useEffect(() => {
    if (!isFocused) return;

    checkConnection();
    const interval = setInterval(checkConnection, 1500); // 1.5 seconds for snappy updates
    return () => clearInterval(interval);
  }, [isFocused]);

  const handleActionPress = () => {
    if (isConnected) {
      navigation.navigate('Stream');
    } else {
      openWifiSettings();
    }
  };

  const openWifiSettings = () => {
    if (Platform.OS === 'android') {
      Linking.sendIntent('android.settings.WIFI_SETTINGS');
    } else {
      Linking.openURL('App-Prefs:root=WIFI');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>OPERATIONAL STATUS</Text>
            <Text style={styles.userName}>{user?.name?.toUpperCase() || 'COMMANDER HAWK'}</Text>
          </View>
          <View style={styles.avatarFrame}>
            <Avatar.Image
              size={54}
              source={{ uri: user?.photo || 'https://i.pravatar.cc/150?u=hawk' }}
            />
          </View>
        </View>

        {/* Device Status Card - Redesigned to match screenshot */}
        <Surface style={styles.deviceCard} elevation={4}>
          <View style={styles.deviceCardTop}>
            <View style={styles.deviceImageWrapper}>
              {/* Fallback icon for device image */}
              <MaterialDesignIcons name="telescope" size={48} color="rgba(255,255,255,0.5)" />
            </View>

            <View style={styles.deviceDetails}>
              <Text style={styles.deviceCategory}>Infrared Camera</Text>
              <View style={styles.connectionStatusRow}>
                <View style={styles.wifiIconCircle}>
                  <MaterialDesignIcons
                    name="wifi"
                    size={14}
                    color={isConnected ? '#2196F3' : 'rgba(255,255,255,0.3)'}
                  />
                </View>
                <Text style={styles.deviceNameText}>
                  {deviceName}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.chevronButton}
              onPress={handleActionPress}
            >
              <MaterialDesignIcons name="chevron-right" size={28} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          <View style={styles.deviceCardActionArea}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleActionPress}
              style={[
                styles.mainActionButton,
                isConnected ? styles.observationActive : styles.reconnectMode
              ]}
            >
              {isConnected ? (
                <>
                  <MaterialDesignIcons name="target" size={24} color="#FFF" />
                  <Text style={styles.mainActionButtonText}>Observation</Text>
                </>
              ) : (
                <Text style={styles.mainActionButtonText}>Reconnect</Text>
              )}
            </TouchableOpacity>
          </View>
        </Surface>

        {/* Quick Actions Grid */}
        <View style={styles.sectionHeader}>
          <View style={styles.accentLine} />
          <Text style={styles.sectionTitle}>TACTICAL TOOLS</Text>
        </View>

        <View style={styles.grid}>
          {[
            { id: 1, label: 'RECORDINGS', icon: 'video-vintage', color: '#00E5FF', route: 'gallery', isTab: true },
            { id: 2, label: 'USER GUIDE', icon: 'book-open-variant', color: '#FF9800', route: 'QuickUserGuide' },
            { id: 3, label: 'HISTORY', icon: 'history', color: '#4CAF50', route: 'DeviceHistory' },
            { id: 4, label: 'F.A.Q', icon: 'help-circle-outline', color: '#E91E63', route: 'FAQ' },
          ].map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.gridItem}
              onPress={() => {
                if (item.isTab) {
                  DeviceEventEmitter.emit('changeTab', item.route);
                }
                navigation.navigate(item.route);
              }}
            >
              <Surface style={styles.gridSurface} elevation={1}>
                <View style={[styles.iconContainer, { backgroundColor: item.color + '10' }]}>
                  <MaterialDesignIcons name={item.icon as any} size={28} color={item.color} />
                </View>
                <Text style={styles.gridLabel}>{item.label}</Text>
              </Surface>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10,
  },
  welcomeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2.5,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 4,
  },
  userName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1.2,
  },
  avatarFrame: {
    padding: 3,
    borderWidth: 1.5,
    borderColor: '#00E5FF',
    borderRadius: 30,
  },
  deviceCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 40,
  },
  deviceCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  deviceImageWrapper: {
    width: 90,
    height: 70,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  deviceDetails: {
    flex: 1,
  },
  deviceCategory: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 6,
  },
  connectionStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wifiIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  deviceNameText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
  },
  chevronButton: {
    padding: 4,
  },
  deviceCardActionArea: {
    marginTop: 4,
  },
  mainActionButton: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  observationActive: {
    backgroundColor: '#007AFF',
  },
  reconnectMode: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  mainActionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  accentLine: {
    width: 4,
    height: 16,
    backgroundColor: '#D32F2F',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  gridItem: {
    width: '48%',
  },
  gridSurface: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridLabel: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 1.5,
  }
});

export default DashboardScreen;

