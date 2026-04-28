import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Text,
  StatusBar,
  Alert,
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

const HomeScreen = () => {
  const [isPaletteVisible, setIsPaletteVisible] = useState(false);
  const [activePalette, setActivePalette] = useState(0);
  const [playerKey, setPlayerKey] = useState(1);

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

      {/* 1. RTSP VIDEO LAYER (FULL SCREEN BACKGROUND) */}
      <VLCPlayer
        key={playerKey}
        style={styles.videoStream}
        videoAspectRatio="16:9" // Bisa diubah ke "4:3" kalau gambarnya kelihatan gepeng
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
            // '--no-video-title-show',
          ]
        }}
        // source={{
        //   uri: 'rtsp://192.168.42.1:8554/video',
        //   initOptions: [
        //     '--rtsp-frame-buffer-size=100000',
        //     '--network-caching=50',
        //     '--live-caching=50',
        //     '--drop-late-frames',
        //     '--skip-frames'
        //   ],
        // }}
        autoplay
        onPlaying={() => console.log('🔥 RTSP STREAM CONNECTED & PLAYING!')}
        onError={(error) => {
          console.log('❌ RTSP STREAM ERROR:', error)
          setTimeout(() => {
            setPlayerKey(v => v + 1);
          }, 1500);
        }}
        onBuffering={(event) => {
          console.log('⏳ RTSP STREAM BUFFERING...', event)
        }}
      />

      <SafeAreaView
        style={styles.overlayContainer}
        edges={['top', 'bottom']}
      >
        {/* HEADER */}
        <View style={styles.floatingHeader}>
          <IconButton
            icon="home-outline"
            iconColor="#FFF"
            size={24}
            onPress={() => { }}
          />

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>● LIVE</Text>
          </View>

          <IconButton
            icon="cog-outline"
            iconColor="#FFF"
            size={24}
            onPress={() => { }}
          />
        </View>

        {/* BOTTOM */}
        <View style={styles.bottomSection}>
          {/* PALETTE SELECTOR */}
          {isPaletteVisible && (
            <View style={styles.paletteContainer}>
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
                      activeOpacity={0.8}
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

          {/* BOTTOM DOCK */}
          <View style={styles.bottomDock}>
            <TouchableOpacity style={styles.galleryButton}>
              <View style={styles.galleryPlaceholder} />
            </TouchableOpacity>

            <IconButton
              icon="video-outline"
              iconColor="#A0A0A5"
              size={28}
              onPress={() => { }}
            />

            <TouchableOpacity
              style={styles.shutterRing}
              onPress={() => console.log('Capture')}
            >
              <View style={styles.shutterCenter} />
            </TouchableOpacity>

            <IconButton
              icon="tune-vertical"
              iconColor="#A0A0A5"
              size={28}
              onPress={() => { }}
            />

            <IconButton
              icon="palette-swatch-outline"
              iconColor={
                isPaletteVisible ? '#00E5FF' : '#A0A0A5'
              }
              size={28}
              onPress={() =>
                setIsPaletteVisible(!isPaletteVisible)
              }
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default HomeScreen;

/* =========================================================
   STYLE
========================================================= */

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#000',
  },

  overlayContainer: {
    flex: 1,
    zIndex: 1,
    elevation: 1,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },

  /* HEADER */
  floatingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 15,
    marginTop: 10,
    backgroundColor: 'rgba(28,28,30,0.6)',
    borderRadius: 30,
    paddingHorizontal: 5,
  },

  statusBadge: {
    backgroundColor: 'rgba(255,59,48,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.5)',
  },

  statusText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  /* BOTTOM */
  bottomSection: {
    alignItems: 'center',
  },

  paletteContainer: {
    width: '100%',
    marginBottom: 18,
  },

  paletteScroll: {
    paddingHorizontal: 14,
  },

  /* BIGGER CLICK AREA */
  palettePill: {
    minWidth: 130,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: 'rgba(28,28,30,0.88)',
    paddingHorizontal: 18,
    marginRight: 12,
    borderRadius: 18,

    borderWidth: 1,
    borderColor: 'transparent',
  },

  activePalettePill: {
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0,229,255,0.12)',
  },

  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 10,
  },

  paletteText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },

  activePaletteText: {
    color: '#00E5FF',
    fontWeight: '700',
  },

  /* BOTTOM DOCK */
  bottomDock: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',

    width: '92%',
    backgroundColor: 'rgba(18,18,18,0.75)',

    borderRadius: 40,
    paddingVertical: 10,
    paddingHorizontal: 5,
  },

  galleryButton: {
    padding: 8,
  },

  galleryPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#3A3A3C',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },

  shutterRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 3,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  shutterCenter: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFF',
  },

  videoStream: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});