package com.bullseye.nextapp.sdk

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.SurfaceTexture
import android.os.Handler
import android.os.HandlerThread
import android.util.Log
import android.view.TextureView
import com.guide.guidelibrary.GuideAnalyser
import com.guide.guidelibrary.GuideCameraSurface
import com.guide.guidelibrary.GuideFileParam
import com.guide.guidelibrary.GuideMedia
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event

class GuideStreamView(context: Context) : TextureView(context), TextureView.SurfaceTextureListener, GuideCameraSurface {

    companion object {
        private const val TAG = "GuideStreamView"
        const val COMMAND_START_RECORD = 1
        const val COMMAND_STOP_RECORD = 2
        const val COMMAND_SNAPSHOT = 3
    }

    private var guideMedia: GuideMedia? = null
    private var started = false
    private var isRecording = false
    private var currentRecordPath: String? = null
    private var videoWidth = 0
    private var videoHeight = 0
    private var yData: ByteArray? = null
    private var uData: ByteArray? = null
    private var vData: ByteArray? = null
    private var currentBitmap: Bitmap? = null
    private val paint = Paint()
    private val frameLock = Any()
    private var renderThread: HandlerThread? = null
    private var renderHandler: Handler? = null

    init {
        surfaceTextureListener = this
        paint.isFilterBitmap = false
    }

    fun startStream(rtspType: Int) {
        Log.d(TAG, "===> STARTING STREAM - VERSION FIX 4 <===")
        if (started) return
        started = true

        try {
            renderThread = HandlerThread("GuideRender").apply { start() }
            renderHandler = Handler(renderThread!!.looper)

            Log.d(TAG, "Initializing GuideMedia...")
            guideMedia = GuideMedia()
            val result = guideMedia!!.OpenStream(rtspType, this)
            Log.d(TAG, "OpenStream result=$result")
        } catch (e: Throwable) {
            Log.e(TAG, "CRITICAL ERROR during startStream: ${e.message}")
            e.printStackTrace()
            started = false
        }
    }

    fun stopStream() {
        if (isRecording) stopRecord()
        started = false
        guideMedia?.CloseStream()
        guideMedia = null
        renderHandler?.removeCallbacksAndMessages(null)
        renderThread?.quitSafely()
        renderThread = null
        renderHandler = null
        currentBitmap?.recycle()
        currentBitmap = null
    }

    fun startRecord(path: String) {
        if (isRecording || guideMedia == null) return
        isRecording = true
        currentRecordPath = path
        val result = guideMedia!!.ScopeStart(path, GuideMedia.ScopeType.Y8Only)
        Log.d(TAG, "ScopeStart path=$path result=$result")
    }

    fun stopRecord() {
        if (!isRecording || guideMedia == null) return
        isRecording = false
        guideMedia!!.ScopeStopFinish()
        Log.d(TAG, "ScopeStopFinish path=$currentRecordPath")
        currentRecordPath?.let { path ->
            val event = Arguments.createMap().apply { putString("path", path) }
            emitEvent("onRecordComplete", event)
        }
        currentRecordPath = null
    }

    fun snapShot(path: String) {
        synchronized(frameLock) {
            val bmp = currentBitmap
            if (bmp == null || bmp.isRecycled) {
                Log.e(TAG, "snapShot failed: currentBitmap is null or recycled")
                return
            }
            
            // Create a copy to save on a background thread to avoid stuttering
            val config = bmp.config ?: Bitmap.Config.ARGB_8888
            val copy = bmp.copy(config, false)
            renderHandler?.post {
                try {
                    val file = java.io.File(path)
                    val out = java.io.FileOutputStream(file)
                    copy.compress(Bitmap.CompressFormat.PNG, 100, out)
                    out.flush()
                    out.close()
                    copy.recycle()
                    Log.d(TAG, "✅ SNAPSHOT SAVED TO: $path")
                } catch (e: Exception) {
                    Log.e(TAG, "❌ snapShot error: ${e.message}")
                }
            }
        }
    }

    // TextureView.SurfaceTextureListener
    override fun onSurfaceTextureAvailable(surface: SurfaceTexture, width: Int, height: Int) {
        Log.d(TAG, "onSurfaceTextureAvailable ${width}x${height}")
    }

    override fun onSurfaceTextureSizeChanged(surface: SurfaceTexture, width: Int, height: Int) {}
    override fun onSurfaceTextureDestroyed(surface: SurfaceTexture): Boolean {
        return true
    }
    override fun onSurfaceTextureUpdated(surface: SurfaceTexture) {}

    // GuideCameraSurface callbacks
    private var yBuffer: ByteArray? = null
    private var uBuffer: ByteArray? = null
    private var vBuffer: ByteArray? = null
    private var pixelBuffer: IntArray? = null

