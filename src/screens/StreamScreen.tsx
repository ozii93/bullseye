import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Text,
  StatusBar,
  DeviceEventEmitter,
  Image,
  ImageBackground,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import StreamPlayer, { GuideStreamViewRef } from '../components/StreamPlayer';
import RNFS from 'react-native-fs';
import { PALETTES as PalettesConstant } from '../core/constant';
import { createThumbnail } from 'react-native-create-thumbnail';
import Slider from '@react-native-community/slider';
import { useNotification } from '../provider/NotificationContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const RETICLE_TYPES = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, label: `Type ${i + 1}` }));

const RETICLE_COLORS = [
  { id: 0, name: 'Black', color: '#000000' },
  { id: 1, name: 'White', color: '#FFFFFF' },
  { id: 2, name: 'Green', color: '#00FF00' },
  { id: 3, name: 'Red', color: '#FF0000' },
  { id: 4, name: 'Cyan', color: '#00FFFF' },
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
  const colorNames = ['black', 'white', 'green', 'red','cyan'];
  const colorName = colorNames[index] || 'green';
  await sendReticleCommand('dashcolor', colorName);
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
    const response = await fetch('http://192.168.42.1/api/v1/paramline');
    const buffer = await response.arrayBuffer();
    const data = new Uint8Array(buffer);

    if (data[0] === 0xAA && data[1] === 0x55) {
      const view = new DataView(buffer);
      const currentX = view.getInt16(133, true);
      const currentY = view.getInt16(135, true);
      const currentDist = view.getUint16(130, true);
      const isFrozen = data[132] !== 0;
      // Bytes 16-17: luminance, 18-19: contrast (divided by 10)
      const luminance = view.getUint16(16, true);
      const contrast = view.getUint16(18, true);
      // Bytes 12-13: enhancement
      const enhancement = view.getUint16(12, true);

      console.log(`📡 Paramline — X:${currentX} Y:${currentY} Dist:${currentDist} Lum:${luminance} Con:${contrast} Enh:${enhancement}`);
      return {
        x: currentX, y: currentY, distance: currentDist, isFrozen,
        luminance, contrast, enhancement,
      };
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
   SCENE MODE / LASER / AI TRACKING HELPERS
======================================================== */

const CommandScene = [0x02, 0x03, 0x07];
const CommandAITrack = [0x02, 0x00, 0x0a];
const CommandLuminanc = [0x02, 0x03, 0x09];
const CommandContras = [0x02, 0x03, 0x0a];
const CommandEnhancement = [0x02, 0x03, 0x0b];

async function sendScene(mode: number) {
  const payload = structSerialPortParam(CommandScene, mode);
  const packet = buildPacket(payload);
  await sendBinary(packet);
}

async function sendLaserRanging(mode: number) {
  const url = 'http://192.168.42.1/api/v1/peripheral/rangingtype';
  const payload = JSON.stringify({ value: String(mode) });
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    });
    const result = await response.text();
    console.log(`✅ Laser ranging set to ${mode}:`, result);
  } catch (error) {
    console.error('❌ Gagal laser ranging:', error);
  }
}

async function sendAITracking(on: boolean) {
  const url = 'http://192.168.42.1/api/v1/camera/ai_tracking';
  const payload = JSON.stringify({ value: on ? 'on' : 'off' });
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    });
    const result = await response.text();
    console.log(`✅ AI Tracking ${on ? 'ON' : 'OFF'}:`, result);
  } catch (error) {
    console.error('❌ Gagal AI tracking:', error);
  }
}

async function sendLuminanc(value: number) {
  const payload = structSerialPortParam(CommandLuminanc, value);
  const packet = buildPacket(payload);
  await sendBinary(packet);
}

async function sendContras(value: number) {
  const payload = structSerialPortParam(CommandContras, value);
  const packet = buildPacket(payload);
  await sendBinary(packet);
}

async function sendEnhancement(value: number) {
  const payload = structSerialPortParam(CommandEnhancement, value);
  const packet = buildPacket(payload);
  await sendBinary(packet);
}

/* =========================================================
   DEVICE SETTINGS API HELPERS
======================================================== */

const DS_BASE = 'http://192.168.42.1/api/v1';

async function dsGet(endpoint: string): Promise<any> {
  const url = `${DS_BASE}${endpoint}`;
  try {
    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json', 'Accept-Encoding': 'gzip' } });
    if (response.ok) {
      const text = await response.text();
      if (text) return JSON.parse(text);
    }
  } catch (e) {
    console.warn(`⚠️ DS GET ${endpoint}:`, e);
  }
  return null;
}

