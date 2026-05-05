import AVFoundation
import CoreVideo
import UIKit

final class FrameRecorder {
    private var assetWriter: AVAssetWriter?
    private var assetWriterInput: AVAssetWriterInput?
    private var pixelBufferAdaptor: AVAssetWriterInputPixelBufferAdaptor?
    private var isRecording = false
    private var outputURL: URL?
    private var frameCount: Int64 = 0
    private var firstPts: Double?
    private var videoWidth: Int?
    private var videoHeight: Int?

    var onRecordComplete: ((String) -> Void)?

    func startRecording(path: String, width: Int, height: Int) -> Bool {
        stopRecording()

        videoWidth = width
        videoHeight = height
        outputURL = URL(fileURLWithPath: path)
        frameCount = 0
        firstPts = nil

        guard let url = outputURL else { return false }

        do {
            assetWriter = try AVAssetWriter(url: url, fileType: .mp4)

            let videoSettings: [String: Any] = [
                AVVideoCodecKey: AVVideoCodecType.h264,
                AVVideoWidthKey: width,
                AVVideoHeightKey: height,
                AVVideoCompressionPropertiesKey: [
                    AVVideoAverageBitRateKey: NSNumber(value: 2_000_000),
                    AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
                    AVVideoAllowFrameReorderingKey: false,
                ],
            ]

            assetWriterInput = AVAssetWriterInput(mediaType: .video, outputSettings: videoSettings)
            assetWriterInput?.expectsMediaDataInRealTime = true

            let sourceAttributes: [String: Any] = [
                kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
                kCVPixelBufferWidthKey as String: width,
                kCVPixelBufferHeightKey as String: height,
                kCVPixelBufferMetalCompatibilityKey as String: true,
            ]

            pixelBufferAdaptor = AVAssetWriterInputPixelBufferAdaptor(
                assetWriterInput: assetWriterInput!,
                sourcePixelBufferAttributes: sourceAttributes
            )

            guard let writer = assetWriter, let input = assetWriterInput else { return false }

            if writer.canAdd(input) {
                writer.add(input)
            } else {
                return false
            }

            writer.startWriting()
            writer.startSession(atSourceTime: .zero)
            isRecording = true
            return true
        } catch {
            print("[FrameRecorder] Failed to create AVAssetWriter: \(error)")
            return false
        }
    }

    func appendFrame(pixelBuffer: CVPixelBuffer, pts: Double) {
        guard isRecording,
              let adaptor = pixelBufferAdaptor,
              let input = assetWriterInput,
              let w = videoWidth, let h = videoHeight else { return }

        if !input.isReadyForMoreMediaData { return }

        if firstPts == nil { firstPts = pts }
        let timestamp = pts - (firstPts ?? pts)
        let time = CMTime(seconds: timestamp, preferredTimescale: 1000)

        var convertedBuffer: CVPixelBuffer?
        let attrs: [String: Any] = [
            kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
            kCVPixelBufferWidthKey as String: w,
            kCVPixelBufferHeightKey as String: h,
            kCVPixelBufferMetalCompatibilityKey as String: true,
        ]

        let status = CVPixelBufferCreate(kCFAllocatorDefault, w, h,
            kCVPixelFormatType_32BGRA, attrs as CFDictionary, &convertedBuffer)

        if status == kCVReturnSuccess, let buf = convertedBuffer {
            let ciImage = CIImage(cvPixelBuffer: pixelBuffer)
            let context = CIContext()
            context.render(ciImage, to: buf)

            adaptor.append(buf, withPresentationTime: time)
            frameCount += 1
        }
    }

    func stopRecording() {
        guard isRecording, let writer = assetWriter, let input = assetWriterInput else { return }
        isRecording = false

        input.markAsFinished()
        writer.finishWriting { [weak self] in
            guard let self = self, let url = self.outputURL else { return }
            DispatchQueue.main.async {
                self.onRecordComplete?(url.path)
            }
        }

        assetWriter = nil
        assetWriterInput = nil
        pixelBufferAdaptor = nil
    }
}
