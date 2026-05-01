import React from 'react';
import { StyleSheet, Dimensions, View, TouchableOpacity, SafeAreaView } from 'react-native';
import Pdf from 'react-native-pdf';
import { Text, Surface } from 'react-native-paper';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

const { width, height } = Dimensions.get('window');

const PDFViewerScreen = ({ route, navigation }: any) => {
  const { source, title } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={4}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialDesignIcons name="chevron-left" size={32} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{title || 'Document Viewer'}</Text>
        </View>
        <View style={{ width: 40 }} />
      </Surface>

      <View style={styles.pdfContainer}>
        <Pdf
          source={source}
          onLoadComplete={(numberOfPages, filePath) => {
            console.log(`Number of pages: ${numberOfPages}`);
          }}
          onPageChanged={(page, numberOfPages) => {
            console.log(`Current page: ${page}`);
          }}
          onError={(error) => {
            console.log(error);
          }}
          onPressLink={(uri) => {
            console.log(`Link pressed: ${uri}`);
          }}
          style={styles.pdf}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1a',
  },
  header: {
    height: 60,
    backgroundColor: '#1a2233',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  backButton: {
    padding: 5,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pdfContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  pdf: {
    flex: 1,
    width: width,
    height: height - 60,
    backgroundColor: '#0a0f1a',
  }
});

export default PDFViewerScreen;
