import React
import UIKit

@objc(GuideStreamCommands)
final class GuideStreamCommands: NSObject, RCTBridgeModule {
    @objc var bridge: RCTBridge!

    static func moduleName() -> String {
        return "GuideStreamCommands"
    }

    static func requiresMainQueueSetup() -> Bool {
        return false
    }

    @objc(startRecord:path:)
    func startRecord(_ reactTag: NSNumber, path: String) {
        bridge?.uiManager?.addUIBlock { [weak self] uiManager, viewRegistry in
            guard let view = viewRegistry?[reactTag] as? GuideStreamView else {
                print("[GuideStreamCommands] View not found for tag: \(reactTag)")
                return
            }
            view.startRecord(path)
        }
    }

    @objc(stopRecord:)
    func stopRecord(_ reactTag: NSNumber) {
        bridge?.uiManager?.addUIBlock { uiManager, viewRegistry in
            guard let view = viewRegistry?[reactTag] as? GuideStreamView else { return }
            view.stopRecord()
        }
    }

    @objc(snapShot:path:)
    func snapShot(_ reactTag: NSNumber, path: String) {
        bridge?.uiManager?.addUIBlock { uiManager, viewRegistry in
            guard let view = viewRegistry?[reactTag] as? GuideStreamView else { return }
            view.snapShot(path)
        }
    }
}
