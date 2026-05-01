import React, { useEffect, useState } from 'react';
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
import { Text, Surface, Avatar, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { useAuth } from '../provider/AuthContext';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation, isFocused }: any) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState('BullsEye Thermal Device');

  useEffect(() => {
    if (!isFocused) return;

    const checkConnection = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch('http://192.168.42.1/api/v1/system/deviceinfo', {
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const name = data.deviceName || data.model || data.hostname || 'BullsEye Device';
          setDeviceName(name);
          setIsConnected(true);
        } else {
          setIsConnected(true);
        }
      } catch (error) {
        setIsConnected(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);
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

        {/* System Status Display */}
        <Surface style={styles.statusPanel} elevation={2}>
          <View style={styles.panelHeader}>
            <MaterialDesignIcons name="shield-sync" size={16} color="#D32F2F" />
            <Text style={styles.panelTitle}>SYSTEM CONNECTIVITY</Text>
            <View style={[styles.statusDot, { backgroundColor: isConnected ? '#4CAF50' : '#D32F2F' }]} />
          </View>
          
          <View style={styles.statusMain}>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>{deviceName.toUpperCase()}</Text>
              <Text style={[styles.statusStatus, { color: isConnected ? '#4CAF50' : '#D32F2F' }]}>
                {isConnected ? 'SIGNAL ACQUIRED' : 'SIGNAL LOST'}
              </Text>
            </View>
            <TouchableOpacity onPress={openWifiSettings} style={styles.linkButton}>
              <MaterialDesignIcons 
                name={isConnected ? "wifi-check" : "wifi-alert"} 
                size={32} 
                color={isConnected ? '#4CAF50' : '#D32F2F'} 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.panelFooter}>
            <View style={styles.footerLine} />
            <Text style={styles.footerText}>ENCRYPTED CHANNEL 09-B</Text>
            <View style={styles.footerLine} />
          </View>
        </Surface>

        {/* Primary Monitor Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.accentLine} />
          <Text style={styles.sectionTitle}>PRIMARY MONITOR</Text>
        </View>

        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Stream')}
          style={styles.monitorContainer}
        >
          <Surface style={styles.monitorFrame} elevation={4}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
            
            <View style={styles.monitorContent}>
              <MaterialDesignIcons name="access-point" size={40} color="rgba(255,255,255,0.2)" />
              <View style={styles.tapBadge}>
                <Text style={styles.tapText}>INITIALIZE LIVE STREAM</Text>
              </View>
            </View>

            <View style={styles.monitorOverlay}>
              <View style={styles.recBadge}>
                <View style={styles.recDot} />
                <Text style={styles.recText}>LIVE FEED</Text>
              </View>
              <Text style={styles.monitorTime}>00:00:00:00</Text>
            </View>
          </Surface>
        </TouchableOpacity>

        {/* Quick Actions Grid */}
        <View style={styles.sectionHeader}>
          <View style={styles.accentLine} />
          <Text style={styles.sectionTitle}>TACTICAL TOOLS</Text>
        </View>

        <View style={styles.grid}>
          {[
            { id: 1, label: 'RECORDINGS', icon: 'video-vintage', color: '#FF9800' },
            { id: 2, label: 'GALLERY', icon: 'view-grid-outline', color: '#00E5FF' },
          ].map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.gridItem}
              onPress={() => {
                if (item.label === 'GALLERY') {
                  DeviceEventEmitter.emit('changeTab', 'gallery');
                }
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
    backgroundColor: '#05070a',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1,
  },
  avatarFrame: {
    padding: 4,
    borderWidth: 1,
    borderColor: '#00E5FF',
    borderRadius: 32,
  },
  statusPanel: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 40,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  panelTitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginLeft: 10,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  statusMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1,
  },
  statusStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
    letterSpacing: 1,
  },
  panelFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  footerText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginHorizontal: 15,
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
    fontSize: 14,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 2,
  },
  monitorContainer: {
    width: '100%',
    height: 220,
    marginBottom: 40,
  },
  monitorFrame: {
    flex: 1,
    backgroundColor: '#0c1018',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 2,
    overflow: 'hidden',
  },
  cornerTL: { position: 'absolute', top: 15, left: 15, width: 20, height: 20, borderTopWidth: 1, borderLeftWidth: 1, borderColor: 'rgba(211, 47, 47, 0.4)' },
  cornerTR: { position: 'absolute', top: 15, right: 15, width: 20, height: 20, borderTopWidth: 1, borderRightWidth: 1, borderColor: 'rgba(211, 47, 47, 0.4)' },
  cornerBL: { position: 'absolute', bottom: 15, left: 15, width: 20, height: 20, borderBottomWidth: 1, borderLeftWidth: 1, borderColor: 'rgba(211, 47, 47, 0.4)' },
  cornerBR: { position: 'absolute', bottom: 15, right: 15, width: 20, height: 20, borderBottomWidth: 1, borderRightWidth: 1, borderColor: 'rgba(211, 47, 47, 0.4)' },
  monitorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tapBadge: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tapText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  monitorOverlay: {
    position: 'absolute',
    top: 25,
    left: 25,
    right: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  recDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D32F2F',
    marginRight: 6,
  },
  recText: {
    color: '#D32F2F',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  monitorTime: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
  },
  gridSurface: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  gridLabel: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1.5,
  },
  linkButton: {
    padding: 10,
  }
});

export default DashboardScreen;
