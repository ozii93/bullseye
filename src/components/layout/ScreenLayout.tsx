import React, { PropsWithChildren, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ImageBackground,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Surface, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingIndicator } from '../common/LoadingIndicator';

type ScreenLayoutProps = PropsWithChildren & {
  style?: StyleProp<ViewStyle>;
  scrollable?: boolean;
  onScroll?: any;
  scrollThrottle?: number;
  isLoading?: boolean;
  withBackgroundImg?: boolean;
  refreshControlActions?: any;
  containerBackgroundColor?: boolean;
  edges?: Array<'top' | 'right' | 'bottom' | 'left'>;
};

export const ScreenLayout = ({
  children,
  style,
  onScroll,
  isLoading = false,
  withBackgroundImg = false,
  scrollable = true,
  scrollThrottle,
  refreshControlActions,
  containerBackgroundColor = true,
  edges = ['left', 'right'],
}: ScreenLayoutProps) => {
  const setLoading =false;
  const theme = useTheme();

  useFocusEffect(
    useCallback(() => {
      const timeout = setTimeout(() => {
        // setLoading(false);
      }, 250);
      return () => {
        clearTimeout(timeout);
      };
    }, [setLoading])
  );

  const content = (
    <Surface style={[{ flex: 1, backgroundColor: 'transparent' }, style]}>
      {children}
    </Surface>
  );

  if (!scrollable) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={edges}>
        {content}
      </SafeAreaView>
    );
  }

  const scrollView = (
    <ScrollView
      scrollEventThrottle={scrollThrottle}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      contentContainerStyle={{
        flexGrow: 1,
        minHeight: '100%',
        backgroundColor: 'transparent',
      }}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControlActions}
    >
      {content}
    </ScrollView>
  );

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: containerBackgroundColor
          ? theme.colors.background
          : 'transparent',
      }}
      edges={edges}
    >
      {withBackgroundImg ? (
        <ImageBackground
          style={{ flex: 1 }}
          source={require('../../../assets/img/main-bg.jpg')}
        >
          {/* Overlay hitam transparan */}
          <View
            style={{
              ...StyleSheet.absoluteFill,
              backgroundColor: 'rgba(0,0,0,0.4)', // 40% transparan
            }}
          />
          {isLoading ? (
            <LoadingIndicator hasMore={false} visible={isLoading} />
          ) : (
            scrollView
          )}
        </ImageBackground>
      ) : isLoading ? (
        <LoadingIndicator hasMore={false} visible={isLoading} />
      ) : (
        scrollView
      )}
    </SafeAreaView>
  );
};
