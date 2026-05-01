import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions, StatusBar } from 'react-native';
import { Text, Surface, IconButton, List, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

const FAQScreen = ({ navigation }: any) => {
  const faqs = [
    {
      question: 'Bagaimana cara menghubungkan perangkat?',
      answer: 'Aktifkan Wi-Fi pada perangkat thermal Anda, lalu buka menu "Encrypted Devices" di profil atau klik "Connect Device" di dashboard untuk memilih SSID perangkat.',
    },
    {
      question: 'Mengapa live stream tidak muncul?',
      answer: 'Pastikan Anda sudah terhubung ke Wi-Fi perangkat. Jika masih tidak muncul, coba restart aplikasi atau pastikan tidak ada aplikasi lain yang menggunakan stream tersebut.',
    },
    {
      question: 'Di mana hasil rekaman disimpan?',
      answer: 'Semua hasil foto dan video disimpan di memori internal aplikasi dan dapat diakses melalui menu "Intelligence Archive" atau Gallery.',
    },
    {
      question: 'Apakah sistem ini aman?',
      answer: 'Ya, BullsEye menggunakan enkripsi AES-256 untuk komunikasi data antara aplikasi dan perangkat thermal untuk menjamin keamanan operasional.',
    },
  ];

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
          <Text style={styles.title}>SUPPORT CENTER</Text>
          <Text style={styles.subtitle}>FREQUENTLY ASKED QUESTIONS</Text>
        </View>
        <IconButton 
          icon="help-circle" 
          iconColor="#D32F2F" 
          size={24} 
          onPress={() => {}} 
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Surface style={styles.faqContainer} elevation={1}>
          {faqs.map((faq, index) => (
            <React.Fragment key={index}>
              <List.Accordion
                title={faq.question}
                titleStyle={styles.faqTitle}
                style={styles.accordion}
                left={props => <List.Icon {...props} icon="help-circle" color="#00E5FF" />}
                theme={{ colors: { primary: '#00E5FF' } }}
              >
                <View style={styles.answerContainer}>
                  <Text style={styles.answerText}>{faq.answer}</Text>
                </View>
              </List.Accordion>
              {index < faqs.length - 1 && <Divider style={styles.divider} />}
            </React.Fragment>
          ))}
        </Surface>

        <View style={styles.footerInfo}>
          <MaterialDesignIcons name="headset" size={20} color="rgba(255,255,255,0.2)" />
          <Text style={styles.footerText}>Butuh bantuan lebih lanjut? Hubungi Tactical Support.</Text>
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
    padding: 20,
  },
  faqContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  accordion: {
    backgroundColor: 'transparent',
  },
  faqTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  answerContainer: {
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  answerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    lineHeight: 20,
  },
  divider: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  footerInfo: {
    marginTop: 40,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  footerText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  }
});

export default FAQScreen;
