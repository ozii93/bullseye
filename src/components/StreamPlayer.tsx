import React from 'react';
import { Platform } from 'react-native';
import AndroidGuideStreamView, { GuideStreamViewRef } from '../components/GuideStreamView';
import IosStreamView from '../components/IosStreamView';

interface StreamPlayerProps {
  rtspType?: number;
  style?: any;
  onPlaying?: () => void;
  onRecordComplete?: (event: { nativeEvent: { path: string } }) => void;
}

const StreamPlayer = React.forwardRef<GuideStreamViewRef, StreamPlayerProps>(
  (props, ref) => {
    if (Platform.OS === 'ios') {
      return <IosStreamView ref={ref} {...props} />;
    }
    return <AndroidGuideStreamView ref={ref} {...props} />;
  },
);

export default StreamPlayer;
export type { GuideStreamViewRef };
