import Foundation
import ReplayKit
import React
import UIKit

@objc(ScreenCaptureModule)
class ScreenCaptureModule: NSObject {
  private let fallbackAppGroupIdentifier = "group.com.namnhi993.nl-livescreen.broadcast"
  private let socketURLKey = "broadcast.socketURL"
  private let deviceCodeKey = "broadcast.deviceCode"
  private let appGroupKey = "broadcast.appGroupIdentifier"
  private let extensionBundleKey = "broadcast.extensionBundleIdentifier"
  private let turnURLKey = "broadcast.turnURL"
  private let turnUsernameKey = "broadcast.turnUsername"
  private let turnCredentialKey = "broadcast.turnCredential"
  private var pickerView: RPSystemBroadcastPickerView?

  @objc
  static func requiresMainQueueSetup() -> Bool {
    true
  }

  @objc(prepareBroadcast:deviceCode:appGroupIdentifier:preferredExtension:turnURL:turnUsername:turnCredential:resolver:rejecter:)
  func prepareBroadcast(
    _ socketURL: String,
    deviceCode: String,
    appGroupIdentifier: String,
    preferredExtension: String,
    turnURL: String,
    turnUsername: String,
    turnCredential: String,
    resolver: RCTPromiseResolveBlock,
    rejecter: RCTPromiseRejectBlock
  ) {
    let trimmedSocketURL = socketURL.trimmingCharacters(in: .whitespacesAndNewlines)
    let trimmedDeviceCode = deviceCode.trimmingCharacters(in: .whitespacesAndNewlines)
    let resolvedAppGroup = appGroupIdentifier.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
      ? fallbackAppGroupIdentifier
      : appGroupIdentifier.trimmingCharacters(in: .whitespacesAndNewlines)

    guard !trimmedSocketURL.isEmpty, !trimmedDeviceCode.isEmpty else {
      rejecter("ERR_INVALID_BROADCAST_CONFIG", "Thiếu socketURL hoặc deviceCode để bắt đầu broadcast.", nil)
      return
    }

    guard let sharedDefaults = UserDefaults(suiteName: resolvedAppGroup) else {
      rejecter("ERR_APP_GROUP_UNAVAILABLE", "Không thể truy cập App Group để chuẩn bị broadcast.", nil)
      return
    }

    sharedDefaults.set(trimmedSocketURL, forKey: socketURLKey)
    sharedDefaults.set(trimmedDeviceCode, forKey: deviceCodeKey)
    sharedDefaults.set(resolvedAppGroup, forKey: appGroupKey)
    sharedDefaults.set(preferredExtension, forKey: extensionBundleKey)
    sharedDefaults.set(turnURL.trimmingCharacters(in: .whitespacesAndNewlines), forKey: turnURLKey)
    sharedDefaults.set(turnUsername.trimmingCharacters(in: .whitespacesAndNewlines), forKey: turnUsernameKey)
    sharedDefaults.set(turnCredential.trimmingCharacters(in: .whitespacesAndNewlines), forKey: turnCredentialKey)
    sharedDefaults.synchronize()

    resolver([
      "socketURL": trimmedSocketURL,
      "deviceCode": trimmedDeviceCode,
      "appGroupIdentifier": resolvedAppGroup,
      "preferredExtension": preferredExtension,
      "turnURL": turnURL,
      "turnUsername": turnUsername
    ])
  }

  @objc(showBroadcastPicker:resolver:rejecter:)
  func showBroadcastPicker(
    _ preferredExtension: String,
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      guard let scene = UIApplication.shared.connectedScenes
        .compactMap({ $0 as? UIWindowScene })
        .first(where: { $0.activationState == .foregroundActive }),
            let window = scene.windows.first(where: \.isKeyWindow) ?? scene.windows.first else {
        rejecter("ERR_WINDOW_NOT_FOUND", "Không tìm thấy cửa sổ đang hoạt động để mở broadcast picker.", nil)
        return
      }

      let picker = RPSystemBroadcastPickerView(frame: CGRect(x: -1000, y: -1000, width: 60, height: 60))
      picker.preferredExtension = preferredExtension
      picker.showsMicrophoneButton = false

      window.addSubview(picker)
      self.pickerView = picker

      guard let button = picker.subviews.compactMap({ $0 as? UIButton }).first else {
        picker.removeFromSuperview()
        self.pickerView = nil
        rejecter("ERR_PICKER_BUTTON_NOT_FOUND", "Không tìm thấy nút hệ thống để mở broadcast picker.", nil)
        return
      }

      DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
        button.sendActions(for: .touchUpInside)
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
          picker.removeFromSuperview()
          self.pickerView = nil
        }
        resolver([
          "opened": true,
          "preferredExtension": preferredExtension
        ])
      }
    }
  }
}