    override fun onY8CameraDataTreatYUVDataArrived(width: Int, height: Int, y: ByteArray, u: ByteArray, v: ByteArray) {
        try {
            synchronized(frameLock) {
                if (width <= 0 || height <= 0) return
                
                if (width != videoWidth || height != videoHeight) {
                    Log.d(TAG, "New Resolution: ${width}x${height}")
                    videoWidth = width
                    videoHeight = height
                    currentBitmap?.recycle()
                    currentBitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
                    pixelBuffer = IntArray(width * height)
                }
                
                // Reuse buffers instead of creating new ones
                if (yBuffer?.size != y.size) yBuffer = ByteArray(y.size)
                if (uBuffer?.size != u.size) uBuffer = ByteArray(u.size)
                if (vBuffer?.size != v.size) vBuffer = ByteArray(v.size)
                
                System.arraycopy(y, 0, yBuffer!!, 0, y.size)
                System.arraycopy(u, 0, uBuffer!!, 0, u.size)
                System.arraycopy(v, 0, vBuffer!!, 0, v.size)
            }
            renderHandler?.post { renderFrame() }
        } catch (e: Throwable) {
            Log.e(TAG, "Error in Arrived callback: ${e.message}")
        }
    }

    override fun onY8CameraTreatParamDataArrived(data: ByteArray) {}
    override fun onY8Status(status: Int) {
        Log.d(TAG, "onY8Status $status")
        if (status >= 2) emitEvent("onPlaying")
    }

    override fun generateFileParam(): GuideFileParam? = null
    override fun getCurrentAnalysers(): Array<GuideAnalyser>? = null
    override fun onGetMeasureParamFromFile(i: Int): String? = null
    override fun onSaveMeasureParamToFile(i: Int): String? = null
    override fun onSlapFinish(z: Boolean) {}
    override fun onY16CameraDataTreatY16DataArrived(
        sArr: ShortArray?, i: Int, i2: Int, i3: Int, i4: Int, i5: Int,
        i6: Int, i7: Int, i8: Int, i9: Int, i10: Int, i11: Int,
        i12: Int, i13: Int, i14: Int, i15: Int, i16: Int, i17: Int,
        i18: Int, i19: Int, i20: Int, i21: Int
    ) {}

    private fun renderFrame() {
        try {
            val bmp: Bitmap?
            val yCopy: ByteArray?
            val uCopy: ByteArray?
            val vCopy: ByteArray?
            val pixels: IntArray?
            val w: Int
            val h: Int

            synchronized(frameLock) {
                bmp = currentBitmap
                yCopy = yBuffer
                uCopy = uBuffer
                vCopy = vBuffer
                pixels = pixelBuffer
                w = videoWidth
                h = videoHeight
            }

            if (bmp == null || bmp.isRecycled || yCopy == null || uCopy == null || vCopy == null || pixels == null) return

            val totalPixels = w * h
            val uvW = w / 2
            val expectedUvSize = (h / 2) * uvW

            if (yCopy.size < totalPixels || uCopy.size < expectedUvSize || vCopy.size < expectedUvSize) return

            for (idx in 0 until totalPixels) {
                val x = idx % w
                val yi = idx / w
                val uvIdx = (yi / 2) * uvW + (x / 2)

                val yVal = yCopy[idx].toInt() and 0xFF
                val uVal = uCopy[uvIdx].toInt() and 0xFF
                val vVal = vCopy[uvIdx].toInt() and 0xFF

                val c = yVal - 16
                val d = uVal - 128
                val e = vVal - 128

                val r = ((298 * c + 409 * e + 128) shr 8).coerceIn(0, 255)
                val g = ((298 * c - 100 * d - 208 * e + 128) shr 8).coerceIn(0, 255)
                val b = ((298 * c + 516 * d + 128) shr 8).coerceIn(0, 255)

                pixels[idx] = (0xFF shl 24) or (r shl 16) or (g shl 8) or b
            }
            
            bmp.setPixels(pixels, 0, w, 0, 0, w, h)

            val canvas = lockCanvas() ?: return
            try {
                canvas.drawBitmap(bmp, 0f, 0f, paint)
            } finally {
                unlockCanvasAndPost(canvas)
            }
        } catch (e: Exception) {
            Log.e(TAG, "renderFrame error: ${e.message}")
        }
    }

    private fun emitEvent(name: String, data: WritableMap? = null) {
        val reactContext = context as? ThemedReactContext ?: return
        val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, id)
        dispatcher?.dispatchEvent(GuideStreamEvent(id, name, data ?: Arguments.createMap()))
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        stopStream()
    }
}

internal class GuideStreamEvent(
    viewTag: Int,
    eventName: String,
    eventData: WritableMap
) : Event<GuideStreamEvent>(viewTag) {
    private val mEventName = eventName
    private val mEventData = eventData
    override fun getEventName() = mEventName
    override fun getEventData() = mEventData
}
