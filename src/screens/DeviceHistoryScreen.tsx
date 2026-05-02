import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { IconButton, Surface, Divider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

interface DeviceHistoryItem {
  id: string;
  name: string;
  ip: string;
  lastConnected: string;
}

const DeviceHistoryScreen = () => {
  const navigation = useNavigation();
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <IconButton
            icon="arrow-left"
            iconColor="#FFF"
            size={24}
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.headerTitle}>DEVICE HISTORY</Text>
          <IconButton
            icon="delete-outline"
            iconColor="#EF5350"
            size={24}
            onPress={clearHistory}
          />
        </View>
      </SafeAreaView>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#10182b',
  },
  header: {
    backgroundColor: '#1a2236',
    borderBottomWidth: 1,
    borderBottomColor: '#2b384b',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    height: 60,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },
  listContent: {
    padding: 16,
  },
  deviceCard: {
    backgroundColor: '#1a2236',
    borderRadius: 8,
    marginBottom: 12,
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
