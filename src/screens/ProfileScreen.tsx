import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, StatusBar, Linking, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text, Avatar, Surface, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { useAuth } from '../provider/AuthContext';
import { useNotification } from '../provider/NotificationContext';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { logout, deleteAccount, user } = useAuth();
  const { showSnackbar } = useNotification();

  const handleLogout = () => {
    showSnackbar('Are you sure you want to log out of the tactical network?', {
      actionLabel: 'TERMINATE',
      onAction: () => logout(),
    });
  };

  const handleDeleteAccount = () => {
    showSnackbar('Delete account and remove local profile data from this device?', {
      actionLabel: 'DELETE',
      onAction: () => deleteAccount(),
    });
  };

  const openWifiSettings = () => {
    if (Platform.OS === 'android') {
      Linking.sendIntent('android.settings.WIFI_SETTINGS');
    } else {
      Linking.openURL('App-Prefs:root=WIFI');
    }
  };

  const showSecurityClearance = () => {
    showSnackbar(`Security Clearance: ${user?.name || 'OPERATIVE'} | TOP SECRET | VERIFIED`);
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://bullseye.security/privacy');
  };

  const ProfileItem = ({ title, icon, onPress, color = '#00E5FF' }: any) => (
    <TouchableOpacity onPress={onPress} style={styles.profileItem}>
      <View style={[styles.itemIconContainer, { backgroundColor: color + '10' }]}>
        <MaterialDesignIcons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.itemTitle}>{title}</Text>
      <MaterialDesignIcons name="chevron-right" size={24} color="rgba(255,255,255,0.2)" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Profile Header Card */}
        <Surface style={styles.profileCard} elevation={4}>
          <View style={styles.cardDecoration} />
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarGlow} />
            <Avatar.Image
              size={100}
              source={{ uri: user?.photo || 'https://i.pravatar.cc/150?u=hawk' }}
              style={styles.avatar}
            />
            <View style={styles.onlineBadge} />
          </View>

          <Text style={styles.name}>{user?.name?.toUpperCase() || 'COMMANDER HAWK'}</Text>
          <Text style={styles.rank}>ELITE OPERATIVE</Text>

          <View style={styles.badgeRow}>
            <View style={styles.eliteBadge}>
              <MaterialDesignIcons name="shield-check" size={12} color="#D32F2F" />
              <Text style={styles.badgeText}>SECURED</Text>
            </View>
          </View>
        </Surface>

        {/* Settings Groups */}
        <View style={styles.sectionHeader}>
          <View style={styles.accentLine} />
          <Text style={styles.sectionTitle}>CORE CONFIGURATION</Text>
        </View>

        <Surface style={styles.menuContainer} elevation={1}>
          <ProfileItem
            title="SECURITY CLEARANCE"
            icon="shield-key-outline"
            onPress={showSecurityClearance}
          />
          <Divider style={styles.divider} />
          <ProfileItem
            title="SYSTEM MANUAL"
            icon="book-open-variant"
            onPress={() => navigation.navigate('QuickUserGuide')}
          />
          <Divider style={styles.divider} />
          <ProfileItem
            title="DEVICE HISTORY"
            icon="history"
            onPress={() => navigation.navigate('DeviceHistory')}
          />
        </Surface>

        <View style={styles.sectionHeader}>
          <View style={styles.accentLine} />
          <Text style={styles.sectionTitle}>SUPPORT & INFO</Text>
        </View>

        <Surface style={styles.menuContainer} elevation={1}>
          <ProfileItem
            title="F.A.Q CENTER"
            icon="help-circle"
            color="#FF9800"
            onPress={() => navigation.navigate('FAQ')}
          />
          <Divider style={styles.divider} />
          <ProfileItem
            title="PRIVACY POLICY"
            icon="file-document-outline"
            color="#4CAF50"
            onPress={openPrivacyPolicy}
          />
          <Divider style={styles.divider} />
          <ProfileItem
            title="ABOUT BULLSEYE"
            icon="information"
            color="#00E5FF"
            onPress={() => navigation.navigate('About')}
          />
        </Surface>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <MaterialDesignIcons name="power" size={24} color="#D32F2F" />
          <Text style={styles.logoutText}>TERMINATE SESSION</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteAccountButton}
          onPress={handleDeleteAccount}
          activeOpacity={0.8}
        >
          <MaterialDesignIcons name="account-remove-outline" size={24} color="#FF3B30" />
          <Text style={styles.deleteAccountText}>DELETE ACCOUNT</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>BULLSEYE TACTICAL SYSTEMS</Text>
          <Text style={styles.footerSubText}>SECURE BUILD: 050122-PRO</Text>
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
  scrollContent: {
    padding: 24,
    paddingBottom: 120,
  },
  profileCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 40,
    overflow: 'hidden',
  },
  cardDecoration: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(211, 47, 47, 0.05)',
  },
  avatarWrapper: {
    marginBottom: 20,
    position: 'relative',
  },
  avatarGlow: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  avatar: {
    backgroundColor: '#0c1018',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#05070a',
  },
  name: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 2,
    textAlign: 'center',
  },
  rank: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#D32F2F',
    letterSpacing: 4,
    marginTop: 6,
    textAlign: 'center',
  },
  badgeRow: {
    marginTop: 20,
  },
  eliteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(211, 47, 47, 0.2)',
  },
  badgeText: {
    color: '#D32F2F',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginLeft: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginLeft: 5,
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
  menuContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 35,
    overflow: 'hidden',
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  itemIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  itemTitle: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  divider: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(211, 47, 47, 0.08)',
    paddingVertical: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(211, 47, 47, 0.2)',
  },
  logoutText: {
    color: '#D32F2F',
    fontWeight: '900',
    letterSpacing: 2,
    marginLeft: 12,
    fontSize: 14,
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
    paddingVertical: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.24)',
  },
  deleteAccountText: {
    color: '#FF3B30',
    fontWeight: '900',
    letterSpacing: 2,
    marginLeft: 12,
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    marginTop: 50,
  },
  footerText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  footerSubText: {
    color: 'rgba(255,255,255,0.1)',
    fontSize: 8,
    marginTop: 4,
    letterSpacing: 1,
  }
});

export default ProfileScreen;
