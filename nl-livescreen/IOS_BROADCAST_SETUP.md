# iOS Full-Screen Broadcast Setup

Muc tieu: stream toan bo man hinh iPhone/iPad, bao gom ca app khac, len web.

## 1. Tai sao code cu chua du

`ScreenCaptureModule.startScreenCapture()` dang dung `RPScreenRecorder.startCapture`.
API nay chi phu hop cho in-app capture khi app dang foreground.

Muon stream toan bo he thong, ban bat buoc phai dung:

- `ReplayKit Broadcast Upload Extension`
- user bam bat dau share qua system broadcast picker

## 2. Code da duoc scaffold san

Da tao san:

- `ios/BroadcastUploadExtension/SampleHandler.swift`
- `ios/BroadcastUploadExtension/Info.plist`
- `ios/BroadcastUploadExtension/BroadcastUploadExtension.entitlements`
- `src/services/screenBroadcastService.js`

Va bo sung:

- `ScreenCaptureModule.prepareBroadcast(...)`
- `ScreenCaptureModule.showBroadcastPicker(...)`

## 3. Viec ban phai lam trong Xcode

1. Mo `nl-livescreen/ios/nllivescreen.xcworkspace`
2. File > New > Target
3. Chon `Broadcast Upload Extension`
4. Dat ten target: `BroadcastUploadExtension`
5. Product Bundle Identifier:
   `com.namnhi993.nl-livescreen.BroadcastUploadExtension`
6. Huy tick "Include UI Extension" neu Xcode hoi

## 4. Gan file scaffold vao target moi

Trong target `BroadcastUploadExtension`, thay file mac dinh bang:

- `ios/BroadcastUploadExtension/SampleHandler.swift`
- `ios/BroadcastUploadExtension/Info.plist`
- `ios/BroadcastUploadExtension/BroadcastUploadExtension.entitlements`

## 5. Bat App Group cho ca 2 target

App target `nllivescreen`:
- Signing & Capabilities
- them `App Groups`
- add `group.com.namnhi993.nl-livescreen.broadcast`

Extension target `BroadcastUploadExtension`:
- Signing & Capabilities
- them `App Groups`
- add cung group tren

## 6. Podfile

Sau khi co target extension trong Xcode, update Podfile de extension dung duoc Socket.IO:

```ruby
target 'BroadcastUploadExtension' do
  inherit! :search_paths
  pod 'Socket.IO-Client-Swift', '~> 16.1.0'
end
```

Sau do chay:

```bash
cd nl-livescreen/ios
pod install
```

## 7. Cach test

1. Chay app iOS tren device that
2. Dang nhap / mo man HomeScreen
3. Nhan `Chia se toan man hinh`
4. iOS se mo system broadcast picker
5. Chon `NL Broadcast`
6. Bat dau broadcast
7. Extension se gui frame qua socket ve backend

## 8. Trang thai hien tai

Ban scaffold nay se cho phep:

- bat dau full-screen broadcast dung ReplayKit extension
- gui frame JPEG base64 qua socket hien co

No van la buoc tam thoi. De production:

- thay base64 frame bang WebRTC / HLS / SFU pipeline
- co signaling rieng
- toi uu fps, bitrate, reconnect, audio

## 9. Gioi han iOS

- Khong the tu dong bat full-screen share ma khong co thao tac user
- User phai tu bam system picker
- App Store rat nhay voi hanh vi ghi man hinh
