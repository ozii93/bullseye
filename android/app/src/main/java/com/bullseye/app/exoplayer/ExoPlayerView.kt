package com.bullseye.app.exoplayer

import android.content.Context
import android.net.Uri
import android.os.SystemClock
import android.widget.FrameLayout
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.RCTEventEmitter

class ExoPlayerView(context: Context) : FrameLayout(context) {

    private var player: ExoPlayer? = null
    private var playerView: PlayerView? = null
    private var connectStartMs: Long = 0

    fun startStream(uri: String) {
        releasePlayer()
        connectStartMs = SystemClock.elapsedRealtime()

        val loadControl = DefaultLoadControl.Builder()
            .setBufferDurationsMs(50, 2000, 50, 100)
            .build()

        val exoPlayer = ExoPlayer.Builder(context)
            .setLoadControl(loadControl)
            .build()

        exoPlayer.trackSelectionParameters = exoPlayer.trackSelectionParameters
            .buildUpon()
            .setTrackTypeDisabled(C.TRACK_TYPE_AUDIO, true)
            .build()

        exoPlayer.addListener(object : Player.Listener {
            override fun onPlaybackStateChanged(state: Int) {
                if (state == Player.STATE_READY) {
                    val elapsed = SystemClock.elapsedRealtime() - connectStartMs
                    android.util.Log.d("ExoPlayer", "READY in ${elapsed}ms: $uri")
                    emitEvent("onPlaying")
                }
            }

            override fun onPlayerError(error: PlaybackException) {
                android.util.Log.e("ExoPlayer", "Stream error: ${error.localizedMessage}")
                emitEvent("onError", Arguments.createMap().apply {
                    putString("message", error.localizedMessage ?: "Unknown error")
                })
            }
        })

        val mediaItem = MediaItem.Builder()
            .setUri(Uri.parse(uri))
            .setLiveConfiguration(
                MediaItem.LiveConfiguration.Builder()
                    .setTargetOffsetMs(0L)
                    .setMinOffsetMs(0L)
                    .setMaxOffsetMs(0L)
                    .build()
            )
            .build()

        android.util.Log.d("ExoPlayer", "Connecting to: $uri")
        exoPlayer.setMediaItem(mediaItem)
        exoPlayer.playWhenReady = true
        exoPlayer.prepare()

        player = exoPlayer

        playerView = PlayerView(context).apply {
            this.player = exoPlayer
            useController = false
            resizeMode = AspectRatioFrameLayout.RESIZE_MODE_ZOOM
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
        }

        removeAllViews()
        addView(playerView)
    }

    private fun emitEvent(name: String, data: WritableMap? = null) {
        val reactContext = context as? ThemedReactContext ?: return
        reactContext
            .getJSModule(RCTEventEmitter::class.java)
            ?.receiveEvent(id, name, data ?: Arguments.createMap())
    }

    fun releasePlayer() {
        playerView?.player = null
        playerView?.let { removeView(it) }
        playerView = null
        player?.release()
        player = null
    }
}
