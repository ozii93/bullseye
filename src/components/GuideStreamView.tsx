import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  requireNativeComponent,
  StyleProp,
  ViewStyle,
  UIManager,
  findNodeHandle,
} from 'react-native';

interface GuideStreamViewProps {
  rtspType?: number;
  style?: StyleProp<ViewStyle>;
  onPlaying?: () => void;
  onRecordComplete?: (event: { nativeEvent: { path: string } }) => void;
}

export interface GuideStreamViewRef {
  startRecord: (path: string) => void;
  stopRecord: () => void;
}

const RCTGuideStreamView = requireNativeComponent<GuideStreamViewProps>('GuideStreamView');

const GuideStreamView = forwardRef<GuideStreamViewRef, GuideStreamViewProps>(
  ({ rtspType = 1, style, onPlaying, onRecordComplete }, ref) => {
    const nativeRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      startRecord(path: string) {
        const node = findNodeHandle(nativeRef.current);
        if (node != null) {
          UIManager.dispatchViewManagerCommand(
            node,
            (UIManager.getViewManagerConfig?.('GuideStreamView') as any)
              ?.Commands?.startRecord ?? 'startRecord',
            [path],
          );
        }
      },
      stopRecord() {
        const node = findNodeHandle(nativeRef.current);
        if (node != null) {
          UIManager.dispatchViewManagerCommand(
            node,
            (UIManager.getViewManagerConfig?.('GuideStreamView') as any)
              ?.Commands?.stopRecord ?? 'stopRecord',
            [],
          );
        }
      },
    }));

    return (
      <RCTGuideStreamView
        ref={nativeRef}
        rtspType={rtspType}
        style={style}
        onPlaying={onPlaying}
        onRecordComplete={onRecordComplete}
      />
    );
  },
);

export default GuideStreamView;
