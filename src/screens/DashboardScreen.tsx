import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, DeviceEventEmitter, Linking, Platform } from 'react-native';
import { Text, Card, useTheme, Avatar, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

const DashboardScreen = ({ navigation, isFocused }: any) => {
  const theme = useTheme();
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState('NightHawk Thermal Device');

  useEffect(() => {
    if (!isFocused) return;

    const checkConnection = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        // Coba ambil info device
        const response = await fetch('http://192.168.42.1/api/v1/system/deviceinfo', {
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          // Biasanya field-nya adalah 'deviceName' atau 'model'
          const name = data.deviceName || data.model || data.hostname || 'NightHawk Device';
          setDeviceName(name);
          setIsConnected(true);
        } else {
          // Jika endpoint info gagal tapi server ada (misal endpoint salah), 
          // kita tetap anggap connect tapi pakai nama default/sebelumnya
          setIsConnected(true);
        }
      } catch (error) {
        setIsConnected(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [isFocused]);



  const openWifiSettings = () => {
    if (Platform.OS === 'android') {
      Linking.sendIntent('android.settings.WIFI_SETTINGS');
    } else {
      Linking.openURL('App-Prefs:root=WIFI');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>Commander Hawk</Text>
          </View>
          <Avatar.Image 
            size={50} 
            source={{ uri: 'https://i.pravatar.cc/150?u=hawk' }} 
            style={styles.avatar}
          />
        </View>

        {/* Device Info & Status */}
        <Text style={styles.sectionTitle}>Device Status</Text>
        <Card style={styles.connectionCard}>
          <Card.Content style={styles.connectionContent}>
            <View style={styles.statusInfo}>
              <View style={[styles.statusIndicator, { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }]} />
              <View>
                <Text style={styles.deviceName}>{deviceName}</Text>
                <Text style={styles.statusText}>{isConnected ? 'CONNECTED' : 'DISCONNECTED'}</Text>
              </View>
            </View>
            <MaterialDesignIcons 
              name={isConnected ? "wifi-check" : "wifi-off"} 
              size={32} 
              color={isConnected ? '#4CAF50' : '#F44336'} 
            />
          </Card.Content>
        </Card>

        {/* Action Button */}
        <Button 
          mode="contained" 
          onPress={openWifiSettings}
          style={styles.connectButton}
          contentStyle={styles.connectButtonContent}
          icon="router-wireless"
          buttonColor="#2196F3"
        >
          CONNECT THE DEVICE
        </Button>

        {/* Live Preview Placeholder */}
        <Text style={styles.sectionTitle}>Main Monitor</Text>
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => DeviceEventEmitter.emit('changeTab', 'home')}
          style={styles.previewContainer}
        >
          <View style={styles.previewPlaceholder}>
            <MaterialDesignIcons name="play-circle" size={60} color="rgba(255,255,255,0.8)" />
            <View style={styles.liveBadge}>
              <View style={styles.redDot} />
              <Text style={styles.liveBadgeText}>TAP TO MONITOR</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Features Grid */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          {[
            { id: 1, label: 'Recordings', icon: 'folder-video', color: '#FF9800' },
            { id: 3, label: 'Gallery', icon: 'image-multiple', color: '#2196F3' },
          ].map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.gridItem}
              onPress={() => {
                if (item.label === 'Gallery') {
                  DeviceEventEmitter.emit('changeTab', 'gallery');
                }
              }}
            >
              <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
                <MaterialDesignIcons name={item.icon as any} size={28} color={item.color} />
              </View>
              <Text style={styles.gridLabel}>{item.label}</Text>
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
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 16,
    opacity: 0.7,
    color: '#FFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  avatar: {
    borderWidth: 2,
    borderColor: '#00E5FF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 15,
  },
  connectionCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  connectionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 15,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
    opacity: 0.8,
    color: '#FFF',
  },
  connectButton: {
    borderRadius: 12,
    marginBottom: 30,
    elevation: 4,
  },
  connectButtonContent: {
    paddingVertical: 8,
  },
  previewContainer: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 30,
    backgroundColor: '#333',
  },
  previewPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveBadge: {
    position: 'absolute',
    top: 15,
    left: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3B30',
    marginRight: 6,
  },
  liveBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  gridLabel: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default DashboardScreen;

