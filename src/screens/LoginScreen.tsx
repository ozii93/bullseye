import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Dimensions,
  StatusBar,
  Alert,
  Animated,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Button,
  Surface,
  useTheme,
} from 'react-native-paper';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useAuth } from '../provider/AuthContext';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

const { width, height } = Dimensions.get('window');

// Configure Google Signin
GoogleSignin.configure({
  webClientId: '719621040218-8h04igc9o1f573mkfq3vkmvgvmj8tbvc.apps.googleusercontent.com',
  offlineAccess: true,
});

const LoginScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      if (userInfo.type === 'success') {
        const userData = {
          id: userInfo.data.user.id,
          name: userInfo.data.user.name,
          email: userInfo.data.user.email,
          photo: userInfo.data.user.photo,
          token: userInfo.data.idToken,
        };
        await login(userData);
        Alert.alert('Access Granted', `Welcome, ${userData.name}`);
      }
    } catch (error: any) {
      if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
        console.log('Google Sign-In Error:', error);
        Alert.alert('Access Denied', `Error: ${error.code || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Dark Tactical Background with Gradient Simulation */}
      <View style={styles.background}>
        <View style={styles.topGlow} />
        <View style={styles.bottomGlow} />
        {/* HUD Elements */}
        <View style={styles.hudTopLeft} />
        <View style={styles.hudTopRight} />
        <View style={styles.hudBottomLeft} />
        <View style={styles.hudBottomRight} />
      </View>

      <View style={styles.content}>
        {/* Elite Logo Frame */}
        <View style={styles.eliteFrame}>
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />
          <Surface style={styles.logoContainer} elevation={5}>
            <Image
              source={require('../../assets/img/bootsplash icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Surface>
        </View>

        <View style={styles.headerTextContainer}>
          <Text style={styles.mainTitle}>
            BULLS<Text style={{ color: '#D32F2F' }}>EYE</Text>
          </Text>
          <View style={styles.subtitleRow}>
            <View style={styles.subLine} />
            <Text style={styles.subtitle}>TACTICAL OPTICS ELITE</Text>
            <View style={styles.subLine} />
          </View>
        </View>

        {/* Glassmorphism Login Box */}
        <View style={styles.loginBox}>
          <View style={styles.scannerLine} />
          <Text style={styles.securityText}>SECURITY VERIFICATION REQUIRED</Text>
          
          <TouchableOpacity 
            style={[styles.premiumButton, loading && { opacity: 0.7 }]} 
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            <View style={styles.buttonInner}>
              <MaterialDesignIcons name="google" size={24} color="#FFF" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>{loading ? 'VERIFYING...' : 'LOGIN WITH GOOGLE'}</Text>
              <MaterialDesignIcons name="shield-key-outline" size={20} color="rgba(255,255,255,0.4)" />
            </View>
          </TouchableOpacity>

          <View style={styles.footerInfo}>
            <MaterialDesignIcons name="lock" size={12} color="#D32F2F" />
            <Text style={styles.encryptedText}>ENCRYPTED CONNECTION ESTABLISHED</Text>
          </View>
        </View>
      </View>

      <View style={styles.versionContainer}>
        <Text style={styles.versionLabel}>SYSTEM OS</Text>
        <Text style={styles.versionValue}>v1.0.4-ELITE</Text>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05070a', // Deeper black
  },
  background: {
    position: 'absolute',
    width: width,
    height: height,
    overflow: 'hidden',
  },
  topGlow: {
    position: 'absolute',
    top: -height * 0.2,
    right: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(211, 47, 47, 0.08)', // Subtle red glow
  },
  bottomGlow: {
    position: 'absolute',
    bottom: -height * 0.1,
    left: -width * 0.1,
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(0, 229, 255, 0.05)', // Subtle cyan glow
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  eliteFrame: {
    padding: 15,
    marginBottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerTL: { position: 'absolute', top: 0, left: 0, width: 20, height: 20, borderTopWidth: 2, borderLeftWidth: 2, borderColor: '#D32F2F' },
  cornerTR: { position: 'absolute', top: 0, right: 0, width: 20, height: 20, borderTopWidth: 2, borderRightWidth: 2, borderColor: '#D32F2F' },
  cornerBL: { position: 'absolute', bottom: 0, left: 0, width: 20, height: 20, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: '#D32F2F' },
  cornerBR: { position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderBottomWidth: 2, borderRightWidth: 2, borderColor: '#D32F2F' },
  logoContainer: {
    width: 130,
    height: 130,
    backgroundColor: '#0c1018',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  logo: {
    width: '80%',
    height: '80%',
  },
  headerTextContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 8,
    textShadowColor: 'rgba(211, 47, 47, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  subLine: {
    width: 30,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  subtitle: {
    color: '#D32F2F',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 4,
    marginHorizontal: 15,
  },
  loginBox: {
    width: '100%',
    padding: 30,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    overflow: 'hidden',
  },
  scannerLine: {
    position: 'absolute',
    top: 0,
    width: '120%',
    height: 1,
    backgroundColor: 'rgba(211, 47, 47, 0.3)',
  },
  securityText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 30,
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
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
    flex: 1,
    textAlign: 'center',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 25,
  },
  encryptedText: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
    marginLeft: 6,
  },
  versionContainer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  versionLabel: {
    color: 'rgba(255, 255, 255, 0.2)',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  versionValue: {
    color: 'rgba(211, 47, 47, 0.5)',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 2,
  },
  // HUD Elements
  hudTopLeft: { position: 'absolute', top: 60, left: 30, width: 40, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)' },
  hudTopRight: { position: 'absolute', top: 60, right: 30, width: 10, height: 10, borderWidth: 1, borderColor: 'rgba(211, 47, 47, 0.1)' },
  hudBottomLeft: { position: 'absolute', bottom: 100, left: 30, width: 2, height: 40, backgroundColor: 'rgba(255, 255, 255, 0.05)' },
  hudBottomRight: { position: 'absolute', bottom: 100, right: 30, width: 40, height: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)' },
});

export default LoginScreen;
