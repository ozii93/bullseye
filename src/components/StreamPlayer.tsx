import React from 'react';
import GuideStreamView, { GuideStreamViewRef } from './GuideStreamView';

interface StreamPlayerProps {
  rtspType?: number;
  style?: any;
  onPlaying?: () => void;
  onRecordComplete?: (event: { nativeEvent: { path: string } }) => void;
}

const StreamPlayer = React.forwardRef<GuideStreamViewRef, StreamPlayerProps>(
  (props, ref) => {
    // Tinggal panggil aja, nggak perlu if-else Platform.OS lagi
    return <GuideStreamView ref={ref} {...props} />;
  },
);

export default StreamPlayer;
export type { GuideStreamViewRef };