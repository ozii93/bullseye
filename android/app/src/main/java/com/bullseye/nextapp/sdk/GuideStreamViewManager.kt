package com.bullseye.nextapp.sdk

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class GuideStreamViewManager : SimpleViewManager<GuideStreamView>() {

    companion object {
        private const val COMMAND_START_RECORD = 1
        private const val COMMAND_STOP_RECORD = 2
        private const val COMMAND_SNAPSHOT = 3
    }

    override fun getName() = "GuideStreamView"

    override fun createViewInstance(context: ThemedReactContext): GuideStreamView {
        return GuideStreamView(context)
    }

    override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> {
        return mutableMapOf(
            "onPlaying" to mutableMapOf("registrationName" to "onPlaying"),
            "onRecordComplete" to mutableMapOf("registrationName" to "onRecordComplete")
        )
    }

    override fun getCommandsMap(): MutableMap<String, Int> {
        return mutableMapOf(
            "startRecord" to COMMAND_START_RECORD,
            "stopRecord" to COMMAND_STOP_RECORD,
            "snapShot" to COMMAND_SNAPSHOT
        )
    }

    override fun receiveCommand(view: GuideStreamView, commandId: Int, args: ReadableArray?) {
        when (commandId) {
            COMMAND_START_RECORD -> {
                val path = args?.getString(0) ?: return
                view.startRecord(path)
            }
            COMMAND_STOP_RECORD -> view.stopRecord()
            COMMAND_SNAPSHOT -> {
                val path = args?.getString(0) ?: return
                view.snapShot(path)
            }
        }
    }

    @ReactProp(name = "rtspType", defaultInt = 1)
    fun setRtspType(view: GuideStreamView, rtspType: Int) {
        view.startStream(rtspType)
    }

    override fun onDropViewInstance(view: GuideStreamView) {
        view.stopStream()
        super.onDropViewInstance(view)
    }
}
