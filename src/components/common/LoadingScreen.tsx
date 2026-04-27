import React, { Component, JSX } from 'react';
import {
  StyleSheet,
  Animated,
  ActivityIndicator,
  Platform,
  View,
} from 'react-native';

import { COLORS, SIZES } from '../../core/theme';

interface LoadingScreenProps {
  isTransparent?: boolean;
  withBackground?: boolean;
  children?: React.ReactNode;
}

interface LoadingScreenState {
  fadeAnim: Animated.Value;
}

export default class LoadingScreen extends Component<
  LoadingScreenProps,
  LoadingScreenState
> {
  state: LoadingScreenState = {
    fadeAnim: new Animated.Value(0),
  };

  componentDidMount(): void {
    Animated.timing(this.state.fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }

  render(): JSX.Element {
    const { isTransparent = false, withBackground = false, children } = this.props;

    return (
      <Animated.View
        style={[
          styles.loading,
          {
            opacity: this.state.fadeAnim,
            backgroundColor: isTransparent
              ? COLORS.transparent
              : 'rgba(0,0,0,0.5)',
          },
        ]}
      >
        <View
          style={{
            backgroundColor: withBackground
              ? COLORS.lightGrey
              : COLORS.transparent,
            padding: SIZES.padding2 * 2,
            borderRadius: 10,
          }}
        >
          <ActivityIndicator
            color={Platform.OS === 'ios' ? COLORS.Grey : COLORS.Red}
            size={Platform.OS === 'android' ? SIZES.width / 8 : 'large'}
          />
          {children}
        </View>
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  loading: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25
  },
});
