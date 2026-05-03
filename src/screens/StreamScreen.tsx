import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Text,
  StatusBar,
  Alert,
  DeviceEventEmitter,
  Image,
  Dimensions,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import GuideStreamView, { GuideStreamViewRef } from '../components/GuideStreamView';
import RNFS from 'react-native-fs';
import { PALETTES as PalettesConstant } from '../core/constant';
import { createThumbnail } from 'react-native-create-thumbnail';
import Slider from '@react-native-community/slider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const RETICLE_TYPES = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, label: `Type ${i + 1}` }));

const RETICLE_COLORS = [
  { id: 0, name: 'Green', color: '#00FF00' },
  { id: 1, name: 'Black', color: '#000000' },
  { id: 2, name: 'White', color: '#FFFFFF' },
  { id: 3, name: 'Red', color: '#FF0000' },
];

/* =========================================================
   HARDWARE COMMAND HELPERS
======================================================== */

async function sendReticleCommand(endpoint: string, value: string) {
  const url = `http://192.168.42.1/api/v1/peripheral/${endpoint}`;
  const payload = JSON.stringify({ value });

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload,
    });
    const result = await response.text();
    console.log(`✅ Reticle ${endpoint} set to ${value}:`, result);
  } catch (error) {
    console.error(`❌ Gagal set reticle ${endpoint}:`, error);
  }
}

async function setHardwareReticleType(index: number) {
  await sendReticleCommand('dashtype', String(index));
}

async function setHardwareReticleColor(index: number) {
  await sendReticleCommand('dashcolor', String(index));
}

async function setHardwareReticleBrightness(value: number) {
  await sendReticleCommand('dashlight', String(value));
}


/* =========================================================
   CONFIG
======================================================== */

const API_URL = 'http://192.168.42.1/api/v1/files/customdata';

/* =========================================================
   PALETTES
======================================================== */

const PALETTES = PalettesConstant;

/* =========================================================
   COMMAND PROTOCOL
======================================================== */

const CommandProtocol = {
  FRAME_HEAD: [0x55, 0xaa],
  FRAME_END: [0xf0],
  PALLET: [0x02, 0x00, 0x04],
};

/* =========================================================
   BYTE HELPERS
======================================================== */

function intToByteArray(value: number): number[] {
  return [
    (value >> 24) & 0xff,
    (value >> 16) & 0xff,
    (value >> 8) & 0xff,
    value & 0xff,
  ];
}

function bytesToHex(bytes: number[]) {
  return bytes.map((v) => v.toString(16).padStart(2, '0')).join(' ');
}

/* =========================================================
   JADX TRANSLATION
======================================================== */

function structSerialPortParam(command: number[], value: number): number[] {
  return [...command, ...intToByteArray(value)];
}

function buildPacket(payload: number[]): Uint8Array {
  const length = payload.length;

  const packet: number[] = [];

  // HEADER
  packet.push(0x55, 0xaa);
  packet.push(length);

  // PAYLOAD
  packet.push(...payload);

  // CHECKSUM (FIXED RULE)
  let checksum = length;

  for (let i = 0; i < payload.length; i++) {
    checksum ^= payload[i];
  }

  packet.push(checksum & 0xff);

  // END
  packet.push(0xf0);

  console.log('HEX =>', bytesToHex(packet));

  return new Uint8Array(packet);
}

async function sendBinary(data: Uint8Array) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', API_URL, true);
    xhr.setRequestHeader('Content-Type', 'application/customdata');
    xhr.setRequestHeader('Expect', '');
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) { // 4 artinya request selesai
        console.log(xhr)
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('✅ BERHASIL KIRIM PALETTE! Server balas:', xhr.responseText);
          resolve(xhr.responseText);
        } else {
          console.log(`❌ GAGAL! Nginx nolak dengan Status: ${xhr.status}`);
          reject(new Error(`Status ${xhr.status}`));
        }
      }
    };
    xhr.onerror = (e) => {
      console.log('❌ KONEKSI PUTUS / ERROR JARINGAN');
      reject(e);
    };
    xhr.send(data.buffer);
  });
}

async function sendPallet(id: number) {
  const payload = structSerialPortParam(
    CommandProtocol.PALLET,
    id
  );

  const packet = buildPacket(payload);
  console.log("packet: " + packet)
  await sendBinary(packet);
}

/* =========================================================
   SCREEN
======================================================== */

