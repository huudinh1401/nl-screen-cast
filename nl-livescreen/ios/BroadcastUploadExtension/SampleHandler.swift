import ReplayKit
import SocketIO
import WebRTC
import QuartzCore

final class SampleHandler: RPBroadcastSampleHandler {
  private let fallbackAppGroupIdentifier = "group.com.namnhi993.nl-livescreen.broadcast"
  private let socketURLKey = "broadcast.socketURL"
  private let deviceCodeKey = "broadcast.deviceCode"
  private let appGroupKey = "broadcast.appGroupIdentifier"
  private let turnURLKey = "broadcast.turnURL"
  private let turnUsernameKey = "broadcast.turnUsername"
  private let turnCredentialKey = "broadcast.turnCredential"

  private var socketManager: SocketManager?
  private var socket: SocketIOClient?
  private var peerConnectionFactory: RTCPeerConnectionFactory?
  private var peerConnection: RTCPeerConnection?
  private var videoSource: RTCVideoSource?
  private var videoCapturer: RTCVideoCapturer?
  private var localVideoTrack: RTCVideoTrack?
  private var deviceCode: String?
  private var didNotifyStarted = false
  private var hasReceivedFirstFrame = false
  private var iceServers: [RTCIceServer] = [RTCIceServer(urlStrings: ["stun:stun.l.google.com:19302"])]

  override func broadcastStarted(withSetupInfo setupInfo: [String : NSObject]?) {
    RTCPeerConnectionFactory.initialize()

    let sharedDefaults = UserDefaults(suiteName: fallbackAppGroupIdentifier)
    let resolvedAppGroup = sharedDefaults?.string(forKey: appGroupKey) ?? fallbackAppGroupIdentifier

    guard let defaults = UserDefaults(suiteName: resolvedAppGroup),
          let socketURLString = defaults.string(forKey: socketURLKey),
          let deviceCode = defaults.string(forKey: deviceCodeKey),
          let socketURL = URL(string: socketURLString) else {
      finishBroadcastWithError(NSError(
        domain: "BroadcastUploadExtension",
        code: -1,
        userInfo: [NSLocalizedDescriptionKey: "Thiếu cấu hình broadcast hoặc App Group."]
      ))
      return
    }

    self.deviceCode = deviceCode
    configureIceServers(defaults: defaults)
    setupPeerConnectionFactory()
    connectSocket(socketURL: socketURL, deviceCode: deviceCode)
  }

  override func broadcastPaused() {}

  override func broadcastResumed() {}

  override func broadcastFinished() {
    notifyStreamStopped(reason: "ended")
    cleanup()
  }

  override func processSampleBuffer(_ sampleBuffer: CMSampleBuffer, with sampleBufferType: RPSampleBufferType) {
    guard sampleBufferType == .video,
          CMSampleBufferDataIsReady(sampleBuffer),
          let imageBuffer = CMSampleBufferGetImageBuffer(sampleBuffer),
          let videoSource else {
      return
    }

    let timeStampNs = Int64(CACurrentMediaTime() * 1_000_000_000)
    let rtcPixelBuffer = RTCCVPixelBuffer(pixelBuffer: imageBuffer)
    let frame = RTCVideoFrame(buffer: rtcPixelBuffer, rotation: ._0, timeStampNs: timeStampNs)
    videoSource.capturer(videoCapturer!, didCapture: frame)

    if !hasReceivedFirstFrame {
      hasReceivedFirstFrame = true
    }
  }

  private func setupPeerConnectionFactory() {
    RTCInitializeSSL()
    let encoderFactory = RTCDefaultVideoEncoderFactory()
    let decoderFactory = RTCDefaultVideoDecoderFactory()
    let factory = RTCPeerConnectionFactory(encoderFactory: encoderFactory, decoderFactory: decoderFactory)
    let source = factory.videoSource()
    let capturer = RTCVideoCapturer(delegate: source)
    let track = factory.videoTrack(with: source, trackId: "screen-video-track")

    peerConnectionFactory = factory
    videoSource = source
    videoCapturer = capturer
    localVideoTrack = track
  }

