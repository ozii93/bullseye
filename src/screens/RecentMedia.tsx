import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import RNFS from 'react-native-fs';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import Video from 'react-native-video';
import Share from 'react-native-share';

const { width } = Dimensions.get('window');

type MediaItem = {
  uri: string;
  name: string;
  path: string;
  isVideo: boolean;
  isImage: boolean;
  date: Date | null;
};

const RecentMedia = ({ route, navigation }: any) => {
  const { uri } = route.params || {};

  const [mediaFiles, setMediaFiles] = useState<MediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadAllMedia();
  }, []);

  const loadAllMedia = async (): Promise<void> => {
    try {
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

  const handleShare = async () => {
    if (!activeItem) return;

    try {
      await Share.open({
        url: activeItem.uri,
        type: activeItem.isVideo
          ? 'video/*'
          : 'image/*',
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
      await CameraRoll.save(activeItem.uri, {
        type: activeItem.isVideo
          ? 'video'
          : 'photo',
        album: 'BullsEye',
      });

      Alert.alert(
        'Sukses',
        'Media berhasil disimpan',
      );
    } catch (error) {
      Alert.alert(
        'Gagal',
        'Tidak bisa menyimpan media',
      );
    }
  };

  const handleDelete = () => {
    if (!activeItem) return;

    Alert.alert(
      'Hapus Media',
      'Yakin ingin menghapus file ini?',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await RNFS.unlink(
                activeItem.path,
              );

              const updated =
                mediaFiles.filter(
                  (_, i) =>
                    i !== currentIndex,
                );

              if (updated.length === 0) {
                navigation.goBack();
                return;
              }

              setMediaFiles(updated);

              if (
                currentIndex >=
                updated.length
              ) {
                setCurrentIndex(
                  updated.length - 1,
                );
              }
            } catch (error) {
              Alert.alert(
                'Error',
                'Gagal hapus file',
              );
            }
          },
        },
      ],
    );
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: MediaItem;
    index: number;
  }) => {
    return (
      <View style={styles.slide}>
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
        style={
          styles.actionRow
        }
      >
        <IconButton
          icon="share-variant"
          iconColor="#A0A0A5"
          size={26}
          onPress={
            handleShare
          }
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
    width,
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
  mainActionButton: {
    backgroundColor: '#FFF',
    borderRadius: 40,
  },
});