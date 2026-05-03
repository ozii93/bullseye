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
   ZERO CALIBRATION HELPERS
======================================================== */

const ZC_BASE = 'http://192.168.42.1/api/v1/peripheral';

async function startZeroCalibration(distance: number): Promise<boolean> {
  const url = `${ZC_BASE}/start_zero_calibration`;
  const payload = JSON.stringify({ value: String(distance) });
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    });
    const result = await response.text();
    console.log(`✅ start_zero_calibration (distance=${distance}) status=${response.status}:`, result);
    return response.ok;
  } catch (error) {
    console.error('❌ Gagal start_zero_calibration:', error);
    return false;
  }
}

async function startCustomZeroCalibration(distance: string): Promise<boolean> {
  const url = `${ZC_BASE}/custom_zero_calibration`;
  const payload = JSON.stringify({ value: distance });
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    });
    const result = await response.text();
    console.log(`✅ custom_zero_calibration (value=${distance}) status=${response.status}:`, result);
    return response.ok;
  } catch (error) {
    console.error('❌ Gagal custom_zero_calibration:', error);
    return false;
  }
}

async function getCustomZeroCalibration(): Promise<{ distance: number; index: number }[]> {
  const url = `${ZC_BASE}/custom_zero_calibration`;
  try {
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) {
      console.warn(`⚠️ GET custom_zero_calibration returned ${response.status}`);
      return [];
    }
    const text = await response.text();
    if (!text) return [];
    const data = JSON.parse(text);
    console.log('✅ Custom zero calibration config:', data);
    return (data.value || []) as { distance: number; index: number }[];
  } catch (error) {
    console.warn('⚠️ Could not GET custom zero calibration, will use custom mode with defaults:', error);
    return [];
  }
}

async function setZeroCalibrationFreeze(on: boolean) {
  const url = `${ZC_BASE}/zero_calibration_freeze`;
  const payload = JSON.stringify({ value: on ? 'on' : 'off' });
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    });
    const result = await response.text();
    console.log(`✅ Freeze ${on ? 'ON' : 'OFF'}:`, result);
  } catch (error) {
    console.error('❌ Gagal set freeze:', error);
  }
}

async function setZeroCalibrationCoord(x: number, y: number) {
  const url = `${ZC_BASE}/zero_calibration_coord`;
  const payload = JSON.stringify({
    value: {
      x: String(x),
      y: String(y),
    },
  });

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    });
    const result = await response.text();
    console.log(`🎯 Coord set to X:${x} Y:${y}:`, result);
  } catch (error) {
    console.error('❌ Gagal set coord:', error);
  }
}

async function fetchCurrentCalibrationData() {
  try {
    // Correct URL is /api/v1/paramline, NOT under /peripheral/
    const response = await fetch('http://192.168.42.1/api/v1/paramline');
    const buffer = await response.arrayBuffer();
    const data = new Uint8Array(buffer);

    // Validate header (0xAA 0x55)
    if (data[0] === 0xAA && data[1] === 0x55) {
      const view = new DataView(buffer);
      // X: Index 133, Y: Index 135 (Little Endian 16-bit signed)
      const currentX = view.getInt16(133, true);
      const currentY = view.getInt16(135, true);
      const currentDist = view.getUint16(130, true);
      const isFrozen = data[132] !== 0;

      console.log(`📡 Hardware Paramline Sync -> X: ${currentX}, Y: ${currentY}, Dist: ${currentDist}`);
      return { x: currentX, y: currentY, distance: currentDist, isFrozen };
    }
    return null;
  } catch (e) {
    console.warn('⚠️ Could not fetch paramline:', e);
    return null;
  }
}

async function saveZeroCalibration() {
  const url = `${ZC_BASE}/save_zero_calibration`;
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}), // HttpManager.java sends an empty map {}
    });
    const result = await response.text();
    console.log('✅ Zero calibration saved:', result);
  } catch (error) {
    console.error('❌ Gagal save zero calibration:', error);
  }
}