async function dsPut(endpoint: string, value: string): Promise<boolean> {
  const url = `${DS_BASE}${endpoint}`;
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Accept-Encoding': 'gzip' },
      body: JSON.stringify({ value }),
    });
    console.log(`✅ DS PUT ${endpoint} = ${value} (${response.status})`);
    return response.ok;
  } catch (e) {
    console.error(`❌ DS PUT ${endpoint}:`, e);
    return false;
  }
}

async function fetchCompensationMode(): Promise<string> {
  const data = await dsGet('/camera/compensation');
  return data?.value || 'auto';
}

async function setCompensationMode(mode: string): Promise<boolean> {
  return dsPut('/camera/compensation', mode);
}

async function fetchSmartSleep(): Promise<string> {
  const data = await dsGet('/misc/intelligent_sleep');
  return data?.value || 'off';
}

async function setSmartSleep(value: string): Promise<boolean> {
  return dsPut('/misc/intelligent_sleep', value);
}

async function fetchSleepShutdown(): Promise<{ sleep: string; shutdown: string }> {
  const data = await dsGet('/misc/sleepshutdown');
  return {
    sleep: data?.sleep || 'off',
    shutdown: data?.shutdown || 'off',
  };
}

async function setSleepShutdown(sleep: string, shutdown: string): Promise<boolean> {
  const url = `${DS_BASE}/misc/sleepshutdown`;
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sleep, shutdown }),
    });
    console.log(`✅ DS PUT /misc/sleepshutdown sleep=${sleep} shutdown=${shutdown} (${response.status})`);
    return response.ok;
  } catch (e) {
    console.error('❌ DS PUT sleepshutdown:', e);
    return false;
  }
}

async function fetchTimedShutdownMenu(): Promise<string> {
  const data = await dsGet('/misc/auto_close_menu');
  return data?.value || 'off';
}

async function setTimedShutdownMenu(value: string): Promise<boolean> {
  return dsPut('/misc/auto_close_menu', value);
}

async function syncTimeToDevice(): Promise<boolean> {
  const timestamp = Math.floor(Date.now() / 1000);
  return dsPut('/misc/time', String(timestamp));
}

async function fetchLimitedTimeRecording(): Promise<string> {
  const data = await dsGet('/peripheral/limit_record');
  return data?.value || 'off';
}

async function setLimitedTimeRecording(value: string): Promise<boolean> {
  return dsPut('/peripheral/limit_record', value);
}

async function fetchAudioStatus(): Promise<string> {
  const data = await dsGet('/peripheral/audio_status');
  return data?.value || 'off';
}

async function setAudioStatus(value: string): Promise<boolean> {
  return dsPut('/peripheral/audio_status', value);
}

