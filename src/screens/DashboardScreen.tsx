import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, DeviceEventEmitter } from 'react-native';
import { Text, Card, useTheme, Avatar, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

const DashboardScreen = ({ navigation }: any) => {
  const theme = useTheme();

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

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <MaterialDesignIcons name="video" size={24} color="#00E5FF" />
              <Text style={styles.statValue}>04</Text>
              <Text style={styles.statLabel}>Cameras</Text>
            </Card.Content>
          </Card>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <MaterialDesignIcons name="shield-check" size={24} color="#4CAF50" />
              <Text style={styles.statValue}>Online</Text>
              <Text style={styles.statLabel}>System Status</Text>
            </Card.Content>
          </Card>
        </View>

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
              <Text style={styles.liveText}>TAP TO MONITOR</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Features Grid */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          {[
            { id: 1, label: 'Recordings', icon: 'folder-video', color: '#FF9800' },
            { id: 2, label: 'Analytics', icon: 'chart-arc', color: '#E91E63' },
            { id: 3, label: 'Devices', icon: 'router-wireless', color: '#2196F3' },
            { id: 4, label: 'Notifications', icon: 'bell-ring', color: '#FFEB3B' },
          ].map((item) => (
            <TouchableOpacity key={item.id} style={styles.gridItem}>
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
    color: '#FFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 15,
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
  liveText: {
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
