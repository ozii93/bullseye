import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Text,
  StatusBar,
  Alert,
  DeviceEventEmitter,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VLCPlayer } from 'react-native-vlc-media-player';
import { PALETTES as PalettesConstant } from '../core/constant';

/* =========================================================
   CONFIG
========================================================= */

const API_URL = 'http://192.168.42.1/api/v1/files/customdata';

/* =========================================================
   PALETTES
========================================================= */

const PALETTES = PalettesConstant;

/* =========================================================
   COMMAND PROTOCOL
========================================================= */

const CommandProtocol = {
  FRAME_HEAD: [0x55, 0xaa],
  FRAME_END: [0xf0],
  PALLET: [0x02, 0x00, 0x04],
};

/* =========================================================
   BYTE HELPERS
========================================================= */

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
========================================================= */

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
========================================================= */

const HomeScreen = ({ navigation }: any) => {
  const [isPaletteVisible, setIsPaletteVisible] = useState(false);
  const [activePalette, setActivePalette] = useState(0);
  const [playerKey, setPlayerKey] = useState(1);
  const [isRecording, setIsRecording] = useState(false);

  const handleChangePalette = async (palette: any) => {
    setActivePalette(palette.uiId);
    await sendPallet(palette.value);
    console.log('Palette Changed:', palette.name);
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <VLCPlayer
        key={playerKey}
        style={styles.videoStream}
        videoAspectRatio="16:9"
        source={{
          uri: 'rtsp://192.168.42.1:8554/video',
          initOptions: [
            '--rtsp-tcp',
            '--network-caching=50',
            '--live-caching=50',
            '--clock-jitter=0',
            '--clock-synchro=0',
            '--no-drop-late-frames',
            '--skip-frames',
          ]
        }}
        autoplay
        onPlaying={() => console.log('🔥 RTSP STREAM CONNECTED & PLAYING!')}
        onError={() => {
          setTimeout(() => {
            setPlayerKey(v => v + 1);
          }, 1500);
        }}
      />

      <SafeAreaView style={styles.overlayContainer} edges={['top', 'bottom']}>
        {/* HEADER */}
        <View style={styles.floatingHeader}>
          <View style={styles.headerLeft}>
            <IconButton
              icon="chevron-left"
              iconColor="#FFF"
              size={28}
              onPress={() => {
                // Emit event untuk pindah ke tab dashboard
                DeviceEventEmitter.emit('changeTab', 'dashboard');
              }}
            />
          </View>

          <View style={styles.statusBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.statusText}>LIVE</Text>
          </View>

          <View style={styles.headerRight}>
            <IconButton
              icon="cog"
              iconColor="#FFF"
              size={24}
              onPress={() => { }}
            />
          </View>
        </View>

        {/* MIDDLE INFO */}
        <View style={styles.midInfo}>
          <Text style={styles.isoText}>ISO 400</Text>
          <Text style={styles.isoText}>1/60</Text>
          <Text style={styles.isoText}>F1.8</Text>
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

          <View style={styles.bottomDock}>
            <View style={styles.dockItem}>
              <TouchableOpacity style={styles.galleryButton}>
                <View style={styles.galleryThumb}>
                  <View style={styles.galleryInner} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.dockItem}>
              <IconButton
                icon={isRecording ? "stop-circle" : "video-outline"}
                iconColor={isRecording ? "#FF3B30" : "#FFF"}
                size={30}
                onPress={() => setIsRecording(!isRecording)}
              />
            </View>

            <View style={styles.dockItem}>
              <TouchableOpacity
                style={styles.shutterOuter}
                activeOpacity={0.7}
                onPress={() => console.log('Capture')}
              >
                <View style={styles.shutterInner} />
              </TouchableOpacity>
            </View>

            <View style={styles.dockItem}>
              <IconButton
                icon="tune-variant"
                iconColor="#FFF"
                size={30}
                onPress={() => { }}
              />
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

export default HomeScreen;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoStream: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  floatingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: 10,
  },
  headerLeft: { width: 50 },
  headerRight: { width: 50, alignItems: 'flex-end' },
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
    top: '20%',
    right: 20,
    alignItems: 'flex-end',
  },
  isoText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
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
  galleryInner: {
    flex: 1,
    borderRadius: 6,
    backgroundColor: '#333',
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
});

