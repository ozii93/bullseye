import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { IconButton, Surface, Divider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DeviceHistoryItem {
  id: string;
  name: string;
  ip: string;
  lastConnected: string;
}

const DeviceHistoryScreen = () => {
  const navigation = useNavigation<any>();
  const [history, setHistory] = useState<DeviceHistoryItem[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem('device_history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('Error loading device history:', error);
    }
  };

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem('device_history');
      setHistory([]);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const renderItem = ({ item }: { item: DeviceHistoryItem }) => (
    <Surface style={styles.deviceCard} elevation={1}>
      <View style={styles.deviceInfo}>
        <View style={styles.iconContainer}>
          <IconButton icon="router-wireless" iconColor="#00E5FF" size={24} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.deviceName}>{item.name}</Text>
          <Text style={styles.deviceIp}>{item.ip}</Text>
        </View>
        <View style={styles.dateContainer}>
          <Text style={styles.deviceDate}>{new Date(item.lastConnected).toLocaleDateString()}</Text>
          <Text style={styles.deviceTime}>{new Date(item.lastConnected).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
      </View>
    </Surface>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <IconButton 
          icon="chevron-left" 
          iconColor="#FFF" 
          size={32}
          onPress={() => navigation.goBack()} 
        />
        <View style={styles.titleContainer}>
          <Text style={styles.title}>DEVICE HISTORY</Text>
          <Text style={styles.subtitle}>COMMUNICATION LOGS</Text>
        </View>
        <IconButton 
          icon="delete-outline" 
          iconColor="#D32F2F" 
          size={24} 
          onPress={clearHistory} 
        />
      </View>

      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={(item) => item.id + item.lastConnected}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconButton icon="history" iconColor="#333" size={80} />
            <Text style={styles.emptyText}>NO DEVICE HISTORY FOUND</Text>
            <Text style={styles.emptySubtext}>Connected devices will appear here</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05070a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#D32F2F',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  deviceCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderLeftWidth: 3,
    borderLeftColor: '#00E5FF',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconContainer: {
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
  deviceName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deviceIp: {
    color: '#00E5FF',
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  dateContainer: {
    alignItems: 'flex-end',
  },
  deviceDate: {
    color: '#888',
    fontSize: 11,
  },
  deviceTime: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
    letterSpacing: 1,
  },
  emptySubtext: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
  },
});

export default DeviceHistoryScreen;
