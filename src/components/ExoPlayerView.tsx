import React from 'react';
import { requireNativeComponent, StyleProp, ViewStyle } from 'react-native';

interface ExoPlayerViewProps {
  uri: string;
  style?: StyleProp<ViewStyle>;
  onPlaying?: () => void;
  onError?: (event: { nativeEvent: { message: string } }) => void;
}

const RCTExoPlayerView = requireNativeComponent<ExoPlayerViewProps>('ExoPlayerView');

const ExoPlayerView: React.FC<ExoPlayerViewProps> = ({ uri, style, onPlaying, onError }) => {
  return (
    <RCTExoPlayerView
      uri={uri}
      style={style}
      onPlaying={onPlaying}
      onError={onError}
    />
  );
};

export default ExoPlayerView;
