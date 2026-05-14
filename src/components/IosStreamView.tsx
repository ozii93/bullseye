import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  StyleProp,
  ViewStyle,
  NativeModules,
  findNodeHandle,
} from 'react-native';
import NativeGuideStreamView from './NativeGuideStreamView';

interface IosStreamViewProps {
  rtspType?: number;
  style?: StyleProp<ViewStyle>;
  onPlaying?: () => void;
  onRecordComplete?: (event: { nativeEvent: { path: string } }) => void;
}

export interface GuideStreamViewRef {
  startRecord: (path: string) => void;
  stopRecord: () => void;
  snapShot: (path: string) => void;
}

const { GuideStreamCommands } = NativeModules;

const IosStreamView = forwardRef<GuideStreamViewRef, IosStreamViewProps>(
  ({ rtspType = 1, style, onPlaying, onRecordComplete }, ref) => {
    const nativeRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      startRecord(path: string) {
        const tag = findNodeHandle(nativeRef.current);
        if (tag != null && GuideStreamCommands) {
          GuideStreamCommands.startRecord(tag, path);
        }
      },
      stopRecord() {
        const tag = findNodeHandle(nativeRef.current);
        if (tag != null && GuideStreamCommands) {
          GuideStreamCommands.stopRecord(tag);
        }
      },
      snapShot(path: string) {
        const tag = findNodeHandle(nativeRef.current);
        if (tag != null && GuideStreamCommands) {
          GuideStreamCommands.snapShot(tag, path);
        }
      },
    }));

    return (
      <NativeGuideStreamView
        ref={nativeRef}
        rtspType={rtspType}
        style={style}
        onPlaying={onPlaying}
        onRecordComplete={onRecordComplete}
      />
    );
  },
);

export default IosStreamView;