  private func connectSocket(socketURL: URL, deviceCode: String) {
    let manager = SocketManager(socketURL: socketURL, config: [
      .log(false),
      .compress,
      .reconnects(true),
      .reconnectAttempts(10),
      .reconnectWait(1),
      .path("/socket.io")
    ])

    let client = manager.defaultSocket

    client.on(clientEvent: .connect) { [weak self] _, _ in
      guard let self else { return }
      client.emit("mobile:register", ["deviceCode": deviceCode])
      if !self.didNotifyStarted {
        self.didNotifyStarted = true
        client.emit("mobile:stream_started", ["deviceCode": deviceCode])
      }
    }

    client.on("webrtc:offer") { [weak self] data, _ in
      self?.handleOfferEvent(data)
    }

    client.on("webrtc:ice_candidate") { [weak self] data, _ in
      self?.handleIceCandidateEvent(data)
    }

    client.on("mobile:stream_stopped") { [weak self] data, _ in
      guard let self else { return }
      let reason = (data.first as? [String: Any])?["reason"] as? String ?? "remote_stopped"
      self.notifyStreamStopped(reason: reason)
      self.cleanup()
      self.finishBroadcastWithError(NSError(
        domain: "BroadcastUploadExtension",
        code: -2,
        userInfo: [NSLocalizedDescriptionKey: "Luồng stream đã được kết thúc."]
      ))
    }

    client.connect()
    socketManager = manager
    socket = client
  }

  private func buildPeerConnection() -> RTCPeerConnection? {
    guard let factory = peerConnectionFactory else {
      return nil
    }

    let config = RTCConfiguration()
    config.sdpSemantics = .unifiedPlan
    config.iceServers = iceServers

    let constraints = RTCMediaConstraints(
      mandatoryConstraints: nil,
      optionalConstraints: ["DtlsSrtpKeyAgreement": "true"]
    )

    let connection = factory.peerConnection(with: config, constraints: constraints, delegate: self)
    if let localVideoTrack {
      _ = connection.add(localVideoTrack, streamIds: ["screen-stream"])
    }

    peerConnection = connection
    return connection
  }

  private func handleOfferEvent(_ data: [Any]) {
    guard let payload = data.first as? [String: Any],
          let sdp = payload["sdp"] as? [String: Any],
          let type = sdp["type"] as? String,
          let sdpString = sdp["sdp"] as? String,
          let connection = peerConnection ?? buildPeerConnection(),
          let offerType = RTCSdpType(type) else {
      return
    }

    let offer = RTCSessionDescription(type: offerType, sdp: sdpString)
    let constraints = RTCMediaConstraints(mandatoryConstraints: nil, optionalConstraints: nil)

    connection.setRemoteDescription(offer) { [weak self] error in
      guard let self, error == nil else { return }

      connection.answer(for: constraints) { answer, answerError in
        guard let answer, answerError == nil else { return }

        connection.setLocalDescription(answer) { localError in
          guard localError == nil else { return }

          self.socket?.emit("webrtc:answer", [
            "deviceCode": self.deviceCode ?? "",
            "sdp": [
              "type": answer.type.rawValueString,
              "sdp": answer.sdp
            ]
          ])
        }
      }
    }
  }

  private func handleIceCandidateEvent(_ data: [Any]) {
    guard let payload = data.first as? [String: Any],
          let candidate = payload["candidate"] as? [String: Any],
          let sdp = candidate["candidate"] as? String,
          let sdpMid = candidate["sdpMid"] as? String else {
      return
    }

    let sdpMLineIndex: Int32
    if let number = candidate["sdpMLineIndex"] as? NSNumber {
      sdpMLineIndex = number.int32Value
    } else if let value = candidate["sdpMLineIndex"] as? Int {
      sdpMLineIndex = Int32(value)
    } else if let value = candidate["sdpMLineIndex"] as? Int32 {
      sdpMLineIndex = value
    } else {
      return
    }

    let iceCandidate = RTCIceCandidate(sdp: sdp, sdpMLineIndex: sdpMLineIndex, sdpMid: sdpMid)
    peerConnection?.add(iceCandidate)
  }

