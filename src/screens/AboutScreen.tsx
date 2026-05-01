import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions, StatusBar, Image } from 'react-native';
import { Text, Surface, IconButton, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

const AboutScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <IconButton 
          icon="chevron-left" 
          iconColor="#FFF" 
          size={32}
          onPress={() => navigation.goBack()} 
        />
        <View style={styles.titleContainer}>
          <Text style={styles.title}>SYSTEM INFO</Text>
          <Text style={styles.subtitle}>ABOUT BULLSEYE TACTICAL</Text>
        </View>
        <IconButton 
          icon="information" 
          iconColor="#D32F2F" 
          size={24} 
          onPress={() => {}} 
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Branding Section */}
        <View style={styles.brandingSection}>
          <Surface style={styles.logoFrame} elevation={4}>
            <MaterialDesignIcons name="target" size={60} color="#D32F2F" />
          </Surface>
          <Text style={styles.brandName}>BULLSEYE</Text>
          <Text style={styles.tagline}>PRECISION THERMAL INTELLIGENCE</Text>
        </View>

        {/* Version Info */}
        <Surface style={styles.infoCard} elevation={2}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>SYSTEM VERSION</Text>
            <Text style={styles.infoValue}>v1.0.4-PRO</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>BUILD DATE</Text>
            <Text style={styles.infoValue}>05 MAY 2026</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>SECURITY PATCH</Text>
            <Text style={styles.infoValue}>ACTIVE</Text>
          </View>
        </Surface>

        {/* Description Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.accentLine} />
          <Text style={styles.sectionTitle}>MISSION STATEMENT</Text>
        </View>
        
        <Text style={styles.descriptionText}>
          BullsEye Tactical Systems adalah platform manajemen termal canggih yang dirancang untuk kebutuhan pemantauan tingkat tinggi. 
          Kami berdedikasi untuk menyediakan solusi visualisasi panas yang presisi, aman, dan dapat diandalkan untuk para profesional di lapangan.
        </Text>

        <Surface style={styles.legalCard} elevation={1}>
          <Text style={styles.legalText}>
            © 2026 NightHawk Defense Industries. Seluruh hak cipta dilindungi undang-undang. 
            Penggunaan sistem ini tunduk pada protokol keamanan militer tingkat tinggi.
          </Text>
        </Surface>

        <View style={styles.footerBranding}>
          <Text style={styles.footerBrand}>NIGHTHAWK INDUSTRIES</Text>
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
  },
  brandingSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoFrame: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(211, 47, 47, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(211, 47, 47, 0.2)',
    marginBottom: 20,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#D32F2F',
    letterSpacing: 2,
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 40,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  infoLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  infoValue: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
  divider: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  accentLine: {
    width: 4,
    height: 14,
    backgroundColor: '#D32F2F',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
  },
  descriptionText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    lineHeight: 24,
    marginBottom: 40,
  },
  legalCard: {
    padding: 20,
    backgroundColor: 'rgba(211, 47, 47, 0.03)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(211, 47, 47, 0.1)',
  },
  legalText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  footerBranding: {
    marginTop: 60,
    alignItems: 'center',
  },
  footerBrand: {
    color: 'rgba(255,255,255,0.1)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 4,
  }
});

export default AboutScreen;
