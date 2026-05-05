import CoreVideo
import UIKit

struct SnapshotCapture {
    static func savePixelBuffer(_ pixelBuffer: CVPixelBuffer, to path: String) -> Bool {
        let ciImage = CIImage(cvPixelBuffer: pixelBuffer)
        let context = CIContext()
        guard let cgImage = context.createCGImage(ciImage, from: ciImage.extent) else {
            return false
        }
        let image = UIImage(cgImage: cgImage)
        guard let data = image.pngData() else { return false }
        let url = URL(fileURLWithPath: path)
        do {
            try data.write(to: url)
            return true
        } catch {
            print("[SnapshotCapture] Write error: \(error)")
            return false
        }
    }
}
