#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(ScreenCaptureModule, NSObject)

RCT_EXTERN_METHOD(
  prepareBroadcast:(NSString *)socketURL
  deviceCode:(NSString *)deviceCode
  appGroupIdentifier:(NSString *)appGroupIdentifier
  preferredExtension:(NSString *)preferredExtension
  turnURL:(NSString *)turnURL
  turnUsername:(NSString *)turnUsername
  turnCredential:(NSString *)turnCredential
  resolver:(RCTPromiseResolveBlock)resolver
  rejecter:(RCTPromiseRejectBlock)rejecter
)

RCT_EXTERN_METHOD(
  showBroadcastPicker:(NSString *)preferredExtension
  resolver:(RCTPromiseResolveBlock)resolver
  rejecter:(RCTPromiseRejectBlock)rejecter
)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

@end
