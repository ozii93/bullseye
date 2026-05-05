#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(GuideStreamCommands, NSObject)
RCT_EXTERN_METHOD(startRecord:(nonnull NSNumber *)reactTag path:(nonnull NSString *)path)
RCT_EXTERN_METHOD(stopRecord:(nonnull NSNumber *)reactTag)
RCT_EXTERN_METHOD(snapShot:(nonnull NSNumber *)reactTag path:(nonnull NSString *)path)
@end
