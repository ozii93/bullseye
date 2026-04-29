import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  Dimensions,
  Text,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import RNFS from 'react-native-fs';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_SIZE = width / COLUMN_COUNT;

const GalleryScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<'local' | 'device'>('local');
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);

  // ===============================
  // LOAD REAL LOCAL MEDIA
  // ===============================
  useEffect(() => {
    const loadMedia = async () => {
      try {
        const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);
        const media = files.filter(f => 
          f.name.endsWith('.png') || 
          f.name.endsWith('.jpg') || 
          f.name.endsWith('.mp4')
        );
        
        // Urutkan dari yang terbaru
        media.sort((a, b) => {
          const dateA = a.mtime ? new Date(a.mtime).getTime() : 0;
          const dateB = b.mtime ? new Date(b.mtime).getTime() : 0;
          return dateB - dateA;
        });

        // Set state dengan format file://
        setMediaFiles(media.map(f => `file://${f.path}`));
      } catch (error) {
        console.log('❌ Error load gallery:', error);
      }
    };

    // Load saat screen dibuka
    loadMedia();

    // Auto-refresh kalau user abis hapus foto di RecentMedia dan balik ke sini
    const unsubscribe = navigation.addListener('focus', loadMedia);
    return unsubscribe;
  }, [navigation]);

  // ===============================
  // RENDER ITEM (GRID)
  // ===============================
  const renderMediaItem = ({ item }: { item: string }) => {
    const isVideo = item.endsWith('.mp4');

    return (
      <TouchableOpacity 
        style={styles.mediaItem}
        activeOpacity={0.8}
        // Lempar URI ke RecentMedia biar dibuka versi Fullscreen/Swipe-nya
        onPress={() => navigation.navigate('RecentMedia', { uri: item })}
      >
        <Image source={{ uri: item }} style={styles.thumbnail} />
        
        {isVideo && (
          <View style={styles.videoIndicator}>
            <MaterialDesignIcons name="play-circle-outline" size={32} color="#FFF" />
            <View style={styles.videoBadge}>
              <Text style={styles.videoBadgeText}>VIDEO</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. MODERN TACTICAL HEADER */}
      <View style={styles.header}>
        <IconButton 
          icon="arrow-left" 
          iconColor="#FFF" 
          size={28}
          onPress={() => navigation.goBack()} 
        />
        <Text style={styles.title}>MEDIA GALLERY</Text>
        <IconButton 
          icon="dots-vertical" 
          iconColor="#FFF" 
          size={28} 
          onPress={() => {}} 
        />
      </View>

      {/* 2. SLEEK TAB SWITCHER */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'local' && styles.activeTabButton]}
          onPress={() => setActiveTab('local')}
          activeOpacity={0.7}
        >
          <MaterialDesignIcons 
            name="folder-image" 
            size={20} 
            color={activeTab === 'local' ? '#00E5FF' : '#A0A0A5'} 
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === 'local' && styles.activeTabText]}>
            LOCAL
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'device' && styles.activeTabButton]}
          onPress={() => setActiveTab('device')}
          activeOpacity={0.7}
        >
          <MaterialDesignIcons 
            name="cellphone" 
            size={20} 
            color={activeTab === 'device' ? '#00E5FF' : '#A0A0A5'} 
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === 'device' && styles.activeTabText]}>
            DEVICE
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. CONTENT AREA */}
      <View style={styles.contentArea}>
        
        {/* TAB: LOCAL */}
        {activeTab === 'local' && (
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
              <MaterialDesignIcons name="image-off-outline" size={80} color="rgba(255,255,255,0.1)" />
              <Text style={styles.emptyText}>Belum ada media yang direkam</Text>
            </View>
          )
        )}

        {/* TAB: DEVICE */}
        {activeTab === 'device' && (
          <View style={styles.emptyContainer}>
            <View style={styles.devIconContainer}>
              <MaterialDesignIcons name="hammer-wrench" size={60} color="#00E5FF" />
            </View>
            <Text style={styles.devTitle}>Under Development</Text>
            <Text style={styles.devSubtitle}>
              Fitur dari gallery device ini masih dalam tahap pengembangan.
            </Text>
          </View>
        )}

      </View>
    </SafeAreaView>
  );
};

/* =========================================================
   STYLE (MODERN DARK THEME)
========================================================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Pitch black
  },
  
  // HEADER
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 1.5,
  },

  // TABS
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 15,
    backgroundColor: 'rgba(28,28,30,0.8)',
    borderRadius: 14,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  activeTabButton: {
    backgroundColor: '#1C1C1E', // Warna tab aktif
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  tabIcon: {
    marginRight: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A0A0A5',
  },
  activeTabText: {
    color: '#00E5FF', // Aksen Cyan
    fontWeight: 'bold',
  },

  // CONTENT
  contentArea: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  mediaItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    padding: 1, // Memberikan efek border/grid
  },
  thumbnail: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  
  // VIDEO OVERLAY
  videoIndicator: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)', // Sedikit gelap biar icon play kelihatan
  },
  videoBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  // EMPTY & DEV STATES
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
    marginTop: 15,
    fontSize: 16,
    textAlign: 'center',
  },
  devIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  devTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  devSubtitle: {
    fontSize: 15,
    color: '#A0A0A5',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default GalleryScreen;