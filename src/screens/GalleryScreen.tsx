import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  Dimensions,
  Text,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Surface, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import RNFS from 'react-native-fs';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_SIZE = width / COLUMN_COUNT;

interface DeviceFile {
  name: string;
  type: 'image' | 'video';
  size: string;
}

const GalleryScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<'local' | 'device'>('local');
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [cloudFiles, setCloudFiles] = useState<DeviceFile[]>([]);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadMedia = useCallback(async () => {
    try {
      const dirs = [
        RNFS.ExternalDirectoryPath + '/DCIM/BullsEye',
        RNFS.ExternalDirectoryPath + '/DCIM/GUIDECAMERA',
        RNFS.DocumentDirectoryPath,
        RNFS.CachesDirectoryPath,
      ];
      const allFiles: any[] = [];
      for (const dir of dirs) {
        try {
          const entries = await RNFS.readDir(dir);
          allFiles.push(...entries);
        } catch { /* dir may not exist */ }
      }

      const media = allFiles.filter((f: any) =>
        f.name.endsWith('.png') ||
        f.name.endsWith('.jpg') ||
        f.name.endsWith('.mp4')
      );

      media.sort((a: any, b: any) => {
        const dateA = a.mtime ? new Date(a.mtime).getTime() : 0;
        const dateB = b.mtime ? new Date(b.mtime).getTime() : 0;
        return dateB - dateA;
      });

      setMediaFiles(media.map((f: any) => `file://${f.path}`));
    } catch (error) {
      console.log('❌ Error load gallery:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMedia();
    }, [loadMedia])
  );

  const fetchCloudFiles = async () => {
    setIsLoadingCloud(true);
    setCloudError(null);
    try {
      const response = await fetch('http://192.168.42.1/api/v1/files');
      const data = await response.json();
      const files: DeviceFile[] = (data.value || [])
        .filter((f: any) => {
          const n = f.name || '';
          return n.startsWith('IMG') || n.startsWith('IVR');
        })
        .map((f: any) => ({
          name: f.name,
          type: f.type === 'video' ? 'video' : 'image',
          size: f.size || '-',
        }));
      files.sort((a, b) => b.name.localeCompare(a.name));
      setCloudFiles(files);
    } catch (error) {
      console.log('❌ Error fetch device files:', error);
      setCloudError('CANNOT CONNECT TO DEVICE');
      setCloudFiles([]);
    }
    setIsLoadingCloud(false);
  };

  const handleDeviceFilePress = async (file: DeviceFile) => {
    try {
      const filename = file.name;
      const localPath = `${RNFS.CachesDirectoryPath}/${filename}`;
      const exists = await RNFS.exists(localPath);
      if (!exists) {
        const url = file.type === 'video'
          ? `http://192.168.42.1/api/v1/files/videos/${filename}`
          : `http://192.168.42.1/api/v1/files/download/${filename}`;
        await RNFS.downloadFile({ fromUrl: url, toFile: localPath }).promise;
      }
      navigation.navigate('RecentMedia', { uri: `file://${localPath}` });
    } catch (error) {
      console.log('❌ Error download device file:', error);
      Alert.alert('Error', 'Gagal mengunduh file dari device');
    }
  };

  const renderMediaItem = ({ item }: { item: string }) => {
    const isVideo = item.endsWith('.mp4');
    return (
      <TouchableOpacity style={styles.mediaItem} activeOpacity={0.8}
        onPress={() => navigation.navigate('RecentMedia', { uri: item })}>
        <Surface style={styles.thumbnailFrame} elevation={2}>
          <Image source={{ uri: item }} style={styles.thumbnail} />
          {isVideo && <View style={styles.videoOverlay}>
            <MaterialDesignIcons name="play-circle-outline" size={28} color="#FFF" />
          </View>}
        </Surface>
      </TouchableOpacity>
    );
  };

  const renderDeviceItem = ({ item }: { item: DeviceFile }) => {
    const isVideo = item.type === 'video';
    const thumbUrl = isVideo
      ? `http://192.168.42.1/api/v1/files/videos/${item.name}/thumb/1`
      : `http://192.168.42.1/api/v1/files/download/${item.name}`;
    return (
      <TouchableOpacity style={styles.mediaItem} activeOpacity={0.8}
        onPress={() => handleDeviceFilePress(item)}>
        <Surface style={styles.thumbnailFrame} elevation={2}>
          <Image source={{ uri: thumbUrl }} style={styles.thumbnail} />
          {isVideo && <View style={styles.videoOverlay}>
            <MaterialDesignIcons name="play-circle-outline" size={28} color="#FFF" />
          </View>}
        </Surface>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    if (activeTab === 'device') {
      fetchCloudFiles();
    }
  }, [activeTab]);

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
          <Text style={styles.title}>INTELLIGENCE ARCHIVE</Text>
          <Text style={styles.subtitle}>TACTICAL MEDIA STORAGE</Text>
        </View>
        <IconButton 
          icon="shield-search" 
          iconColor="#D32F2F" 
          size={24} 
          onPress={() => {}} 
        />
      </View>

      {/* Elite Tabs */}
      <View style={styles.tabWrapper}>
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'local' && styles.activeTab]}
            onPress={() => setActiveTab('local')}
          >
            <Text style={[styles.tabText, activeTab === 'local' && styles.activeTabText]}>LOCAL ASSETS</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'device' && styles.activeTab]}
            onPress={() => setActiveTab('device')}
          >
            <Text style={[styles.tabText, activeTab === 'device' && styles.activeTabText]}>REMOTE DEVICE</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'local' ? (
          mediaFiles.length > 0 ? (
            <FlatList
              data={mediaFiles}
              renderItem={renderMediaItem}
              keyExtractor={(item) => item}
              numColumns={COLUMN_COUNT}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={async () => { setRefreshing(true); await loadMedia(); setRefreshing(false); }}
                  tintColor="#D32F2F"
                  colors={['#D32F2F']}
                />
              }
            />
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialDesignIcons name="database-off-outline" size={60} color="rgba(255,255,255,0.05)" />
              <Text style={styles.emptyText}>NO DATA DETECTED IN STORAGE</Text>
              <TouchableOpacity style={styles.retryButton} onPress={async () => { setRefreshing(true); await loadMedia(); setRefreshing(false); }}>
                <Text style={styles.retryText}>REFRESH</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          isLoadingCloud ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color="#D32F2F" />
              <Text style={styles.loadingText}>ACCESSING REMOTE DEVICE...</Text>
            </View>
          ) : cloudError ? (
            <View style={styles.devContainer}>
              <Surface style={styles.devCard} elevation={4}>
                <MaterialDesignIcons name="access-point-network-off" size={50} color="#D32F2F" />
                <Text style={styles.devTitle}>CONNECTION LOST</Text>
                <Text style={styles.devSubtitle}>
                  {cloudError}{'\n'}CONNECT TO DEVICE WIFI AND RETRY
                </Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchCloudFiles}>
                  <Text style={styles.retryText}>RETRY</Text>
                </TouchableOpacity>
              </Surface>
            </View>
          ) : cloudFiles.length > 0 ? (
            <FlatList
              data={cloudFiles}
              renderItem={renderDeviceItem}
              keyExtractor={(item) => item.name}
              numColumns={COLUMN_COUNT}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialDesignIcons name="cloud-off-outline" size={60} color="rgba(255,255,255,0.05)" />
              <Text style={styles.emptyText}>NO FILES ON REMOTE DEVICE</Text>
            </View>
          )
        )}
      </View>
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
  tabWrapper: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(211, 47, 47, 0.3)',
  },
  tabText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
  },
  activeTabText: {
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 40,
  },
  mediaItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    padding: 2,
  },
  thumbnailFrame: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  thumbnail: {
    flex: 1,
    backgroundColor: '#0c1018',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginTop: 20,
    textAlign: 'center',
  },
  devContainer: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
  },
  devCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  devTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  devSubtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 30,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginTop: 16,
  },
  retryButton: {
    backgroundColor: 'rgba(211,47,47,0.15)',
    borderWidth: 1,
    borderColor: '#D32F2F',
    borderRadius: 8,
    paddingHorizontal: 30,
    paddingVertical: 10,
  },
  retryText: {
    color: '#D32F2F',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});

export default GalleryScreen;