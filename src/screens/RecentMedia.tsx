import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import RNFS from 'react-native-fs';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import Video from 'react-native-video';
import Share from 'react-native-share';
import { useNotification } from '../provider/NotificationContext';

type MediaItem = {
  uri: string;
  name: string;
  path?: string;
  isVideo: boolean;
  isImage: boolean;
  date: Date | null;
  source?: 'local' | 'device';
};

const getShareMimeType = (item: MediaItem) => {
  const lower = item.name.toLowerCase();

  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.ts')) return 'video/mp2t';

  return item.isVideo ? 'video/*' : 'image/*';
};

const getDeviceDeleteUrl = (item: MediaItem) =>
  `http://192.168.42.1/api/v1/files/${encodeURIComponent(item.name)}`;

const RecentMedia = ({ route, navigation }: any) => {
  const { uri, mediaItems } = route.params || {};
  const { showSnackbar } = useNotification();
  const { width, height } = useWindowDimensions();
  const isWideScreen = width > height;

  const [mediaFiles, setMediaFiles] = useState<MediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadAllMedia();
  }, [route.params]);

  const loadAllMedia = async (): Promise<void> => {
    try {
      if (Array.isArray(mediaItems) && mediaItems.length > 0) {
        setMediaFiles(mediaItems);

        const index = uri
          ? mediaItems.findIndex((item: MediaItem) => item.uri === uri)
          : 0;
        const nextIndex = index !== -1 ? index : 0;

        setCurrentIndex(nextIndex);

        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: nextIndex,
            animated: false,
          });
        }, 300);
        return;
      }

      const bullsEyePath = `${RNFS.ExternalDirectoryPath}/DCIM/BullsEye`;
      
      const docFiles = await RNFS.readDir(RNFS.DocumentDirectoryPath).catch(() => []);
      const cacheFiles = await RNFS.readDir(RNFS.CachesDirectoryPath).catch(() => []);
      const externalFiles = await RNFS.readDir(bullsEyePath).catch(() => []);

      const allFiles = [...docFiles, ...cacheFiles, ...externalFiles];

      const filtered = allFiles.filter((file) => {
        const name = file.name.toLowerCase();

        return (
          name.endsWith('.png') ||
          name.endsWith('.jpg') ||
          name.endsWith('.jpeg') ||
          name.endsWith('.mp4') ||
          name.endsWith('.ts')
        );
      });

      filtered.sort((a, b) => {
        const timeA = a.mtime ? new Date(a.mtime).getTime() : 0;
        const timeB = b.mtime ? new Date(b.mtime).getTime() : 0;
        return timeB - timeA;
      });

      const mapped: MediaItem[] = filtered.map((file) => {
        const lower = file.name.toLowerCase();

        return {
          uri: `file://${file.path}`,
          name: file.name,
          path: file.path,
          isVideo:
            lower.endsWith('.mp4') ||
            lower.endsWith('.ts'),
          isImage:
            lower.endsWith('.png') ||
            lower.endsWith('.jpg') ||
            lower.endsWith('.jpeg'),
          date: file.mtime ?? null,
          source: 'local',
        };
      });

      setMediaFiles(mapped);

      if (uri) {
        const index = mapped.findIndex(
          (item) => item.uri === uri,
        );

        if (index !== -1) {
          setCurrentIndex(index);

          setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index,
              animated: false,
            });
          }, 300);
        }
      }
    } catch (error) {
      console.log('❌ Error load media:', error);
    }
  };

  const handleScrollEnd = (event: any) => {
    const slideSize =
      event.nativeEvent.layoutMeasurement.width;

    const index = Math.round(
      event.nativeEvent.contentOffset.x / slideSize,
    );

    setCurrentIndex(index);
  };

  const activeItem =
    mediaFiles[currentIndex] || null;

  const ensureLocalActionFile = async (item: MediaItem) => {
    if (item.source === 'device' || !item.path) {
      const localPath = `${RNFS.CachesDirectoryPath}/${item.name}`;
      const exists = await RNFS.exists(localPath);

      if (!exists) {
        await RNFS.downloadFile({
          fromUrl: item.uri,
          toFile: localPath,
        }).promise;
      }

      return localPath;
    }

    return item.path;
  };

  const handleShare = async () => {
    console.log('📤 Sharing:', activeItem?.uri);
    if (!activeItem) return;

    try {
      const localPath = await ensureLocalActionFile(activeItem);
      const exists = await RNFS.exists(localPath);

      if (!exists) {
        showSnackbar('File media tidak ditemukan');
        return;
      }

      const sharePath = `${RNFS.CachesDirectoryPath}/${activeItem.name}`;
      if (localPath !== sharePath) {
        await RNFS.unlink(sharePath).catch(() => {});
        await RNFS.copyFile(localPath, sharePath);
      }

      const shareUrl = `file://${sharePath}`;
      console.log('Sharing:', shareUrl);

      await Share.open({
        url: shareUrl,
        type: getShareMimeType(activeItem),
        filename: activeItem.name,
        failOnCancel: false,
      });
    } catch (error: any) {
      if (
        error?.message !==
        'User did not share'
      ) {
        console.log(error);
      }
    }
  };

  const handleSaveToDevice = async () => {
    if (!activeItem) return;

    try {
      const localPath = await ensureLocalActionFile(activeItem);

      await CameraRoll.save(`file://${localPath}`, {
        type: activeItem.isVideo
          ? 'video'
          : 'photo',
        album: 'BullsEye',
      });

      showSnackbar('Media berhasil disimpan');
    } catch (error) {
      showSnackbar('Tidak bisa menyimpan media');
    }
  };

  const handleDelete = () => {
    if (!activeItem) return;

    showSnackbar('Yakin ingin menghapus file ini?', {
      actionLabel: 'HAPUS',
      onAction: async () => {
        try {
          if (activeItem.source === 'device') {
            const response = await fetch(getDeviceDeleteUrl(activeItem), {
              method: 'DELETE',
            });

            if (!response.ok) {
              throw new Error(`Delete failed: ${response.status}`);
            }
          } else if (activeItem.path) {
            await RNFS.unlink(
              activeItem.path,
            );
          }

          const updated =
            mediaFiles.filter(
              (_, i) =>
                i !== currentIndex,
            );

          if (updated.length === 0) {
            showSnackbar('Media berhasil dihapus');
            navigation.goBack();
            return;
          }

          setMediaFiles(updated);
          showSnackbar('Media berhasil dihapus');

          if (
            currentIndex >=
            updated.length
          ) {
            setCurrentIndex(
              updated.length - 1,
            );
          }
        } catch (error) {
          showSnackbar('Gagal hapus file');
        }
      },
    });
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: MediaItem;
    index: number;
  }) => {
    return (
      <View style={[styles.slide, { width }]}>
        {item.isVideo ? (
          <Video
            source={{ uri: item.uri }}
            style={styles.image}
            resizeMode="contain"
            controls
            paused={
              currentIndex !== index
            }
            repeat={false}
          />
        ) : (
          <Image
            source={{ uri: item.uri }}
            style={styles.image}
            resizeMode="contain"
          />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={styles.container}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor="#FFF"
          size={28}
          onPress={() =>
            navigation.goBack()
          }
        />

        <View style={styles.counterBadge}>
          <Text
            style={styles.counterText}
          >
            {mediaFiles.length > 0
              ? `${currentIndex + 1} / ${mediaFiles.length}`
              : '0 / 0'}
          </Text>
        </View>

        <TouchableOpacity
          style={
            styles.galleryButton
          }
          onPress={() =>
            navigation.navigate(
              'GalleryStack',
            )
          }
        >
          <Text
            style={
              styles.galleryText
            }
          >
            ALL MEDIA
          </Text>
        </TouchableOpacity>
      </View>

      {/* CONTENT */}
      <View
        style={
          styles.imageContainer
        }
      >
        {mediaFiles.length >
          0 ? (
          <FlatList
            ref={flatListRef}
            data={mediaFiles}
            horizontal
            pagingEnabled
            keyExtractor={(
              item,
              index,
            ) =>
              `${item.uri}-${index}`
            }
            renderItem={
              renderItem
            }
            showsHorizontalScrollIndicator={
              false
            }
            onMomentumScrollEnd={
              handleScrollEnd
            }
            getItemLayout={(
              _,
              index,
            ) => ({
              length: width,
              offset:
                width *
                index,
              index,
            })}
          />
        ) : (
          <Text
            style={
              styles.errorText
            }
          >
            No Media
          </Text>
        )}
      </View>

      {/* ACTION */}
      <View
        style={[styles.actionRow, isWideScreen && styles.actionRowWide]}
      >
        <IconButton
          icon="share-variant"
          iconColor="#A0A0A5"
          size={26}
          onPress={() => handleShare()}
        />

        <View
          style={
            styles.mainActionButton
          }
        >
          <IconButton
            icon="download"
            iconColor="#121212"
            size={30}
            onPress={
              handleSaveToDevice
            }
          />
        </View>

        <IconButton
          icon="trash-can-outline"
          iconColor="#FF3B30"
          size={26}
          onPress={
            handleDelete
          }
        />
      </View>
    </SafeAreaView>
  );
};

export default RecentMedia;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    height: 60,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },
  counterBadge: {
    backgroundColor:
      '#1C1C1E',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: '10%',
  },
  counterText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  galleryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  galleryText: {
    color: '#00E5FF',
    fontWeight: 'bold',
  },
  imageContainer: {
    flex: 1,
  },
  slide: {
    height: '100%',
    justifyContent:
      'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  errorText: {
    color: '#FFF',
    textAlign: 'center',
    marginTop: 40,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent:
      'space-around',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor:
      '#1C1C1E',
  },
  actionRowWide: {
    position: 'absolute',
    right: 18,
    top: 80,
    bottom: 18,
    width: 64,
    flexDirection: 'column',
    borderTopWidth: 0,
    borderLeftWidth: 1,
    borderLeftColor: '#1C1C1E',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 32,
    paddingVertical: 18,
  },
  mainActionButton: {
    backgroundColor: '#FFF',
    borderRadius: 40,
  },
});
