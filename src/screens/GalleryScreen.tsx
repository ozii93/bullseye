import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Text, SegmentedButtons, useTheme, Card, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_SIZE = width / COLUMN_COUNT - 2;

const GalleryScreen = () => {
  const theme = useTheme();
  const [storageType, setStorageType] = useState('device');

  // Placeholder data - Nanti bisa dihubungkan ke API / FileSystem
  const deviceMedia = [
    { id: '1', type: 'image', uri: 'https://picsum.photos/400/400?random=1', date: '2024-04-28' },
    { id: '2', type: 'video', uri: 'https://picsum.photos/400/400?random=2', date: '2024-04-28' },
    { id: '3', type: 'image', uri: 'https://picsum.photos/400/400?random=3', date: '2024-04-27' },
  ];

  const phoneMedia = [
    { id: '101', type: 'image', uri: 'https://picsum.photos/400/400?random=10', date: '2024-04-25' },
    { id: '102', type: 'image', uri: 'https://picsum.photos/400/400?random=11', date: '2024-04-24' },
  ];

  const currentMedia = storageType === 'device' ? deviceMedia : phoneMedia;

  const renderMediaItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.mediaItem}>
      <Image source={{ uri: item.uri }} style={styles.thumbnail} />
      {item.type === 'video' && (
        <View style={styles.videoIndicator}>
          <MaterialDesignIcons name="play-circle" size={24} color="#FFF" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Media Gallery</Text>
        <IconButton icon="dots-vertical" iconColor="#FFF" onPress={() => {}} />
      </View>

      <View style={styles.selectorContainer}>
        <SegmentedButtons
          value={storageType}
          onValueChange={setStorageType}
          buttons={[
            {
              value: 'device',
              label: 'Device',
              icon: 'router-wireless',
              checkedColor: theme.colors.secondary,
              labelStyle: { color: storageType === 'device' ? theme.colors.secondary : '#FFF' },
            },
            {
              value: 'phone',
              label: 'Phone',
              icon: 'cellphone',
              checkedColor: theme.colors.secondary,
              labelStyle: { color: storageType === 'phone' ? theme.colors.secondary : '#FFF' },
            },
          ]}
          style={styles.segmentedButtons}
          theme={{ 
            colors: { 
              secondaryContainer: 'rgba(255,255,255,0.1)', // Warna latar saat terpilih
              onSecondaryContainer: theme.colors.secondary // Warna teks saat terpilih
            } 
          }}
        />
      </View>

      {currentMedia.length > 0 ? (
        <FlatList
          data={currentMedia}
          renderItem={renderMediaItem}
          keyExtractor={(item) => item.id}
          numColumns={COLUMN_COUNT}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialDesignIcons name="image-off-outline" size={80} color="rgba(255,255,255,0.1)" />
          <Text style={styles.emptyText}>No media found in {storageType}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  selectorContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  segmentedButtons: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  listContent: {
    padding: 1,
  },
  mediaItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: 1,
    backgroundColor: '#333',
  },
  thumbnail: {
    flex: 1,
  },
  videoIndicator: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
    marginTop: 15,
    fontSize: 16,
  },
});

export default GalleryScreen;
