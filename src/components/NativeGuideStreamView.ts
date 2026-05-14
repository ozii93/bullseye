import {
  requireNativeComponent,
  StyleProp,
  ViewStyle,
} from 'react-native';

export interface NativeGuideStreamViewProps {
  rtspType?: number;
  style?: StyleProp<ViewStyle>;
  onPlaying?: () => void;
  onRecordComplete?: (event: { nativeEvent: { path: string } }) => void;
}

const NativeGuideStreamView = requireNativeComponent<NativeGuideStreamViewProps>('GuideStreamView');

export default NativeGuideStreamView;