async function zeroCalibrationZoom(value: number) {
  const url = 'http://192.168.42.1/api/v1/camera/zero_calibration_zoom';
  const payload = JSON.stringify({ value: String(value) });
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    });
    const result = await response.text();
    console.log(`✅ Zoom ${value === 1 ? 'IN' : 'OUT'}:`, result);
  } catch (error) {
    console.error('❌ Gagal zoom:', error);
  }
}

async function getZeroCalibrationCoord(): Promise<{ x: number; y: number } | null> {
  const url = `${ZC_BASE}/zero_calibration_coord`;
  try {
    const response = await fetch(url, { method: 'GET' });
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Current coordinates:', data);
      // Assuming response format is { value: { x: "0", y: "0" } }
      if (data.value) {
        return {
          x: parseInt(data.value.x) || 0,
          y: parseInt(data.value.y) || 0
        };
      }
    }
    return null;
  } catch (error) {
    console.log('⚠️ Could not fetch current coords (endpoint might not support GET):', error);
    return null;
  }
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

  // Zero Calibration state
  const [isZeroCalibrationVisible, setIsZeroCalibrationVisible] = useState(false);
  const [zeroCalDistances, setZeroCalDistances] = useState<{ distance: number; index: number }[]>([]);
  const [selectedDistance, setSelectedDistance] = useState<number | null>(null);
  const [isFrozen, setIsFrozen] = useState(false);
  const [coordX, setCoordX] = useState(0);
  const [coordY, setCoordY] = useState(0);
  const [zeroCalZoom, setZeroCalZoom] = useState(1);
  const [isLoadingDistances, setIsLoadingDistances] = useState(false);
  const [isCustomZeroCal, setIsCustomZeroCal] = useState(false);

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

  const handleOpenZeroCalibration = async () => {
    setIsZeroCalibrationVisible(true);
    setIsLoadingDistances(true);

    // Step 1: try to fetch distance list from device (GET custom_zero_calibration)
    const dists = await getCustomZeroCalibration();
    const isCustom = dists.length > 0;
    setIsCustomZeroCal(isCustom);

    if (isCustom) {
      setZeroCalDistances(dists);
      // Custom mode: value is the INDEX from device, not the distance!
      setSelectedDistance(dists[0].index);
      console.log('🔧 Mode: CUSTOM — sending index', dists[0].index, '(distance', dists[0].distance, ')');
    } else {
      setZeroCalDistances([
        { distance: 50, index: 0 }, { distance: 100, index: 1 },
        { distance: 200, index: 2 }, { distance: 300, index: 3 },
        { distance: 500, index: 4 }, { distance: 1000, index: 5 },
      ]);
      // Non-custom mode: value is the DISTANCE itself
      setSelectedDistance(100);
      console.log('🔧 Mode: STANDARD — sending distance 100');
    }

    // Sync current X/Y coordinates from device paramline
    const hwData = await fetchCurrentCalibrationData();
    if (hwData) {
      setCoordX(hwData.x);
      setCoordY(hwData.y);
      setIsFrozen(hwData.isFrozen);
    } else {
      setCoordX(0);
      setCoordY(0);
    }

    // Step 2: send command to device
    if (isCustom) {
      // Custom mode: send INDEX, not distance!
      await startCustomZeroCalibration(String(dists[0].index));
    } else {
      // GET failed — try CUSTOM first, then STANDARD
      const customOk = await startCustomZeroCalibration('0');
      if (customOk) {
        setIsCustomZeroCal(true);
        setSelectedDistance(0);
        console.log('🔧 Device supports CUSTOM mode');
      } else {
        console.log('🔧 CUSTOM failed — trying STANDARD...');
        const standardOk = await startZeroCalibration(100);
        if (standardOk) {
          setIsCustomZeroCal(false);
          setSelectedDistance(100);
          console.log('🔧 Device supports STANDARD mode');
        } else {
          console.error('❌ Both endpoints failed!');
        }
      }
    }

    setIsLoadingDistances(false);
  };

  const handleCloseZeroCalibration = async () => {
    if (isCustomZeroCal) { await startCustomZeroCalibration('off'); }
    else { await startZeroCalibration(0); }
    await setZeroCalibrationFreeze(false);
    setIsZeroCalibrationVisible(false);
    setIsFrozen(false);
  };

  const handleZeroCalDistanceSelect = async (dist: number, index: number) => {
    if (isCustomZeroCal) {
      setSelectedDistance(index);
      await startCustomZeroCalibration(String(index));
    } else {
      setSelectedDistance(dist);
      await startZeroCalibration(dist);
    }
    // Wait a moment then re-fetch — device needs time to update after distance change
    await new Promise(r => setTimeout(r, 300));
    const hwData = await fetchCurrentCalibrationData();
    if (hwData) {
      setCoordX(hwData.x);
      setCoordY(hwData.y);
      setIsFrozen(hwData.isFrozen);
    }
  };

  const handleFreezeToggle = async () => {
    const newState = !isFrozen;
    setIsFrozen(newState);
    await setZeroCalibrationFreeze(newState);
  };

  const handleCoordAdjust = async (dx: number, dy: number) => {
    // Standard ZG38 logic: Y axis is often reversed in hardware calibration
    const IS_Y_REVERSED = true;
    const actualDy = IS_Y_REVERSED ? -dy : dy;

    const newX = coordX + dx;
    const newY = coordY + actualDy;
    setCoordX(newX);
    setCoordY(newY);
    await setZeroCalibrationCoord(newX, newY);
  };

  const handleZeroCalZoom = async (direction: number) => {
    const newZoom = direction === 1 ? zeroCalZoom + 1 : Math.max(1, zeroCalZoom - 1);
    setZeroCalZoom(newZoom);
    await zeroCalibrationZoom(direction);
  };

  const handleSaveZeroCalibration = async () => {
    await saveZeroCalibration();
    // After saving, explicitly exit calibration mode to close device OSD
    if (isCustomZeroCal) {
      await startCustomZeroCalibration('off');
    } else {
      await startZeroCalibration(0);
    }
    setIsZeroCalibrationVisible(false);
    setIsFrozen(false);
    Alert.alert('Sukses', 'Zero calibration berhasil disimpan');
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

          {isZeroCalibrationVisible && (
            <View style={styles.zeroCalWrapper}>
              <View style={styles.zeroCalHeader}>
                <Text style={styles.zeroCalTitle}>Zero Calibration</Text>
                <TouchableOpacity onPress={handleCloseZeroCalibration} style={styles.zeroCalBackBtn}>
                  <Text style={styles.zeroCalBackText}>✕</Text>
                </TouchableOpacity>
              </View>

              {isLoadingDistances ? (
                <Text style={styles.zeroCalLabel}>Loading distances...</Text>
              ) : (
                <>
                  {/* DISTANCE SELECTOR */}
                  <Text style={styles.zeroCalLabel}>Distance (M)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.typeRow}>
                      {zeroCalDistances.map((item) => {
                        const isActive = isCustomZeroCal
                          ? selectedDistance === item.index
                          : selectedDistance === item.distance;
                        return (
                        <TouchableOpacity
                          key={item.index}
                          style={[
                            styles.typePill,
                            isActive && styles.activeTypePill,
                          ]}
                          onPress={() => handleZeroCalDistanceSelect(item.distance, item.index)}
                        >
                          <Text
                            style={[
                              styles.typeText,
                              isActive && styles.activeTypeText,
                            ]}
                          >
                            {item.distance}
                          </Text>
                        </TouchableOpacity>
                      )})}
                    </View>
                  </ScrollView>

                  {/* ZOOM */}
                  <Text style={styles.zeroCalLabel}>Zoom: {zeroCalZoom}x</Text>
                  <View style={styles.zoomRow}>
                    <TouchableOpacity
                      style={styles.zoomBtn}
                      onPress={() => handleZeroCalZoom(0)}
                    >
                      <Text style={styles.zoomBtnText}>−</Text>
                    </TouchableOpacity>
                    <View style={styles.zoomValue}>
                      <Text style={styles.zoomValueText}>{zeroCalZoom}x</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.zoomBtn}
                      onPress={() => handleZeroCalZoom(1)}
                    >
                      <Text style={styles.zoomBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  {/* FREEZE */}
                  <Text style={styles.zeroCalLabel}>Freeze</Text>
                  <View style={styles.typeRow}>
                    <TouchableOpacity
                      style={[styles.typePill, !isFrozen && styles.activeTypePill]}
                      onPress={() => isFrozen && handleFreezeToggle()}
                    >
                      <Text style={[styles.typeText, !isFrozen && styles.activeTypeText]}>Live</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.typePill, isFrozen && { backgroundColor: '#FF3B30', borderColor: '#FF3B30' }]}
                      onPress={() => !isFrozen && handleFreezeToggle()}
                    >
                      <Text style={[styles.typeText, isFrozen && styles.activeTypeText]}>Frozen</Text>
                    </TouchableOpacity>
                  </View>

                  {/* COORDINATE D-PAD */}
                  <Text style={styles.zeroCalLabel}>
                    Coordinate: X={coordX} Y={coordY}
                  </Text>
                  <View style={styles.dpadContainer}>
                    <View style={styles.dpadRow}>
                      <TouchableOpacity
                        style={styles.dpadBtn}
                        onPress={() => handleCoordAdjust(0, -1)}
                      >
                        <Text style={styles.dpadBtnText}>▲</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.dpadRow}>
                      <TouchableOpacity
                        style={styles.dpadBtn}
                        onPress={() => handleCoordAdjust(-1, 0)}
                      >
                        <Text style={styles.dpadBtnText}>◀</Text>
                      </TouchableOpacity>
                      <View style={styles.dpadCenter}>
                        <Text style={styles.dpadCenterText}>●</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.dpadBtn}
                        onPress={() => handleCoordAdjust(1, 0)}
                      >
                        <Text style={styles.dpadBtnText}>▶</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.dpadRow}>
                      <TouchableOpacity
                        style={styles.dpadBtn}
                        onPress={() => handleCoordAdjust(0, 1)}
                      >
                        <Text style={styles.dpadBtnText}>▼</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* ACTIONS */}
                  <View style={styles.zeroCalActionContainer}>
                    <TouchableOpacity style={styles.zeroCalCancelBtn} onPress={handleCloseZeroCalibration}>
                      <Text style={styles.zeroCalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.zeroCalConfirmBtn} onPress={handleSaveZeroCalibration}>
                      <Text style={styles.zeroCalConfirmText}>Confirm</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
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
              <IconButton
                icon="target"
                iconColor={isZeroCalibrationVisible ? '#FF9800' : '#FFF'}
                size={30}
                onPress={() => {
                  if (isZeroCalibrationVisible) {
                    handleCloseZeroCalibration();
                  } else {
                    handleOpenZeroCalibration();
                  }
                }}
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
  zeroCalWrapper: {
    width: '94%',
    backgroundColor: 'rgba(20,20,20,0.92)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,152,0,0.15)',
  },
  zeroCalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  zeroCalTitle: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  zeroCalBackBtn: {
    padding: 4,
  },
  zeroCalBackText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 18,
    fontWeight: 'bold',
  },
  zeroCalLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 8,
  },
  zoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  zoomBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  zoomBtnText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  zoomValue: {
    paddingHorizontal: 24,
  },
  zoomValueText: {
    color: '#FF9800',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dpadContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  dpadRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dpadBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  dpadBtnText: {
    color: '#FFF',
    fontSize: 20,
  },
  dpadCenter: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },
  dpadCenterText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
  },
  zeroCalSaveBtn: {
    backgroundColor: 'rgba(255,152,0,0.15)',
    borderWidth: 1,
    borderColor: '#FF9800',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  zeroCalSaveText: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  zeroCalActionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },
  zeroCalCancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  zeroCalCancelText: {
    color: '#AAA',
    fontSize: 16,
    fontWeight: 'bold',
  },
  zeroCalConfirmBtn: {
    flex: 1,
    backgroundColor: '#FF9800',
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zeroCalConfirmText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
