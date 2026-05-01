import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  Dimensions,
  Text,
  StatusBar,
} from 'react-native';
import { Surface, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import RNFS from 'react-native-fs';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_SIZE = width / COLUMN_COUNT;

const GalleryScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<'local' | 'device'>('local');
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);

  useEffect(() => {
    const loadMedia = async () => {
      try {
        const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);
        const media = files.filter(f => 
          f.name.endsWith('.png') || 
          f.name.endsWith('.jpg') || 
          f.name.endsWith('.mp4')
        );
        
        media.sort((a, b) => {
          const dateA = a.mtime ? new Date(a.mtime).getTime() : 0;
          const dateB = b.mtime ? new Date(b.mtime).getTime() : 0;
          return dateB - dateA;
        });

        setMediaFiles(media.map(f => `file://${f.path}`));
      } catch (error) {
        console.log('❌ Error load gallery:', error);
      }
    };

    loadMedia();
    const unsubscribe = navigation.addListener('focus', loadMedia);
    return unsubscribe;
  }, [navigation]);

  const renderMediaItem = ({ item }: { item: string }) => {
    const isVideo = item.endsWith('.mp4');

    return (
      <TouchableOpacity 
        style={styles.mediaItem}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('RecentMedia', { uri: item })}
      >
        <Surface style={styles.thumbnailFrame} elevation={2}>
          <Image source={{ uri: item }} style={styles.thumbnail} />
          {isVideo && (
            <View style={styles.videoOverlay}>
              <MaterialDesignIcons name="play-circle-outline" size={28} color="#FFF" />
            </View>
          )}
        </Surface>
      </TouchableOpacity>
    );
  };

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
            />
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialDesignIcons name="database-off-outline" size={60} color="rgba(255,255,255,0.05)" />
              <Text style={styles.emptyText}>NO DATA DETECTED IN STORAGE</Text>
            </View>
          )
        ) : (
          <View style={styles.devContainer}>
            <Surface style={styles.devCard} elevation={4}>
              <MaterialDesignIcons name="access-point-network-off" size={50} color="#D32F2F" />
              <Text style={styles.devTitle}>REMOTE ACCESS RESTRICTED</Text>
              <Text style={styles.devSubtitle}>
                DIRECT CLOUD SYNCHRONIZATION IS CURRENTLY UNDER CALIBRATION.
              </Text>
              <View style={styles.progressBar}>
                <View style={styles.progressFill} />
              </View>
              <Text style={styles.progressText}>UPDATING SYSTEM... 65%</Text>
            </Surface>
          </View>
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
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 2,
    marginBottom: 10,
  },
  progressFill: {
    width: '65%',
    height: '100%',
    backgroundColor: '#D32F2F',
    borderRadius: 2,
  },
  progressText: {
    color: '#D32F2F',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1,
  }
});

export default GalleryScreen;