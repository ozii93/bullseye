import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  Text,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { Surface, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { useNotification } from '../provider/NotificationContext';

interface DeviceFile {
  name: string;
  type: 'image' | 'video';
  size: string;
}

const getFileNameFromUri = (uri: string) => decodeURIComponent(uri.split('/').pop() || `BullsEye_${Date.now()}`);
const getPathFromFileUri = (uri: string) => decodeURIComponent(uri.replace('file://', '').split('?')[0]);

const getMimeType = (name: string, isVideo: boolean) => {
  const lower = name.toLowerCase();

  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.ts')) return 'video/mp2t';

  return isVideo ? 'video/*' : 'image/*';
};

const getShareType = (items: { name: string; isVideo: boolean }[]) => {
  if (items.length === 0) return '*/*';

  const hasImage = items.some((item) => !item.isVideo);
  const hasVideo = items.some((item) => item.isVideo);

  if (hasImage && hasVideo) return '*/*';
  return getMimeType(items[0].name, items[0].isVideo);
};

const getDeviceFileUrl = (file: DeviceFile) => {
  const filename = encodeURIComponent(file.name);

  return file.type === 'video'
    ? `http://192.168.42.1/api/v1/files/videos/${filename}`
    : `http://192.168.42.1/api/v1/files/download/${filename}`;
};

const mapDeviceFileToViewerItem = (file: DeviceFile) => ({
  uri: getDeviceFileUrl(file),
  name: file.name,
  path: '',
  isVideo: file.type === 'video',
  isImage: file.type !== 'video',
  date: null,
  source: 'device',
});

const GalleryScreen = ({ navigation }: any) => {
  const { showSnackbar } = useNotification();
  const { width, height } = useWindowDimensions();
  const isWideScreen = width > height;
  const columnCount = isWideScreen
    ? Math.max(4, Math.min(8, Math.floor(width / 150)))
    : 3;
  const itemSize = width / columnCount;
  const [activeTab, setActiveTab] = useState<'local' | 'device'>('local');
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [cloudFiles, setCloudFiles] = useState<DeviceFile[]>([]);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedLocalUris, setSelectedLocalUris] = useState<string[]>([]);
  const [selectedDeviceNames, setSelectedDeviceNames] = useState<string[]>([]);

  const selectedCount = activeTab === 'local'
    ? selectedLocalUris.length
    : selectedDeviceNames.length;

  const clearSelection = useCallback(() => {
    setIsSelecting(false);
    setSelectedLocalUris([]);
    setSelectedDeviceNames([]);
  }, []);

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
        f.name.endsWith('.jpeg') ||
        f.name.endsWith('.mp4') ||
        f.name.endsWith('.ts')
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
    if (isSelecting) {
      toggleDeviceSelection(file.name);
      return;
    }

    navigation.navigate('RecentMedia', {
      uri: getDeviceFileUrl(file),
      mediaItems: cloudFiles.map(mapDeviceFileToViewerItem),
      source: 'device',
    });
    return;

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
      showSnackbar('Gagal mengunduh file dari device');
    }
  };

  const toggleLocalSelection = (uri: string) => {
    setIsSelecting(true);
    setSelectedLocalUris((current) =>
      current.includes(uri)
        ? current.filter((selected) => selected !== uri)
        : [...current, uri],
    );
  };

  const toggleDeviceSelection = (name: string) => {
    setIsSelecting(true);
    setSelectedDeviceNames((current) =>
      current.includes(name)
        ? current.filter((selected) => selected !== name)
        : [...current, name],
    );
  };

  const handleSelectAll = () => {
    if (activeTab === 'local') {
      setSelectedLocalUris(mediaFiles);
    } else {
      setSelectedDeviceNames(cloudFiles.map((file) => file.name));
    }
    setIsSelecting(true);
  };

  const copyLocalToShareCache = async (uri: string) => {
    const sourcePath = getPathFromFileUri(uri);
    const name = getFileNameFromUri(uri);
    const sharePath = `${RNFS.CachesDirectoryPath}/${name}`;

    if (sourcePath !== sharePath) {
      await RNFS.unlink(sharePath).catch(() => {});
      await RNFS.copyFile(sourcePath, sharePath);
    }

    return {
      url: `file://${sharePath}`,
      name,
      isVideo: name.toLowerCase().endsWith('.mp4') || name.toLowerCase().endsWith('.ts'),
    };
  };

  const downloadDeviceToShareCache = async (file: DeviceFile) => {
    const localPath = `${RNFS.CachesDirectoryPath}/${file.name}`;
    const exists = await RNFS.exists(localPath);

    if (!exists) {
      const url = getDeviceFileUrl(file);
      await RNFS.downloadFile({ fromUrl: url, toFile: localPath }).promise;
    }

    return {
      url: `file://${localPath}`,
      name: file.name,
      isVideo: file.type === 'video',
    };
  };

  const handleShareSelected = async () => {
    if (selectedCount === 0) return;

    try {
      const shareItems = activeTab === 'local'
        ? await Promise.all(selectedLocalUris.map(copyLocalToShareCache))
        : await Promise.all(
          cloudFiles
            .filter((file) => selectedDeviceNames.includes(file.name))
            .map(downloadDeviceToShareCache),
        );

      await Share.open({
        urls: shareItems.map((item) => item.url),
        filenames: shareItems.map((item) => item.name),
        type: getShareType(shareItems),
        failOnCancel: false,
      });
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        console.log('Share selected error:', error);
        showSnackbar('Gagal membagikan media terpilih');
      }
    }
  };

  const deleteRemoteFile = async (file: DeviceFile) => {
    const response = await fetch(`http://192.168.42.1/api/v1/files/${encodeURIComponent(file.name)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.status}`);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedCount === 0) return;

    showSnackbar(`Hapus ${selectedCount} media terpilih?`, {
      actionLabel: 'HAPUS',
      onAction: async () => {
        try {
          if (activeTab === 'local') {
            await Promise.all(
              selectedLocalUris.map((uri) => RNFS.unlink(getPathFromFileUri(uri)).catch(() => {})),
            );
            await loadMedia();
          } else {
            await Promise.all(
              cloudFiles
                .filter((file) => selectedDeviceNames.includes(file.name))
                .map(deleteRemoteFile),
            );
            await fetchCloudFiles();
          }

          clearSelection();
          showSnackbar(`${selectedCount} media berhasil dihapus`);
        } catch (error) {
          console.log('Delete selected error:', error);
          showSnackbar(activeTab === 'device'
            ? 'Gagal menghapus file dari remote device'
            : 'Gagal menghapus media terpilih');
        }
      },
    });
  };

  const renderSelectionBadge = (selected: boolean) => (
    <View style={[styles.selectionBadge, selected && styles.selectionBadgeActive]}>
      {selected && <MaterialDesignIcons name="check" size={18} color="#05070a" />}
    </View>
  );

  const renderMediaItem = ({ item }: { item: string }) => {
    const isVideo = item.endsWith('.mp4') || item.endsWith('.ts');
    const isSelected = selectedLocalUris.includes(item);
    return (
      <TouchableOpacity style={[styles.mediaItem, { width: itemSize, height: itemSize }]} activeOpacity={0.8}
        onLongPress={() => toggleLocalSelection(item)}
        onPress={() => isSelecting ? toggleLocalSelection(item) : navigation.navigate('RecentMedia', { uri: item })}>
        <Surface style={[styles.thumbnailFrame, isSelected && styles.selectedFrame]} elevation={2}>
          <Image source={{ uri: item }} style={styles.thumbnail} />
          {isVideo && <View style={styles.videoOverlay}>
            <MaterialDesignIcons name="play-circle-outline" size={28} color="#FFF" />
          </View>}
          {isSelecting && renderSelectionBadge(isSelected)}
        </Surface>
      </TouchableOpacity>
    );
  };

  const renderDeviceItem = ({ item }: { item: DeviceFile }) => {
    const isVideo = item.type === 'video';
    const isSelected = selectedDeviceNames.includes(item.name);
    const filename = encodeURIComponent(item.name);
    const thumbUrl = isVideo
      ? `http://192.168.42.1/api/v1/files/videos/${filename}/thumb/1`
      : getDeviceFileUrl(item);
    return (
      <TouchableOpacity style={[styles.mediaItem, { width: itemSize, height: itemSize }]} activeOpacity={0.8}
        onLongPress={() => toggleDeviceSelection(item.name)}
        onPress={() => handleDeviceFilePress(item)}>
        <Surface style={[styles.thumbnailFrame, isSelected && styles.selectedFrame]} elevation={2}>
          <Image source={{ uri: thumbUrl }} style={styles.thumbnail} />
          {isVideo && <View style={styles.videoOverlay}>
            <MaterialDesignIcons name="play-circle-outline" size={28} color="#FFF" />
          </View>}
          {isSelecting && renderSelectionBadge(isSelected)}
        </Surface>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    if (activeTab === 'device') {
      fetchCloudFiles();
    }
    clearSelection();
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
          onPress={() => isSelecting ? clearSelection() : navigation.goBack()} 
        />
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{isSelecting ? `${selectedCount} SELECTED` : 'INTELLIGENCE ARCHIVE'}</Text>
          <Text style={styles.subtitle}>{isSelecting ? 'LONG PRESS MEDIA TO SELECT' : 'TACTICAL MEDIA STORAGE'}</Text>
        </View>
        <IconButton 
          icon={isSelecting ? 'close' : 'shield-search'} 
          iconColor={isSelecting ? '#FFF' : '#D32F2F'} 
          size={24} 
          onPress={isSelecting ? clearSelection : () => {}} 
        />
      </View>

      {isSelecting && (
        <View style={styles.selectionToolbar}>
          <TouchableOpacity style={styles.selectionAction} onPress={handleSelectAll}>
            <MaterialDesignIcons name="select-all" size={20} color="#FFF" />
            <Text style={styles.selectionActionText}>SELECT ALL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.selectionAction} onPress={clearSelection}>
            <MaterialDesignIcons name="close-circle-outline" size={20} color="#FFF" />
            <Text style={styles.selectionActionText}>CANCEL</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.selectionIconButton, selectedCount === 0 && styles.disabledAction]}
            disabled={selectedCount === 0}
            onPress={handleShareSelected}
          >
            <MaterialDesignIcons name="share-variant" size={22} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.selectionIconButton, styles.deleteAction, selectedCount === 0 && styles.disabledAction]}
            disabled={selectedCount === 0}
            onPress={handleDeleteSelected}
          >
            <MaterialDesignIcons name="trash-can-outline" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

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
              key={`local-${columnCount}`}
              data={mediaFiles}
              renderItem={renderMediaItem}
              keyExtractor={(item) => item}
              numColumns={columnCount}
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
              key={`device-${columnCount}`}
              data={cloudFiles}
              renderItem={renderDeviceItem}
              keyExtractor={(item) => item.name}
              numColumns={columnCount}
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
  selectionToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  selectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginRight: 4,
  },
  selectionActionText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginLeft: 6,
  },
  selectionIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  deleteAction: {
    marginLeft: 8,
    backgroundColor: 'rgba(211,47,47,0.18)',
    borderColor: 'rgba(211,47,47,0.35)',
  },
  disabledAction: {
    opacity: 0.35,
  },
  listContent: {
    paddingBottom: 40,
  },
  mediaItem: {
    padding: 2,
  },
  thumbnailFrame: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  selectedFrame: {
    borderColor: '#D32F2F',
    borderWidth: 2,
  },
  thumbnail: {
    flex: 1,
    backgroundColor: '#0c1018',
  },
  selectionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  selectionBadgeActive: {
    backgroundColor: '#FFF',
    borderColor: '#FFF',
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
