package com.bullseye.app.exoplayer

import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class ExoPlayerViewManager : SimpleViewManager<ExoPlayerView>() {

    override fun getName() = "ExoPlayerView"

    override fun createViewInstance(context: ThemedReactContext): ExoPlayerView {
        return ExoPlayerView(context)
    }

    override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> {
        return mutableMapOf(
            "onPlaying" to mutableMapOf("registrationName" to "onPlaying"),
            "onError" to mutableMapOf("registrationName" to "onError")
        )
    }

    @ReactProp(name = "uri")
    fun setUri(view: ExoPlayerView, uri: String?) {
        uri?.let { view.startStream(it) }
    }

    override fun onDropViewInstance(view: ExoPlayerView) {
        view.releasePlayer()
        super.onDropViewInstance(view)
    }
}
