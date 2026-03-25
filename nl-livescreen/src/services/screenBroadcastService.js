import { NativeModules } from 'react-native';
import { SOCKET_URL, TURN_CREDENTIAL, TURN_URL, TURN_USERNAME } from '../config/network';

const { ScreenCaptureModule } = NativeModules;

const APP_GROUP_IDENTIFIER = 'group.com.namnhi993.nl-livescreen.broadcast';
const PREFERRED_EXTENSION = 'com.namnhi993.nl-livescreen.BroadcastUploadExtension';

export const screenBroadcastService = {
  async prepare(deviceCode) {
    if (!ScreenCaptureModule?.prepareBroadcast) {
      throw new Error('ScreenCaptureModule.prepareBroadcast chưa sẵn sàng');
    }

    return ScreenCaptureModule.prepareBroadcast(
      SOCKET_URL,
      deviceCode,
      APP_GROUP_IDENTIFIER,
      PREFERRED_EXTENSION,
      TURN_URL,
      TURN_USERNAME,
      TURN_CREDENTIAL
    );
  },

  async showPicker() {
    if (!ScreenCaptureModule?.showBroadcastPicker) {
      throw new Error('ScreenCaptureModule.showBroadcastPicker chưa sẵn sàng');
    }

    return ScreenCaptureModule.showBroadcastPicker(PREFERRED_EXTENSION);
  },

  async startFullScreenBroadcast(deviceCode) {
    await this.prepare(deviceCode);
    return this.showPicker();
  },

  constants: {
    APP_GROUP_IDENTIFIER,
    PREFERRED_EXTENSION,
    SOCKET_URL,
    TURN_URL,
    TURN_USERNAME,
    TURN_CREDENTIAL
  }
};
