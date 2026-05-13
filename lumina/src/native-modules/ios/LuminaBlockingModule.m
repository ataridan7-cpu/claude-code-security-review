#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(LuminaBlocking, NSObject)

RCT_EXTERN_METHOD(presentAppPicker:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(registerLimitForSelection:(NSString *)selectionData
                  goalId:(NSString *)goalId
                  dailyLimitSeconds:(double)dailyLimitSeconds
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(removeLimitForGoal:(NSString *)goalId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(shieldAppsForGoal:(NSString *)goalId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(removeShield:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