async function loadAllDeviceSettings(): Promise<{
  compensation: string;
  smartSleep: string;
  sleepVal: string;
  shutdown: string;
  shutdownMenu: string;
  limitedRecord: string;
  audio: string;
}> {
  const [comp, ss, ssData, menu, lr, audio] = await Promise.all([
    fetchCompensationMode(),
    fetchSmartSleep(),
    fetchSleepShutdown(),
    fetchTimedShutdownMenu(),
    fetchLimitedTimeRecording(),
    fetchAudioStatus(),
  ]);
  return {
    compensation: comp,
    smartSleep: ss,
    sleepVal: ssData.sleep,
    shutdown: ssData.shutdown,
    shutdownMenu: menu,
    limitedRecord: lr,
    audio,
  };
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

const StreamScreen = ({ navigation }: any) => {
  const isFocused = useIsFocused();
  const { showSnackbar } = useNotification();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isWideScreen = windowWidth > windowHeight || windowWidth >= 840;
  const horizontalChrome = isWideScreen ? 168 : 0;
  const streamSize = Math.min(
    isWideScreen ? windowHeight * 0.86 : windowWidth * 1.08,
    windowWidth - horizontalChrome,
    isWideScreen ? 620 : windowHeight * 0.58,
  );
  const deviceSettingsPanelStyle = {
    width: isWideScreen ? Math.min(330, windowWidth * 0.34) : windowWidth * 0.94,
    height: isWideScreen ? windowHeight * 0.82 : windowHeight * 0.44,
    maxHeight: isWideScreen ? windowHeight * 0.82 : windowHeight * 0.44,
  };
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

  // Scene Mode state
  const [sceneMode, setSceneMode] = useState(0);

  // Laser Ranging state
  const [laserRangingMode, setLaserRangingMode] = useState(0);
  const [isLaserActive, setIsLaserActive] = useState(false);

  // AI Tracking state
  const [isAITrackingActive, setIsAITrackingActive] = useState(false);

  // Toolkit panel state
  const [isToolkitVisible, setIsToolkitVisible] = useState(false);

  // Image Adjustment state
  const [brightness, setBrightness] = useState(3);
  const [contrast, setContrast] = useState(3);
  const [isEnhancementOn, setIsEnhancementOn] = useState(false);

  // Image Adjustment panel
  const [isImageAdjustVisible, setIsImageAdjustVisible] = useState(false);

  // Device Settings state
  const [isDeviceSettingsVisible, setIsDeviceSettingsVisible] = useState(false);
  const [dsCompensation, setDsCompensation] = useState('auto');
  const [dsSmartSleep, setDsSmartSleep] = useState('off');
  const [dsAutoSleepVal, setDsAutoSleepVal] = useState('off');
  const [dsTimedShutdown, setDsTimedShutdown] = useState('off');
  const [dsShutdownMenu, setDsShutdownMenu] = useState('off');
  const [dsTimeCorrection, setDsTimeCorrection] = useState(false);
  const [dsLimitedRecord, setDsLimitedRecord] = useState('off');
  const [dsAudio, setDsAudio] = useState('off');
  const [dsLoading, setDsLoading] = useState(false);

  useEffect(() => {
    console.log('📂 STORAGE PATH:', RNFS.DocumentDirectoryPath);
    const loadLatestThumbnail = async () => {
      try {
        const bullsEyePath = `${RNFS.ExternalDirectoryPath}/DCIM/BullsEye`;

        const docFiles = await RNFS.readDir(RNFS.DocumentDirectoryPath).catch(() => []);
        const cacheFiles = await RNFS.readDir(RNFS.CachesDirectoryPath).catch(() => []);
        const externalFiles = await RNFS.readDir(bullsEyePath).catch(() => []);

        const files = [...docFiles, ...cacheFiles, ...externalFiles];

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
    if (isFocused) {
      setPlayerKey(prev => prev + 1);
      setRenderPlayer(true);
    } else {
      setRenderPlayer(false);
    }
  }, [isFocused]);

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

  const SCENE_MODES = [
    { value: 0, label: 'Natural' },
    { value: 5, label: 'Enhanced' },
    { value: 6, label: 'Highlight' },
  ];

  const handleCapture = async () => {
    try {
      console.log('📸 Taking Tactical Snapshot...');
      const filename = `BullsEye_${Date.now()}.png`;
      const dirPath = `${RNFS.ExternalDirectoryPath}/DCIM/BullsEye`;
      await RNFS.mkdir(dirPath);
      const localPath = `${dirPath}/${filename}`;

      // 1. Trigger native snapshot (fire-and-forget, native writes to path)
      guideRef.current?.snapShot(localPath);

      // 2. Wait for native to finish writing + update thumbnail
      await new Promise<void>(resolve => setTimeout(resolve, 1000));

      // 3. Update UI with cache-busting URI to force Image reload
      const displayUri = `file://${localPath}?t=${Date.now()}`;
      setLastMedia(displayUri);
      console.log('✅ Snapshot Secure:', localPath);
      showSnackbar('Foto berhasil disimpan');
    } catch (e: any) {
      console.log('❌ Capture Error:', e);
      showSnackbar('Gagal mengeksekusi pengambilan foto.');
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
        const dirPath = `${RNFS.ExternalDirectoryPath}/DCIM/BullsEye`;
        await RNFS.mkdir(dirPath);
        const savePath = `${dirPath}/${filename}`;
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
    showSnackbar('Video berhasil disimpan');
  };

  const handleOpenZeroCalibration = async () => {
    setIsZeroCalibrationVisible(true);
    setIsLoadingDistances(true);

    setIsReticleToolsVisible(false);
    setIsPaletteVisible(false);
    setIsDeviceSettingsVisible(false);
    setShowReticle(false);

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

    // Step 3: re-fetch coordinates AFTER device enters zero cal mode
    await new Promise<void>(r => setTimeout(r, 300));
    const updatedHwData = await fetchCurrentCalibrationData();
    if (updatedHwData) {
      setCoordX(updatedHwData.x);
      setCoordY(updatedHwData.y);
      setIsFrozen(updatedHwData.isFrozen);
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
    await new Promise<void>(resolve => setTimeout(() => resolve(), 300));
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
    showSnackbar('Zero calibration berhasil disimpan');
  };

  const renderDeviceSettingsPanel = () => (
    <View style={[styles.deviceSettingsOverlay, deviceSettingsPanelStyle]}>
      <View style={styles.deviceSettingsHeader}>
        <Text style={styles.deviceSettingsTitle}>DEVICE SETTINGS</Text>
        <IconButton
          icon="close"
          iconColor="rgba(255,255,255,0.62)"
          size={20}
          onPress={() => setIsDeviceSettingsVisible(false)}
          style={styles.panelCloseButton}
        />
      </View>

      {dsLoading ? (
        <Text style={styles.dsLoadingText}>Loading settings...</Text>
      ) : (
        <ScrollView
          style={styles.deviceSettingsScroll}
          contentContainerStyle={styles.deviceSettingsContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.dsSectionTitle}>GENERAL SETTINGS</Text>

          <Text style={styles.dsLabel}>Compensation Mode</Text>
          <View style={styles.dsOptionRow}>
            {['auto', 'manual'].map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.typePill, dsCompensation === mode && styles.activeTypePill]}
                onPress={async () => {
                  setDsCompensation(mode);
                  await setCompensationMode(mode);
                }}
              >
                <Text style={[styles.typeText, dsCompensation === mode && styles.activeTypeText]}>
                  {mode === 'auto' ? 'Auto' : 'Manual'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.dsLabel}>Smart Sleep</Text>
          <View style={styles.dsOptionRow}>
            {[
              { value: 'off', label: 'OFF' },
              { value: 'on', label: 'ON' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.typePill, dsSmartSleep === opt.value && styles.activeTypePill]}
                onPress={async () => {
                  setDsSmartSleep(opt.value);
                  await setSmartSleep(opt.value);
                }}
              >
                <Text style={[styles.typeText, dsSmartSleep === opt.value && styles.activeTypeText]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.dsLabel}>Timed Shutdown</Text>
          <View style={styles.dsOptionRow}>
            {[
              { value: 'off', label: 'OFF' },
              { value: '15', label: '15min' },
              { value: '30', label: '30min' },
              { value: '60', label: '60min' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.typePill, dsTimedShutdown === opt.value && styles.activeTypePill]}
                onPress={async () => {
                  setDsTimedShutdown(opt.value);
                  await setSleepShutdown(dsAutoSleepVal, opt.value);
                }}
              >
                <Text style={[styles.typeText, dsTimedShutdown === opt.value && styles.activeTypeText]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.dsLabel}>Time Shutdown Menu</Text>
          <View style={styles.dsOptionRow}>
            {[
              { value: 'off', label: 'OFF' },
              { value: '10', label: '10s' },
              { value: '20', label: '20s' },
              { value: '60', label: '60s' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.typePill, dsShutdownMenu === opt.value && styles.activeTypePill]}
                onPress={async () => {
                  setDsShutdownMenu(opt.value);
                  await setTimedShutdownMenu(opt.value);
                }}
              >
                <Text style={[styles.typeText, dsShutdownMenu === opt.value && styles.activeTypeText]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.dsLabel}>Time Correction</Text>
          <View style={styles.dsOptionRow}>
            {[
              { value: false, label: 'OFF' },
              { value: true, label: 'SYNC NOW' },
            ].map((opt) => (
              <TouchableOpacity
                key={String(opt.value)}
                style={[styles.typePill, dsTimeCorrection === opt.value && styles.activeTypePill]}
                onPress={async () => {
                  if (opt.value) {
                    setDsTimeCorrection(true);
                    await syncTimeToDevice();
                    setTimeout(() => setDsTimeCorrection(false), 1500);
                  } else {
                    setDsTimeCorrection(false);
                  }
                }}
              >
                <Text style={[styles.typeText, dsTimeCorrection === opt.value && styles.activeTypeText]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.dsDivider} />

          <Text style={styles.dsSectionTitle}>RECORDING SETTINGS</Text>

          <Text style={styles.dsLabel}>Limited Time Recording</Text>
          <View style={styles.dsOptionRow}>
            {[
              { value: 'off', label: 'OFF' },
              { value: '15', label: '15s' },
              { value: '30', label: '30s' },
              { value: '60', label: '60s' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.typePill, dsLimitedRecord === opt.value && styles.activeTypePill]}
                onPress={async () => {
                  setDsLimitedRecord(opt.value);
                  await setLimitedTimeRecording(opt.value);
                }}
              >
                <Text style={[styles.typeText, dsLimitedRecord === opt.value && styles.activeTypeText]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.dsLabel}>Audio</Text>
          <View style={styles.dsOptionRow}>
            {[
              { value: 'off', label: 'OFF' },
              { value: 'on', label: 'ON' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.typePill, dsAudio === opt.value && styles.activeTypePill]}
                onPress={async () => {
                  setDsAudio(opt.value);
                  await setAudioStatus(opt.value);
                }}
              >
                <Text style={[styles.typeText, dsAudio === opt.value && styles.activeTypeText]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {renderPlayer && (
        <StreamPlayer
          ref={guideRef}
          key={playerKey}
          style={[
            styles.videoStream,
            {
              width: streamSize,
              height: streamSize,
              top: isWideScreen
                ? Math.max(12, (windowHeight - streamSize) / 2)
                : Math.max(118, windowHeight * 0.18),
            },
          ]}
          rtspType={1}
          onRecordComplete={handleRecordComplete}
        />
      )}


      {/* Reticle Overlay removed as it is now handled by hardware */}


      <SafeAreaView
        style={[styles.overlayContainer, isWideScreen && styles.overlayContainerWide]}
        edges={['top', 'bottom', 'left', 'right']}
      >
        {/* HEADER */}
        <View style={[styles.floatingHeader, isWideScreen && styles.floatingHeaderWide]}>
          <View style={[styles.headerLeft, isWideScreen && styles.headerRailGroup]}>
            <IconButton
              icon="chevron-left"
              iconColor="#FFF"
              size={28}
              onPress={() => {
                navigation.push('Main')
              }}
              rippleColor="rgba(255, 255, 255, 0.2)"
            />
            <IconButton
              icon="toolbox-outline"
              iconColor={isToolkitVisible ? '#FF9800' : '#FFF'}
              size={22}
              onPress={() => {
                setIsDeviceSettingsVisible(false);
                setIsToolkitVisible(!isToolkitVisible);
              }}
              style={{ marginRight: 8 }}
            />
          </View>

          <View style={[styles.headerCenter, isWideScreen && styles.headerCenterWide]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {isRecording && (
                <View style={[styles.statusBadge, { backgroundColor: 'rgba(255, 59, 48, 0.2)' }]}>
                  <View style={[styles.liveDot, { backgroundColor: '#FF3B30' }]} />
                  <Text style={[styles.statusText, { color: '#FF3B30' }]}>
                    REC
                  </Text>
                </View>
              )}
            </View>

            {isRecording && (
              <Text style={styles.timerText}>{formatTime(recordingTime)}</Text>
            )}
          </View>

          <View style={[styles.headerRight, isWideScreen && styles.headerRailGroup]}>
            <IconButton
              icon="crosshairs"
              iconColor={showReticle ? '#00E5FF' : '#FFF'}
              size={24}
              onPress={async () => {
                const newState = !showReticle;
                setShowReticle(newState);
                if (newState) {
                  setIsPaletteVisible(false);
                  setIsZeroCalibrationVisible(false);
                  setIsDeviceSettingsVisible(false);

                  setIsReticleToolsVisible(true);
                  // Enable reticle on hardware with current type
                  await setHardwareReticleType(reticleType);
                  await setHardwareReticleBrightness(reticleBrightness);
                  await setHardwareReticleColor(RETICLE_COLORS[reticleColor].id);
                } else {
                  setIsReticleToolsVisible(false);
                  // Disable reticle on hardware by setting type to 0
                  await setHardwareReticleType(0);
                }
              }}
            />
            <IconButton
              icon="target"
              iconColor={isZeroCalibrationVisible ? '#FF9800' : '#FFF'}
              size={24}
              onPress={() => {
                if (isZeroCalibrationVisible) {
                  handleCloseZeroCalibration();
                } else {
                  handleOpenZeroCalibration();
                }
              }}
            />
            <IconButton
              icon="cog"
              iconColor={isDeviceSettingsVisible ? '#00E5FF' : '#FFF'}
              size={24}
              onPress={async () => {
                const opening = !isDeviceSettingsVisible;
                setIsDeviceSettingsVisible(opening);
                if (opening) {
                  // Close other panels
                  setIsReticleToolsVisible(false);
                  setIsZeroCalibrationVisible(false);
                  setIsPaletteVisible(false);
                  setIsImageAdjustVisible(false);
                  setIsToolkitVisible(false);
                  setShowReticle(false);
                  // Load current device settings
                  setDsLoading(true);
                  try {
                    const settings = await loadAllDeviceSettings();
                    console.log(settings)
                    setDsCompensation(settings.compensation);
                    setDsSmartSleep(settings.smartSleep);
                    setDsAutoSleepVal(settings.sleepVal);
                    setDsTimedShutdown(settings.shutdown);
                    setDsShutdownMenu(settings.shutdownMenu);
                    setDsLimitedRecord(settings.limitedRecord);
                    setDsAudio(settings.audio);
                  } finally {
                    setDsLoading(false);
                  }
                }
              }}
            />
          </View>
        </View>

        {/* DEVICE SETTINGS PANEL */}
        {false && isDeviceSettingsVisible && (
          <View style={styles.deviceSettingsOverlay}>
            <ScrollView
              style={styles.deviceSettingsScroll}
              contentContainerStyle={styles.deviceSettingsContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.deviceSettingsHeader}>
                <Text style={styles.deviceSettingsTitle}>DEVICE SETTINGS</Text>
                <TouchableOpacity
                  onPress={() => setIsDeviceSettingsVisible(false)}
                  style={styles.zeroCalBackBtn}
                >
                  <Text style={styles.zeroCalBackText}>✕</Text>
                </TouchableOpacity>
              </View>

              {dsLoading ? (
                <Text style={styles.dsLoadingText}>Loading settings...</Text>
              ) : (
                <>
                  {/* GENERAL SETTINGS */}
                  <Text style={styles.dsSectionTitle}>GENERAL SETTINGS</Text>

                  {/* Compensation Mode */}
                  <Text style={styles.dsLabel}>Compensation Mode</Text>
                  <View style={styles.typeRow}>
                    {['auto', 'manual'].map((mode) => (
                      <TouchableOpacity
                        key={mode}
                        style={[styles.typePill, dsCompensation === mode && styles.activeTypePill]}
                        onPress={async () => {
                          setDsCompensation(mode);
                          await setCompensationMode(mode);
                        }}
                      >
                        <Text style={[styles.typeText, dsCompensation === mode && styles.activeTypeText]}>
                          {mode === 'auto' ? 'Auto' : 'Manual'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Smart Sleep */}
                  <Text style={styles.dsLabel}>Smart Sleep</Text>
                  <View style={styles.typeRow}>
                    {[
                      { value: 'off', label: 'OFF' },
                      { value: 'on', label: 'ON' },
                    ].map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.typePill, dsSmartSleep === opt.value && styles.activeTypePill]}
                        onPress={async () => {
                          setDsSmartSleep(opt.value);
                          await setSmartSleep(opt.value);
                        }}
                      >
                        <Text style={[styles.typeText, dsSmartSleep === opt.value && styles.activeTypeText]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Timed Shutdown */}
                  <Text style={styles.dsLabel}>Timed Shutdown</Text>
                  <View style={styles.typeRow}>
                    {[
                      { value: 'off', label: 'OFF' },
                      { value: '15', label: '15min' },
                      { value: '30', label: '30min' },
                      { value: '60', label: '60min' },
                    ].map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.typePill, dsTimedShutdown === opt.value && styles.activeTypePill]}
                        onPress={async () => {
                          setDsTimedShutdown(opt.value);
                          await setSleepShutdown(dsAutoSleepVal, opt.value);
                        }}
                      >
                        <Text style={[styles.typeText, dsTimedShutdown === opt.value && styles.activeTypeText]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Time Shutdown Menu */}
                  <Text style={styles.dsLabel}>Time Shutdown Menu</Text>
                  <View style={styles.typeRow}>
                    {[
                      { value: 'off', label: 'OFF' },
                      { value: '10', label: '10s' },
                      { value: '20', label: '20s' },
                      { value: '60', label: '60s' },
                    ].map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.typePill, dsShutdownMenu === opt.value && styles.activeTypePill]}
                        onPress={async () => {
                          setDsShutdownMenu(opt.value);
                          await setTimedShutdownMenu(opt.value);
                        }}
                      >
                        <Text style={[styles.typeText, dsShutdownMenu === opt.value && styles.activeTypeText]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Time Correction */}
                  <Text style={styles.dsLabel}>Time Correction</Text>
                  <View style={styles.typeRow}>
                    {[
                      { value: false, label: 'OFF' },
                      { value: true, label: 'SYNC NOW' },
                    ].map((opt) => (
                      <TouchableOpacity
                        key={String(opt.value)}
                        style={[styles.typePill, dsTimeCorrection === opt.value && styles.activeTypePill]}
                        onPress={async () => {
                          if (opt.value) {
                            setDsTimeCorrection(true);
                            await syncTimeToDevice();
                            setTimeout(() => setDsTimeCorrection(false), 1500);
                          } else {
                            setDsTimeCorrection(false);
                          }
                        }}
                      >
                        <Text style={[styles.typeText, dsTimeCorrection === opt.value && styles.activeTypeText]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.dsDivider} />

                  {/* RECORDING SETTINGS */}
                  <Text style={styles.dsSectionTitle}>RECORDING SETTINGS</Text>

                  {/* Limited Time Recording */}
                  <Text style={styles.dsLabel}>Limited Time Recording</Text>
                  <View style={styles.typeRow}>
                    {[
                      { value: 'off', label: 'OFF' },
                      { value: '15', label: '15s' },
                      { value: '30', label: '30s' },
                      { value: '60', label: '60s' },
                    ].map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.typePill, dsLimitedRecord === opt.value && styles.activeTypePill]}
                        onPress={async () => {
                          setDsLimitedRecord(opt.value);
                          await setLimitedTimeRecording(opt.value);
                        }}
                      >
                        <Text style={[styles.typeText, dsLimitedRecord === opt.value && styles.activeTypeText]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Audio */}
                  <Text style={styles.dsLabel}>Audio</Text>
                  <View style={styles.typeRow}>
                    {[
                      { value: 'off', label: 'OFF' },
                      { value: 'on', label: 'ON' },
                    ].map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.typePill, dsAudio === opt.value && styles.activeTypePill]}
                        onPress={async () => {
                          setDsAudio(opt.value);
                          await setAudioStatus(opt.value);
                        }}
                      >
                        <Text style={[styles.typeText, dsAudio === opt.value && styles.activeTypeText]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        )}

        {/* BOTTOM SECTION */}
        <View style={[styles.bottomSection, isWideScreen && styles.bottomSectionWide]}>
          {isDeviceSettingsVisible && renderDeviceSettingsPanel()}

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
                      <ImageBackground
                        source={item.backgroundImage}
                        resizeMode="cover"
                        style={styles.palettePreview}
                        imageStyle={styles.palettePreviewImage}
                      >
                        <View style={styles.paletteShade} />
                        <View style={styles.paletteLabelBar}>
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.paletteText,
                              isActive && styles.activePaletteText,
                            ]}
                          >
                            {item.name}
                          </Text>
                        </View>
                      </ImageBackground>
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
                        // Send the color ID as expected by hardware
                        await setHardwareReticleColor(c.id);
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
                        )
                      })}
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
                      {/* <Text style={[styles.typeText, !isFrozen && styles.activeTypeText]}>Live</Text> */}
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

          {isToolkitVisible && (
            <View style={styles.toolkitWrapper}>
              <View style={styles.toolkitHeader}>
                <Text style={styles.toolkitTitle}>TOOLKIT</Text>
                <TouchableOpacity onPress={() => setIsToolkitVisible(false)} style={styles.zeroCalBackBtn}>
                  <Text style={styles.zeroCalBackText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.toolkitLabel}>Scene Mode</Text>
              <View style={styles.typeRow}>
                {SCENE_MODES.map((s) => (
                  <TouchableOpacity
                    key={s.value}
                    style={[styles.typePill, sceneMode === s.value && styles.activeTypePill]}
                    onPress={async () => { setSceneMode(s.value); await sendScene(s.value); }}
                  >
                    <Text style={[styles.typeText, sceneMode === s.value && styles.activeTypeText]}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.toolkitLabel}>Laser Ranging</Text>
              <View style={styles.typeRow}>
                {[{ value: 0, label: 'OFF' }, { value: 1, label: 'Single' }, { value: 2, label: 'Continuous' }].map((l) => (
                  <TouchableOpacity
                    key={l.value}
                    style={[styles.typePill, laserRangingMode === l.value && styles.activeTypePill]}
                    onPress={async () => { setLaserRangingMode(l.value); setIsLaserActive(l.value !== 0); await sendLaserRanging(l.value); }}
                  >
                    <Text style={[styles.typeText, laserRangingMode === l.value && styles.activeTypeText]}>{l.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.toolkitLabel}>AI Tracking</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[styles.typePill, !isAITrackingActive && styles.activeTypePill]}
                  onPress={async () => { if (isAITrackingActive) { setIsAITrackingActive(false); await sendAITracking(false); } }}
                >
                  <Text style={[styles.typeText, !isAITrackingActive && styles.activeTypeText]}>OFF</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typePill, isAITrackingActive && styles.activeTypePill]}
                  onPress={async () => { if (!isAITrackingActive) { setIsAITrackingActive(true); await sendAITracking(true); } }}
                >
                  <Text style={[styles.typeText, isAITrackingActive && styles.activeTypeText]}>ON</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {isImageAdjustVisible && (
            <View style={styles.toolkitWrapper}>
              <View style={styles.toolkitHeader}>
                <Text style={styles.toolkitTitle}>IMAGE ADJUST</Text>
                <TouchableOpacity onPress={() => setIsImageAdjustVisible(false)} style={styles.zeroCalBackBtn}>
                  <Text style={styles.zeroCalBackText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.toolkitLabel}>Brightness: {brightness}</Text>
              <View style={styles.sliderRow}>
                <Text style={styles.sliderMin}>1</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={5}
                  step={1}
                  value={brightness}
                  onSlidingComplete={async (v: number) => {
                    setBrightness(v);
                    await sendLuminanc(v);
                  }}
                  minimumTrackTintColor="#00E5FF"
                  maximumTrackTintColor="rgba(255,255,255,0.2)"
                  thumbTintColor="#00E5FF"
                />
                <Text style={styles.sliderMax}>5</Text>
              </View>

              <Text style={styles.toolkitLabel}>Contrast: {contrast}</Text>
              <View style={styles.sliderRow}>
                <Text style={styles.sliderMin}>1</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={5}
                  step={1}
                  value={contrast}
                  onSlidingComplete={async (v: number) => {
                    setContrast(v);
                    await sendContras(v);
                  }}
                  minimumTrackTintColor="#00E5FF"
                  maximumTrackTintColor="rgba(255,255,255,0.2)"
                  thumbTintColor="#00E5FF"
                />
                <Text style={styles.sliderMax}>5</Text>
              </View>

              <Text style={styles.toolkitLabel}>Image Enhancement</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[styles.typePill, !isEnhancementOn && styles.activeTypePill]}
                  onPress={async () => { if (isEnhancementOn) { setIsEnhancementOn(false); await sendEnhancement(0); } }}
                >
                  <Text style={[styles.typeText, !isEnhancementOn && styles.activeTypeText]}>OFF</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typePill, isEnhancementOn && styles.activeTypePill]}
                  onPress={async () => { if (!isEnhancementOn) { setIsEnhancementOn(true); await sendEnhancement(1); } }}
                >
                  <Text style={[styles.typeText, isEnhancementOn && styles.activeTypeText]}>ON</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={[styles.bottomDock, isWideScreen && styles.bottomDockWide]}>
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
                icon="brightness-6"
                iconColor={isImageAdjustVisible ? '#00E5FF' : '#FFF'}
                size={30}
                onPress={async () => {
                  const opening = !isImageAdjustVisible;
                  setIsReticleToolsVisible(false);
                  setIsZeroCalibrationVisible(false);
                  setShowReticle(false);
                  setIsPaletteVisible(false)
                  setIsDeviceSettingsVisible(false);

                  setIsImageAdjustVisible(opening);
                  if (opening) {
                    const hw = await fetchCurrentCalibrationData();
                    if (hw) {
                      setBrightness(Math.min(5, Math.max(1, hw.luminance)));
                      setContrast(Math.min(5, Math.max(1, hw.contrast)));
                      setIsEnhancementOn(hw.enhancement !== 0);
                    }
                  }
                }}
              />
            </View>

            <View style={styles.dockItem}>
              <IconButton
                icon="palette"
                iconColor={isPaletteVisible ? '#00E5FF' : '#FFF'}
                size={30}
                onPress={() => {
                  setIsReticleToolsVisible(false);
                  setIsZeroCalibrationVisible(false);
                  setShowReticle(false);
                  setIsImageAdjustVisible(false);
                  setIsDeviceSettingsVisible(false);

                  setIsPaletteVisible(!isPaletteVisible)
                }}
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
    aspectRatio: 1,
    alignSelf: 'center',
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  overlayContainerWide: {
    justifyContent: 'center',
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
    alignItems: 'flex-start',
    paddingHorizontal: 10,
    marginTop: 20,
  },
  floatingHeaderWide: {
    position: 'absolute',
    left: 8,
    top: 8,
    bottom: 8,
    width: 64,
    marginTop: 0,
    paddingHorizontal: 0,
    paddingVertical: 8,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    borderRadius: 32,
    backgroundColor: 'rgba(20,20,20,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  headerLeft: { flexDirection: 'row', width: 50 },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 100
  },
  headerRailGroup: {
    width: 64,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  headerCenterWide: {
    marginVertical: 8,
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
  bottomSectionWide: {
    position: 'absolute',
    right: 8,
    top: 8,
    bottom: 8,
    width: 340,
    paddingBottom: 0,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  paletteWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  paletteScroll: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  palettePill: {
    width: 86,
    height: 64,
    backgroundColor: 'rgba(18,18,20,0.92)',
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
  },
  activePalettePill: {
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0,229,255,0.08)',
  },
  palettePreview: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#111',
  },
  palettePreviewImage: {
    borderRadius: 7,
  },
  paletteShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  paletteLabelBar: {
    minHeight: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  paletteText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 10,
    fontWeight: '700',
  },
  activePaletteText: {
    color: '#00E5FF',
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
  bottomDockWide: {
    width: 64,
    height: 360,
    flexDirection: 'column',
    borderRadius: 32,
    paddingHorizontal: 0,
    paddingVertical: 10,
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
    fontSize: 14,
    fontWeight: 'bold',
  },
  toolkitWrapper: {
    width: '94%',
    backgroundColor: 'rgba(20,20,20,0.92)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,152,0,0.15)',
  },
  toolkitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  toolkitTitle: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  toolkitLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 10,
  },
  // Device Settings Panel
  deviceSettingsOverlay: {
    width: '94%',
    height: SCREEN_HEIGHT * 0.44,
    maxHeight: SCREEN_HEIGHT * 0.44,
    backgroundColor: 'rgba(20,20,20,0.92)',
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.15)',
    overflow: 'hidden',
  },
  deviceSettingsScroll: {
    flex: 1,
  },
  deviceSettingsContent: {
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 24,
  },
  deviceSettingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 50,
    paddingLeft: 16,
    paddingRight: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  deviceSettingsTitle: {
    color: '#00E5FF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  panelCloseButton: {
    margin: 0,
  },
  dsSectionTitle: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 14,
  },
  dsLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 10,
  },
  dsOptionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    rowGap: 8,
  },
  dsDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 12,
  },
  dsLoadingText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
