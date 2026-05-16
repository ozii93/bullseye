import Foundation
import CoreVideo
import CoreImage
import VideoToolbox
import UIKit
import Darwin

final class FFmpegDecoder {
    private var formatCtx: UnsafeMutablePointer<AVFormatContext>?
    private var codecCtx: UnsafeMutablePointer<AVCodecContext>?
    private var videoStreamIndex: Int32 = -1
    private var pkt = av_packet_alloc()
    private var frame: UnsafeMutablePointer<AVFrame>?
    private var decoderQueue = DispatchQueue(label: "com.bullseye.ffmpeg.decoder", qos: .userInitiated)
    private var running = false
    private var hwDeviceCtx: UnsafeMutablePointer<AVBufferRef>?

    var onFrame: ((CVPixelBuffer, Double) -> Void)?
    var onError: ((String) -> Void)?

    func openRTSP(url: String) -> Bool {
        if pkt == nil {
            pkt = av_packet_alloc()
        }

        avformat_network_init()

        var ctx: UnsafeMutablePointer<AVFormatContext>?
        var opts: OpaquePointer?
        let ret = avformat_open_input(&ctx, url, nil, &opts)
        if ret < 0 {
            let err = avErrorString(ret)
            onError?("avformat_open_input failed: \(err)")
            return false
        }
        formatCtx = ctx

        if avformat_find_stream_info(ctx, nil) < 0 {
            onError?("avformat_find_stream_info failed")
            return false
        }

        guard let fmtCtx = formatCtx else { return false }

        for i in 0..<Int(fmtCtx.pointee.nb_streams) {
            let stream = fmtCtx.pointee.streams[i]!
            if stream.pointee.codecpar.pointee.codec_type == AVMEDIA_TYPE_VIDEO {
                videoStreamIndex = Int32(i)
                break
            }
        }

        if videoStreamIndex < 0 {
            onError?("No video stream found")
            return false
        }

        let codecPar = fmtCtx.pointee.streams[Int(videoStreamIndex)]!.pointee.codecpar

        guard let decoder = avcodec_find_decoder(codecPar.pointee.codec_id) else {
            onError?("Decoder not found")
            return false
        }

        codecCtx = avcodec_alloc_context3(decoder)
        guard let cctx = codecCtx else { return false }
        avcodec_parameters_to_context(cctx, codecPar)

        let hwType = av_hwdevice_find_type_by_name("videotoolbox")
        if hwType != AV_HWDEVICE_TYPE_NONE {
            let ret = av_hwdevice_ctx_create(&hwDeviceCtx, hwType, nil, nil, 0)
            if ret >= 0 {
                cctx.pointee.hw_device_ctx = av_buffer_ref(hwDeviceCtx)
                cctx.pointee.pix_fmt = AV_PIX_FMT_VIDEOTOOLBOX
            }
        }

        if avcodec_open2(cctx, decoder, nil) < 0 {
            onError?("avcodec_open2 failed")
            return false
        }

        frame = av_frame_alloc()
        return true
    }

    func startDecoding() {
        guard let fmtCtx = formatCtx, let cctx = codecCtx, let frm = frame else { return }
        running = true

        decoderQueue.async { [weak self] in
            guard let self = self else { return }

            while self.running {
                let readRet = av_read_frame(fmtCtx, self.pkt)
                if readRet < 0 {
                    if readRet == AVERROR_EOF {
                        self.onError?("Stream ended")
                    } else {
                        self.onError?("av_read_frame: \(self.avErrorString(readRet))")
                    }
                    break
                }

                guard let pkt = self.pkt else { break }
                if pkt.pointee.stream_index != self.videoStreamIndex {
                    av_packet_unref(pkt)
                    continue
                }

                let sendRet = avcodec_send_packet(cctx, pkt)
                av_packet_unref(pkt)

                if sendRet < 0 { continue }

                while true {
                    let recvRet = avcodec_receive_frame(cctx, frm)
                    if recvRet == -EAGAIN || recvRet == AVERROR_EOF {
                        break
                    }
                    if recvRet < 0 { break }

                    if frm.pointee.format == AV_PIX_FMT_VIDEOTOOLBOX,
                       let pixBuf = frm.pointee.data.3 {
                        let cvBuf = Unmanaged<CVPixelBuffer>.fromOpaque(UnsafeRawPointer(pixBuf)).takeUnretainedValue()

                        let pts = frm.pointee.pts
                        let timebase = fmtCtx.pointee.streams[Int(self.videoStreamIndex)]!.pointee.time_base
                        let seconds = Double(pts) * av_q2d(timebase)

                        DispatchQueue.main.async {
                            self.onFrame?(cvBuf, seconds)
                        }
                    }
                    av_frame_unref(frm)
                }
            }
        }
    }

    func stopDecoding() {
        running = false
        decoderQueue.sync {}

        if let cctx = codecCtx {
            avcodec_close(cctx)
            avcodec_free_context(&codecCtx)
        }
        if let frm = frame {
            av_frame_free(&frame)
        }
        if let pkt = pkt {
            av_packet_free(&pkt)
        }
        if formatCtx != nil {
            avformat_close_input(&formatCtx)
        }
        if var hwCtx = hwDeviceCtx {
            av_buffer_unref(&hwCtx)
            hwDeviceCtx = nil
        }
        avformat_network_deinit()
    }

    func snapshotCurrentFrame(_ pixBuf: CVPixelBuffer) -> UIImage? {
        let ciImage = CIImage(cvPixelBuffer: pixBuf)
        let context = CIContext()
        if let cgImage = context.createCGImage(ciImage, from: ciImage.extent) {
            return UIImage(cgImage: cgImage)
        }
        return nil
    }

    func saveSnapshot(_ pixBuf: CVPixelBuffer, to path: String) -> Bool {
        guard let image = snapshotCurrentFrame(pixBuf) else { return false }
        guard let data = image.pngData() else { return false }
        let url = URL(fileURLWithPath: path)
        do {
            try data.write(to: url)
            return true
        } catch {
            return false
        }
    }

    private func avErrorString(_ code: Int32) -> String {
        var buf = [CChar](repeating: 0, count: 256)
        av_strerror(code, &buf, 256)
        return String(cString: buf)
    }
}
