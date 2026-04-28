import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Avatar, List, useTheme, Divider, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

const ProfileScreen = () => {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Header */}
        <View style={styles.header}>
          <Avatar.Image 
            size={100} 
            source={{ uri: 'https://i.pravatar.cc/150?u=hawk' }} 
            style={styles.avatar}
          />
          <Text style={styles.name}>Commander Hawk</Text>
          <Text style={styles.email}>hawk@nighthawk.security</Text>
          <Button 
            mode="outlined" 
            onPress={() => {}} 
            style={styles.editButton}
            textColor="#00E5FF"
          >
            Edit Profile
          </Button>
        </View>

        {/* Settings Groups */}
        <View style={styles.menuGroup}>
          <Text style={styles.groupTitle}>Account Settings</Text>
          <List.Item
            title="Personal Information"
            left={props => <List.Icon {...props} icon="account-outline" color="#00E5FF" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            titleStyle={styles.listTitle}
            onPress={() => {}}
          />
          <Divider style={styles.divider} />
          <List.Item
            title="Security & Password"
            left={props => <List.Icon {...props} icon="shield-lock-outline" color="#00E5FF" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            titleStyle={styles.listTitle}
            onPress={() => {}}
          />
          <Divider style={styles.divider} />
          <List.Item
            title="Connected Devices"
            left={props => <List.Icon {...props} icon="devices" color="#00E5FF" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            titleStyle={styles.listTitle}
            onPress={() => {}}
          />
        </View>

        <View style={styles.menuGroup}>
          <Text style={styles.groupTitle}>App Settings</Text>
          <List.Item
            title="Notifications"
            left={props => <List.Icon {...props} icon="bell-outline" color="#00E5FF" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            titleStyle={styles.listTitle}
            onPress={() => {}}
          />
          <Divider style={styles.divider} />
          <List.Item
            title="Privacy Policy"
            left={props => <List.Icon {...props} icon="file-document-outline" color="#00E5FF" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            titleStyle={styles.listTitle}
            onPress={() => {}}
          />
        </View>

        <TouchableOpacity style={styles.logoutButton}>
          <MaterialDesignIcons name="logout" size={24} color="#FF3B30" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>NightHawk v1.0.4-beta</Text>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  avatar: {
    borderWidth: 3,
    borderColor: '#00E5FF',
    marginBottom: 15,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  email: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 15,
  },
  editButton: {
    borderColor: '#00E5FF',
    borderRadius: 10,
  },
  menuGroup: {
    marginTop: 25,
    paddingHorizontal: 15,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00E5FF',
    marginLeft: 15,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  listTitle: {
    color: '#FFF',
    fontSize: 16,
  },
  divider: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    backgroundColor: 'rgba(255,59,48,0.1)',
    paddingVertical: 15,
    marginHorizontal: 20,
    borderRadius: 15,
  },
  logoutText: {
    color: '#FF3B30',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 16,
  },
  versionText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
  },
});

export default ProfileScreen;