import MetalKit
import CoreVideo

final class MetalRenderView: MTKView {
    private var commandQueue: MTLCommandQueue?
    private var computePipeline: MTLComputePipelineState?
    private var textureCache: CVMetalTextureCache?
    private var currentDrawable: CAMetalDrawable?
    private var outTexture: MTLTexture?
    private var videoWidth: Int = 0
    private var videoHeight: Int = 0

    private let metalDevice: MTLDevice

    init(frame: CGRect, device: MTLDevice) {
        self.metalDevice = device
        super.init(frame: frame, device: device)
        setupMetal()
    }

    required init(coder: NSCoder) {
        self.metalDevice = MTLCreateSystemDefaultDevice()!
        super.init(coder: coder)
        self.device = metalDevice
        setupMetal()
    }

    private func setupMetal() {
        framebufferOnly = false
        clearColor = MTLClearColor(red: 0, green: 0, blue: 0, alpha: 1)
        colorPixelFormat = .bgra8Unorm
        isPaused = true
        enableSetNeedsDisplay = true

        commandQueue = metalDevice.makeCommandQueue()

        if CVMetalTextureCacheCreate(kCFAllocatorDefault, nil, metalDevice, nil, &textureCache) != kCVReturnSuccess {
            print("[MetalRenderView] Failed to create texture cache")
        }

        let source = """
        #include <metal_stdlib>
        using namespace metal;

        kernel void nv12ToRGB(
            texture2d<float, access::read> luma [[texture(0)]],
            texture2d<float, access::read> chroma [[texture(1)]],
            texture2d<float, access::write> out [[texture(2)]],
            uint2 gid [[thread_position_in_grid]])
        {
            float y = luma.read(gid).r;
            float2 uv = chroma.read(uint2(gid.x / 2, gid.y / 2)).rg;

            float r = y + 1.402 * (uv.y - 0.5);
            float g = y - 0.344136 * (uv.x - 0.5) - 0.714136 * (uv.y - 0.5);
            float b = y + 1.772 * (uv.x - 0.5);

            out.write(float4(max(r, 0.0), max(g, 0.0), max(b, 0.0), 1.0), gid);
        }
        """

        do {
            let library = try metalDevice.makeLibrary(source: source, options: nil)
            if let function = library.makeFunction(name: "nv12ToRGB") {
                computePipeline = try metalDevice.makeComputePipelineState(function: function)
            }
        } catch {
            print("[MetalRenderView] Shader compile error: \(error)")
        }
    }

    func display(pixelBuffer: CVPixelBuffer) {
        guard let drawable = currentDrawable ?? nextDrawable else {
            draw()
            return
        }
        currentDrawable = drawable

        let width = CVPixelBufferGetWidth(pixelBuffer)
        let height = CVPixelBufferGetHeight(pixelBuffer)

        videoWidth = width
        videoHeight = height

        guard let cache = textureCache,
              let pipeline = computePipeline,
              let queue = commandQueue else {
            drawable.present()
            return
        }

        var lumaTex: CVMetalTexture?
        var chromaTex: CVMetalTexture?

        let lumaRet = CVMetalTextureCacheCreateTextureFromImage(
            kCFAllocatorDefault, cache, pixelBuffer, nil, .r8Unorm,
            width, height, 0, &lumaTex
        )

        let chromaRet = CVMetalTextureCacheCreateTextureFromImage(
            kCFAllocatorDefault, cache, pixelBuffer, nil, .rg8Unorm,
            width / 2, height / 2, 1, &chromaTex
        )

        guard lumaRet == kCVReturnSuccess, chromaRet == kCVReturnSuccess,
              let luma = lumaTex.flatMap({ CVMetalTextureGetTexture($0) }),
              let chroma = chromaTex.flatMap({ CVMetalTextureGetTexture($0) }) else {
            drawable.present()
            return
        }

        let outWidth = drawable.texture.width
        let outHeight = drawable.texture.height
        let outTexDesc = MTLTextureDescriptor.texture2DDescriptor(
            pixelFormat: .bgra8Unorm, width: outWidth, height: outHeight, mipmapped: false
        )
        outTexDesc.usage = [.shaderRead, .shaderWrite]
        outTexture = metalDevice.makeTexture(descriptor: outTexDesc)

        guard let out = outTexture else {
            drawable.present()
            return
        }

        guard let commandBuffer = queue.makeCommandBuffer(),
              let encoder = commandBuffer.makeComputeCommandEncoder() else {
            drawable.present()
            return
        }

        encoder.setComputePipelineState(pipeline)
        encoder.setTexture(luma, index: 0)
        encoder.setTexture(chroma, index: 1)
        encoder.setTexture(out, index: 2)

        let threadGroupSize = MTLSize(width: 16, height: 16, depth: 1)
        let threadGroups = MTLSize(
            width: (outWidth + 15) / 16,
            height: (outHeight + 15) / 16,
            depth: 1
        )
        encoder.dispatchThreadgroups(threadGroups, threadsPerThreadgroup: threadGroupSize)
        encoder.endEncoding()

        guard let blitEncoder = commandBuffer.makeBlitCommandEncoder() else {
            drawable.present()
            return
        }
        blitEncoder.copy(from: out, to: drawable.texture)
        blitEncoder.endEncoding()

        commandBuffer.present(drawable)
        commandBuffer.commit()
        commandBuffer.waitUntilScheduled()

        currentDrawable = nil
    }

    func snapshot(pixelBuffer: CVPixelBuffer) -> UIImage? {
        let ciImage = CIImage(cvPixelBuffer: pixelBuffer)
        let context = CIContext(mtlDevice: metalDevice)
        if let cgImage = context.createCGImage(ciImage, from: ciImage.extent) {
            return UIImage(cgImage: cgImage)
        }
        return nil
    }

    override func draw(_ rect: CGRect) {
        currentDrawable = nextDrawable
    }
}