const StreamScreen = ({ navigation, isFocused }: any) => {
  const [isPaletteVisible, setIsPaletteVisible] = useState(false);
  const [activePalette, setActivePalette] = useState(0);
  const [playerKey, setPlayerKey] = useState(1);
  const [isVideoMode, setIsVideoMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const guideRef = useRef<GuideStreamViewRef>(null);
  const [renderPlayer, setRenderPlayer] = useState(false);
  const [lastMedia, setLastMedia] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showReticle, setShowReticle] = useState(false);
  const [isReticleToolsVisible, setIsReticleToolsVisible] = useState(false);
  const [reticleBrightness, setReticleBrightness] = useState(5);
  const [reticleType, setReticleType] = useState(1);
  const [reticleColor, setReticleColor] = useState(0);

  useEffect(() => {
    const loadLatestThumbnail = async () => {
      try {
        const docFiles = await RNFS.readDir(RNFS.DocumentDirectoryPath);
        const cacheFiles = await RNFS.readDir(RNFS.CachesDirectoryPath);

        const files = [...docFiles, ...cacheFiles];

        const media = files.filter(f =>
          f.name.endsWith('.png') ||
          f.name.endsWith('.jpg') ||
          f.name.endsWith('.mp4') ||
          f.name.endsWith('.ts')
        );

        if (media.length === 0) {
          setLastMedia(null);
          return;
        }

        media.sort((a, b) => {
          const dateA = a.mtime ? new Date(a.mtime).getTime() : 0;
          const dateB = b.mtime ? new Date(b.mtime).getTime() : 0;
          return dateB - dateA;
        });

        const latest = media[0];

        if (
          latest.name.endsWith('.png') ||
          latest.name.endsWith('.jpg')
        ) {
          setLastMedia(`file://${latest.path}`);
        } else {
          const thumb = await createThumbnail({
            url: `file://${latest.path}`,
            timeStamp: 1000,
          });

          setLastMedia(thumb.path);
        }

      } catch (error) {
        console.log('❌ Thumbnail error:', error);
      }
    };

    loadLatestThumbnail();

    const unsubscribe = navigation.addListener('focus', loadLatestThumbnail);

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    let interval: number;

    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }

    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    if (!renderPlayer) {
      setRenderPlayer(true);
      setRenderPlayer(!renderPlayer)
    } else {
      const timer = setTimeout(() => {
        setRenderPlayer(false);
        setRenderPlayer(!renderPlayer)
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleChangePalette = async (palette: any) => {
    setActivePalette(palette.uiId);
    await sendPallet(palette.value);
    console.log('Palette Changed:', palette.name);
  };

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const handleCapture = async () => {
    try {
      console.log('🔗 Triggering hardware calibration...');
      await fetch('http://192.168.42.1/api/v1/paramline');

      const filename = `BullsEye${Date.now()}.png`;
      const localPath = `${RNFS.DocumentDirectoryPath}/${filename}`;

      await RNFS.downloadFile({
        fromUrl: 'http://192.168.42.1/screenshot/',
        toFile: localPath,
      }).promise;

      console.log('📸 Saved:', localPath);
      setLastMedia(`file://${localPath}`);
    } catch (e) {
      console.log('❌ Capture Error:', e);
    }
  };

  const handleRecordVideo = async () => {
    try {
      if (isRecording) {
        console.log("⏹️ Stop recording...");
        guideRef.current?.stopRecord();
        setIsRecording(false);
      } else {
        console.log("⏺️ Start recording...");
        await fetch("http://192.168.42.1/api/v1/paramline").catch(() => { });

        const filename = `BullsEye_${Date.now()}.mp4`;
        const savePath = `${RNFS.CachesDirectoryPath}/${filename}`;
        console.log("🎥 Save to:", savePath);

        guideRef.current?.startRecord(savePath);
        setIsRecording(true);
      }
    } catch (e) {
      console.log("❌ Record error:", e);
      setIsRecording(false);
    }
  };

  const handleRecordComplete = (event: { nativeEvent: { path: string } }) => {
    const { path } = event.nativeEvent;
    console.log("✅ Record complete:", path);
    setLastMedia(`file://${path}`);
    Alert.alert("Sukses", "Video berhasil direkam");
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {renderPlayer && (
        <GuideStreamView
          ref={guideRef}
          key={playerKey}
          style={styles.videoStream}
          rtspType={1}
          onRecordComplete={handleRecordComplete}
        />
      )}


      {/* Reticle Overlay removed as it is now handled by hardware */}


      <SafeAreaView style={styles.overlayContainer} edges={['top', 'bottom']}>
        {/* HEADER */}
        <View style={styles.floatingHeader}>
          <View style={styles.headerLeft}>
            <IconButton
              icon="chevron-left"
              iconColor="#FFF"
              size={28}
              onPress={() => {
                navigation.push('Main')
              }}
              rippleColor="rgba(255, 255, 255, 0.2)"
            />
          </View>

          <View style={styles.headerCenter}>
            <View style={[styles.statusBadge, isRecording && { backgroundColor: 'rgba(255, 59, 48, 0.2)' }]}>
              <View style={[styles.liveDot, isRecording && { backgroundColor: '#FF3B30' }]} />
              <Text style={[styles.statusText, isRecording && { color: '#FF3B30' }]}>
                {isRecording ? 'REC' : 'LIVE'}
              </Text>
            </View>

            {isRecording && (
              <Text style={styles.timerText}>{formatTime(recordingTime)}</Text>
            )}
          </View>

          <View style={styles.headerRight}>
            <IconButton
              icon="crosshairs-gps"
              iconColor={showReticle ? '#00E5FF' : '#FFF'}
              size={24}
              onPress={async () => {
                const newState = !showReticle;
                setShowReticle(newState);
                if (newState) {
                  setIsReticleToolsVisible(true);
                  // Enable reticle on hardware with current type
                  await setHardwareReticleType(reticleType);
                  await setHardwareReticleBrightness(reticleBrightness);
                  await setHardwareReticleColor(RETICLE_COLORS[reticleColor].name.toLowerCase());
                } else {
                  setIsReticleToolsVisible(false);
                  // Disable reticle on hardware by setting type to 0
                  await setHardwareReticleType(0);
                }
              }}
            />
            <IconButton
              icon="cog"
              iconColor="#FFF"
              size={24}
              onPress={() => { }}
            />
          </View>
        </View>


        {/* BOTTOM SECTION */}
        <View style={styles.bottomSection}>
          {isPaletteVisible && (
            <View style={styles.paletteWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.paletteScroll}
              >
                {PALETTES.map((item) => {
                  const isActive = activePalette === item.uiId;
                  return (
                    <TouchableOpacity
                      key={item.uiId}
                      activeOpacity={0.7}
                      style={[
                        styles.palettePill,
                        isActive && styles.activePalettePill,
                      ]}
                      onPress={() => handleChangePalette(item)}
                    >
                      <View
                        style={[
                          styles.colorDot,
                          { backgroundColor: item.color },
                        ]}
                      />
                      <Text
                        style={[
                          styles.paletteText,
                          isActive && styles.activePaletteText,
                        ]}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {isReticleToolsVisible && (
            <View style={styles.reticleToolsWrapper}>
              <Text style={styles.reticleToolsLabel}>
                Brightness: {reticleBrightness}
              </Text>
              <View style={styles.sliderRow}>
                <Text style={styles.sliderMin}>1</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={10}
                  step={1}
                  value={reticleBrightness}
                  onValueChange={async (v: number) => {
                    setReticleBrightness(v);
                    await setHardwareReticleBrightness(v);
                  }}
                  minimumTrackTintColor="#00E5FF"
                  maximumTrackTintColor="rgba(255,255,255,0.2)"
                  thumbTintColor="#00E5FF"
                />
                <Text style={styles.sliderMax}>10</Text>
              </View>

              <Text style={styles.reticleToolsLabel}>Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.typeRow}>
                  {RETICLE_TYPES.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      style={[
                        styles.typePill,
                        reticleType === t.id && styles.activeTypePill,
                      ]}
                      onPress={async () => {
                        setReticleType(t.id);
                        await setHardwareReticleType(t.id);
                      }}
                    >
                      <Text
                        style={[
                          styles.typeText,
                          reticleType === t.id && styles.activeTypeText,
                        ]}
                      >
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.reticleToolsLabel}>Color</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.typeRow}>
                  {RETICLE_COLORS.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.colorPill,
                        reticleColor === c.id && styles.activeColorPill,
                      ]}
                      onPress={async () => {
                        setReticleColor(c.id);
                        // Send the color name in lowercase as expected by hardware
                        await setHardwareReticleColor(RETICLE_COLORS[c.id].name.toLowerCase());
                      }}
                    >
                      <View style={[styles.colorSwatch, { backgroundColor: c.color }]} />
                      <Text
                        style={[
                          styles.typeText,
                          reticleColor === c.id && styles.activeTypeText,
                        ]}
                      >
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          <View style={styles.bottomDock}>
            <View style={styles.dockItem}>
              <TouchableOpacity
                style={styles.galleryButton}
                onPress={() => lastMedia && navigation.navigate('RecentMedia', { uri: lastMedia })}
              >
                <View style={styles.galleryThumb}>
                  {lastMedia && <Image source={{ uri: lastMedia }} style={{ flex: 1, borderRadius: 10 }} />}
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.dockItem}>
              <IconButton
                icon={isVideoMode ? "camera-outline" : "video-outline"}
                iconColor={isVideoMode ? "#00E5FF" : "#FFF"}
                size={30}
                onPress={() => {
                  if (!isRecording) {
                    setIsVideoMode(!isVideoMode);
                  }
                }}
              />
            </View>

            <View style={styles.dockItem}>
              <TouchableOpacity
                style={[
                  styles.shutterOuter,
                  isVideoMode && { borderColor: '#FF3B30' }
                ]}
                activeOpacity={0.7}
                onPress={isVideoMode ? handleRecordVideo : handleCapture}
              >
                <View style={[
                  styles.shutterInner,
                  isVideoMode && { backgroundColor: '#FF3B30' },
                  isRecording && { borderRadius: 8, transform: [{ scale: 0.6 }] }
                ]} />
              </TouchableOpacity>
            </View>

            <View style={styles.dockItem}>
              {/* Empty space where reticle was */}
            </View>

            <View style={styles.dockItem}>
              <IconButton
                icon="palette"
                iconColor={isPaletteVisible ? '#00E5FF' : '#FFF'}
                size={30}
                onPress={() => setIsPaletteVisible(!isPaletteVisible)}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default StreamScreen;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
    letterSpacing: 1,
  },
  videoStream: {
    position: 'absolute',
    top: 170,
    aspectRatio: 1,

    width: 500,
    height: 500,

    alignSelf: 'center',
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  // SCOPE DESIGN
  scopeOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginTop: 150,
  },
  scopeCircle: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    borderRadius: (SCREEN_WIDTH * 0.7) / 2,
    backgroundColor: 'transparent',
    borderWidth: 1000,
    borderColor: '#000',
  },
  reticleContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 150,
  },
  reticleImage: {
    width: 250,
    height: 250,
    opacity: 0.9,
  },
  floatingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: 20,
  },
  headerLeft: { width: 50 },
  headerRight: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'flex-end',
    width: 100 
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    marginRight: 8,
  },
  statusText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  midInfo: {
    position: 'absolute',
    top: '75%', // Lowered to match new scope position
    width: '100%',
    alignItems: 'center',
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  infoDivider: {
    width: 1,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 12,
  },
  isoText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusIndicatorsContainer: {
    position: 'absolute',
    top: '92%', // Lowered to match new scope position
    width: '100%',
    alignItems: 'center',
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniIcon: {
    margin: 0,
    padding: 0,
    width: 24,
  },
  indicatorText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
    marginHorizontal: 4,
  },
  bottomSection: {
    paddingBottom: 30,
    alignItems: 'center',
  },
  paletteWrapper: {
    width: '100%',
    marginBottom: 20,
  },
  paletteScroll: {
    paddingHorizontal: 20,
  },
  palettePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(28,28,30,0.8)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  activePalettePill: {
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0,229,255,0.1)',
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  paletteText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
  },
  activePaletteText: {
    color: '#00E5FF',
    fontWeight: 'bold',
  },
  bottomDock: {
    flexDirection: 'row',
    width: '94%',
    height: 80,
    backgroundColor: 'rgba(20,20,20,0.9)',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  dockItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryButton: { width: 44, height: 44 },
  galleryThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    padding: 2,
  },
  shutterOuter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: '#FFF',
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    backgroundColor: '#FFF',
  },
  reticleToolsWrapper: {
    width: '94%',
    backgroundColor: 'rgba(20,20,20,0.9)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  reticleToolsLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderMin: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginRight: 8,
    width: 16,
    textAlign: 'center',
  },
  sliderMax: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginLeft: 8,
    width: 20,
    textAlign: 'center',
  },
  typeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  typePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  activeTypePill: {
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0,229,255,0.12)',
  },
  typeText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '600',
  },
  activeTypeText: {
    color: '#00E5FF',
  },
  colorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  activeColorPill: {
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0,229,255,0.12)',
  },
  colorSwatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
});
