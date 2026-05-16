import UIKit
import React
import MetalKit
import CoreVideo

@objcMembers
final class GuideStreamView: UIView {
    var onPlaying: RCTDirectEventBlock?
    var onRecordComplete: RCTDirectEventBlock?
    var reactTag: NSNumber?

    private let decoder: FFmpegDecoder
    private let metalView: MetalRenderView
    private let recorder: FrameRecorder
    private var currentPixelBuffer: CVPixelBuffer?
    private var streamStarted = false

    var rtspType: NSNumber = 1 {
        didSet {
            if !streamStarted {
                startStream()
            }
        }
    }

    override init(frame: CGRect) {
        guard let metalDevice = MTLCreateSystemDefaultDevice() else {
            fatalError("Metal not available")
        }

        metalView = MetalRenderView(frame: frame, device: metalDevice)
        recorder = FrameRecorder()
        decoder = FFmpegDecoder()

        super.init(frame: frame)

        backgroundColor = .black
        clipsToBounds = true
        metalView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        metalView.frame = bounds
        addSubview(metalView)

        recorder.onRecordComplete = { [weak self] path in
            self?.onRecordComplete?(["path": path])
        }
    }

    required init?(coder: NSCoder) {
        guard let metalDevice = MTLCreateSystemDefaultDevice() else {
            fatalError("Metal not available")
        }
        metalView = MetalRenderView(frame: .zero, device: metalDevice)
        recorder = FrameRecorder()
        decoder = FFmpegDecoder()
        super.init(coder: coder)
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        metalView.frame = bounds
    }

    deinit {
        stopStream()
    }

    override func didMoveToWindow() {
        if window != nil, !streamStarted {
            startStream()
        }
    }

    override func removeFromSuperview() {
        stopStream()
        super.removeFromSuperview()
    }

    private func startStream() {
        guard !streamStarted, window != nil else { return }

        let rtspUrl = "rtsp://192.168.42.1/preview"
        print("[GuideStreamView] Connecting to \(rtspUrl)")

        guard decoder.openRTSP(url: rtspUrl) else {
            print("[GuideStreamView] Failed to open RTSP stream")
            return
        }

        streamStarted = true

        decoder.onFrame = { [weak self] pixelBuffer, pts in
            guard let self = self else { return }
            self.currentPixelBuffer = pixelBuffer
            self.metalView.display(pixelBuffer: pixelBuffer)

            if self.recorder.isRecording {
                self.recorder.appendFrame(pixelBuffer: pixelBuffer, pts: pts)
            }

            if self.onPlaying != nil {
                self.onPlaying?([:])
            }
        }

        decoder.onError = { [weak self] error in
            print("[GuideStreamView] Decoder error: \(error)")
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                self?.restartStream()
            }
        }

        decoder.startDecoding()
    }

    private func restartStream() {
        stopStream()
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { [weak self] in
            self?.startStream()
        }
    }

    private func stopStream() {
        if recorder.isRecording {
            recorder.stopRecording()
        }
        decoder.stopDecoding()
        streamStarted = false
    }

    func startRecord(_ path: String) {
        guard let buf = currentPixelBuffer else {
            print("[GuideStreamView] No frame available for recording")
            return
        }
        let width = CVPixelBufferGetWidth(buf)
        let height = CVPixelBufferGetHeight(buf)
        let started = recorder.startRecording(path: path, width: width, height: height)
        print("[GuideStreamView] Recording started: \(started) -> \(path)")
    }

    func stopRecord() {
        recorder.stopRecording()
        print("[GuideStreamView] Recording stopped")
    }

    func snapShot(_ path: String) {
        guard let buf = currentPixelBuffer else {
            print("[GuideStreamView] No frame available for snapshot")
            return
        }
        let success = SnapshotCapture.savePixelBuffer(buf, to: path)
        print("[GuideStreamView] Snapshot saved: \(success) -> \(path)")
    }
}
