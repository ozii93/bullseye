#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(GuideStreamViewManager, RCTViewManager)
RCT_EXPORT_VIEW_PROPERTY(rtspType, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(onPlaying, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onRecordComplete, RCTDirectEventBlock)
@end
