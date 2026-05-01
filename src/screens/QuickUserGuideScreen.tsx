import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { Text, Surface, Divider, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import RNFS from 'react-native-fs';

const { width } = Dimensions.get('window');

const QuickUserGuideScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);

  const handleOpenManual = async () => {
    setLoading(true);
    try {
      const assetFileName = 'Dok-NIGHTHAWK.pdf';
      const destPath = `${RNFS.DocumentDirectoryPath}/${assetFileName}`;
      const exists = await RNFS.exists(destPath);
      
      if (!exists) {
        await RNFS.copyFileAssets(assetFileName, destPath);
      }

      const url = `file://${destPath}`;
      
      navigation.navigate('PDFViewer', {
        source: { uri: url, cache: true },
        title: 'NIGHTHAWK Manual'
      });
    } catch (error) {
      console.error('Error processing PDF:', error);
      Alert.alert('Error', 'Gagal memproses manual sistem. Pastikan file PDF sudah tersedia di folder assets.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Tactical Header (Matched with Gallery) */}
      <View style={styles.header}>
        <IconButton 
          icon="chevron-left" 
          iconColor="#FFF" 
          size={32}
          onPress={() => navigation.goBack()} 
        />
        <View style={styles.titleContainer}>
          <Text style={styles.title}>SYSTEM PROTOCOLS</Text>
          <Text style={styles.subtitle}>TACTICAL OPERATIONS MANUAL</Text>
        </View>
        <IconButton 
          icon="book-information-variant" 
          iconColor="#D32F2F" 
          size={24} 
          onPress={() => {}} 
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Elite Model Card */}
        <Surface style={styles.modelCard} elevation={4}>
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />

          <View style={styles.cardHeader}>
            <View style={styles.iconFrame}>
              <MaterialDesignIcons name="target" size={44} color="#00E5FF" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.brandText}>NIGHTHAWK</Text>
              <Text style={styles.modelSubtitle}>THERMAL IMAGING ELITE</Text>
            </View>
          </View>

          <View style={styles.cardDivider}>
            <View style={styles.dividerLine} />
            <MaterialDesignIcons name="shield-check" size={14} color="#D32F2F" />
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.detailsContainer}>
            <Text style={styles.description}>
              Official operational manual for the NIGHTHAWK thermal system. Includes calibration procedures, 
              media management, and advanced reticle configuration protocols.
            </Text>
            
            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <MaterialDesignIcons name="file-pdf-box" size={20} color="#D32F2F" />
                <Text style={styles.infoText}>DOK-NIGHTHAWK.PDF</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialDesignIcons name="security" size={20} color="#4CAF50" />
                <Text style={styles.infoText}>VERIFIED BUILD v1.0.4</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.premiumButton, loading && { opacity: 0.7 }]} 
            onPress={handleOpenManual}
            disabled={loading}
          >
            <View style={styles.buttonInner}>
              <MaterialDesignIcons name="book-open-variant" size={22} color="#FFF" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>{loading ? 'INITIALIZING...' : 'OPEN SYSTEM MANUAL'}</Text>
            </View>
          </TouchableOpacity>
        </Surface>

        {/* Security Note */}
        <View style={styles.noteBox}>
          <MaterialDesignIcons name="alert-decagram-outline" size={20} color="rgba(211, 47, 47, 0.5)" />
          <Text style={styles.noteText}>
            This document contains classified operational procedures. Unauthorized distribution is strictly prohibited under protocol 09-B.
          </Text>
        </View>
      </ScrollView>
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
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  modelCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    padding: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginTop: 10,
    overflow: 'hidden',
  },
  cornerTL: { position: 'absolute', top: 15, left: 15, width: 20, height: 20, borderTopWidth: 1, borderLeftWidth: 1, borderColor: 'rgba(211, 47, 47, 0.4)' },
  cornerTR: { position: 'absolute', top: 15, right: 15, width: 20, height: 20, borderTopWidth: 1, borderRightWidth: 1, borderColor: 'rgba(211, 47, 47, 0.4)' },
  cornerBL: { position: 'absolute', bottom: 15, left: 15, width: 20, height: 20, borderBottomWidth: 1, borderLeftWidth: 1, borderColor: 'rgba(211, 47, 47, 0.4)' },
  cornerBR: { position: 'absolute', bottom: 15, right: 15, width: 20, height: 20, borderBottomWidth: 1, borderRightWidth: 1, borderColor: 'rgba(211, 47, 47, 0.4)' },
  
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  iconFrame: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
  },
  headerText: {
    flex: 1,
  },
  brandText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
  },
  modelSubtitle: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  cardDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 15,
  },
  detailsContainer: {
    marginBottom: 35,
  },
  description: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 25,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 15,
    borderRadius: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 12,
    letterSpacing: 1,
  },
  premiumButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0c1018',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  buttonIcon: {
    marginRight: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  noteBox: {
    flexDirection: 'row',
    padding: 20,
    marginTop: 30,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  noteText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    marginLeft: 12,
    flex: 1,
    lineHeight: 16,
    fontStyle: 'italic',
  },
});

export default QuickUserGuideScreen;
