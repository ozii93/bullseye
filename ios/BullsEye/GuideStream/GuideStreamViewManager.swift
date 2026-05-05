import React
import UIKit

@objc(GuideStreamViewManager)
final class GuideStreamViewManager: RCTViewManager {
    override func view() -> UIView! {
        return GuideStreamView()
    }

    override class func requiresMainQueueSetup() -> Bool {
        return true
    }
}