  private func notifyStreamStopped(reason: String) {
    socket?.emit("mobile:stream_stopped", [
      "deviceCode": deviceCode ?? "",
      "reason": reason
    ])
  }

  private func cleanup() {
    peerConnection?.close()
    peerConnection = nil
    localVideoTrack = nil
    videoCapturer = nil
    videoSource = nil
    peerConnectionFactory = nil
    socket?.disconnect()
    socket = nil
    socketManager = nil
    didNotifyStarted = false
    hasReceivedFirstFrame = false
  }

  private func configureIceServers(defaults: UserDefaults) {
    var servers: [RTCIceServer] = [RTCIceServer(urlStrings: ["stun:stun.l.google.com:19302"])]
    let turnURL = defaults.string(forKey: turnURLKey)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    let turnUsername = defaults.string(forKey: turnUsernameKey)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    let turnCredential = defaults.string(forKey: turnCredentialKey)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""

    if !turnURL.isEmpty {
      servers.append(
        RTCIceServer(
          urlStrings: [turnURL],
          username: turnUsername,
          credential: turnCredential
        )
      )
    }

    iceServers = servers
  }
}

extension SampleHandler: RTCPeerConnectionDelegate {
  func peerConnection(_ peerConnection: RTCPeerConnection, didChange stateChanged: RTCSignalingState) {}
  func peerConnection(_ peerConnection: RTCPeerConnection, didAdd stream: RTCMediaStream) {}
  func peerConnection(_ peerConnection: RTCPeerConnection, didRemove stream: RTCMediaStream) {}
  func peerConnectionShouldNegotiate(_ peerConnection: RTCPeerConnection) {}
  func peerConnection(_ peerConnection: RTCPeerConnection, didChange newState: RTCIceConnectionState) {}
  func peerConnection(_ peerConnection: RTCPeerConnection, didChange newState: RTCIceGatheringState) {}
  func peerConnection(_ peerConnection: RTCPeerConnection, didGenerate candidate: RTCIceCandidate) {
    socket?.emit("webrtc:ice_candidate", [
      "deviceCode": deviceCode ?? "",
      "candidate": [
        "candidate": candidate.sdp,
        "sdpMid": candidate.sdpMid ?? "0",
        "sdpMLineIndex": Int(candidate.sdpMLineIndex)
      ]
    ])
  }
  func peerConnection(_ peerConnection: RTCPeerConnection, didRemove candidates: [RTCIceCandidate]) {}
  func peerConnection(_ peerConnection: RTCPeerConnection, didOpen dataChannel: RTCDataChannel) {}
  func peerConnection(_ peerConnection: RTCPeerConnection, didChange stateChanged: RTCPeerConnectionState) {}
  func peerConnection(_ peerConnection: RTCPeerConnection, didStartReceivingOn transceiver: RTCRtpTransceiver) {}
  func peerConnection(_ peerConnection: RTCPeerConnection, didAdd rtpReceiver: RTCRtpReceiver, streams: [RTCMediaStream]) {}
}

private extension RTCSdpType {
  init?(_ value: String) {
    switch value.lowercased() {
    case "offer":
      self = .offer
    case "answer":
      self = .answer
    case "pranswer":
      self = .prAnswer
    default:
      return nil
    }
  }

  var rawValueString: String {
    switch self {
    case .offer:
      return "offer"
    case .answer:
      return "answer"
    case .prAnswer:
      return "pranswer"
    @unknown default:
      return "offer"
    }
  }
}
