package com.guide.guidelibrary;

import java.util.concurrent.atomic.AtomicInteger;

public class GuideMedia {

    public enum ScopeType { Default, Y8Only, Y16Only, Y8AndY16 }

    private GuideCameraSurface mCallBack;
    private final AtomicInteger mY8state = new AtomicInteger(0);

    static {
        System.loadLibrary("avutil-55");
        System.loadLibrary("swresample-2");
        System.loadLibrary("avcodec-57");
        System.loadLibrary("avformat-57");
        System.loadLibrary("swscale-4");
        System.loadLibrary("x264-155");
        System.loadLibrary("postproc-54");
        System.loadLibrary("avfilter-6");
        System.loadLibrary("json");
        System.loadLibrary("GuideMediaStream");
    }

    public int OpenStream(int rtspType, GuideCameraSurface callback) {
        this.mCallBack = callback;
        this.mY8state.set(0);
        if (rtspType == 1) {
            return openY8CameraWithParam("192.168.42.1", this, true, 1, 50);
        }
        if (rtspType == 2) {
            return openY8CameraWithRTSPAddressAndParam("rtsp://192.168.42.1/preview", this, false, 0, 50);
        }
        return openY8CameraWithRTSPAddress("rtsp://192.168.42.1/preview", this);
    }

    public int CloseStream() {
        this.mCallBack = null;
        this.mY8state.set(0);
        return closeStream();
    }

    public int ScopeStart(String path, ScopeType scopeType) {
        int type = 0;
        if (scopeType == ScopeType.Y8Only) type = 1;
        else if (scopeType == ScopeType.Y16Only) type = 2;
        else if (scopeType == ScopeType.Y8AndY16) type = 3;
        return scopeStart(path, type);
    }

    public int ScopeStop() { return scopeStop(); }
    public int ScopeStopFinish() { return scopeStopFinish(); }

    public void OnY8CameraDataTreatYUVDataArrived(int width, int height, byte[] y, byte[] u, byte[] v) {
        GuideCameraSurface cb = this.mCallBack;
        if (cb != null && y != null && u != null && v != null) {
            cb.onY8CameraDataTreatYUVDataArrived(width, height, y, u, v);
        }
    }

    public void OnY8CameraDataTreatAudioDataArrived(int i, int i2, byte[] data) {
        // Log.v("GuideMedia", "Audio data arrived: " + (data != null ? data.length : 0))
    }

    public void OnY8CameraTreatParamDataArrived(byte[] data) {
        GuideCameraSurface cb = this.mCallBack;
        if (cb != null) cb.onY8CameraTreatParamDataArrived(data);
    }

    public void OnY8CameraDataRecvStateChanged(int state) {
        optionY8state(state);
    }

    public void OnY8CameraDataTreatStateChanged(int state) {
        optionY8state(state);
    }

    private synchronized void optionY8state(int state) {
        if (state == 1 && mY8state.get() == 2) return;
        mY8state.addAndGet(state == 1 ? 1 : -1);
        GuideCameraSurface cb = this.mCallBack;
        if (cb != null) cb.onY8Status(mY8state.get());
    }

    // Native methods
    private native int closeStream();
    private native int openY8CameraWithParam(String host, GuideMedia media, boolean z, int i, int frameLimit);
    private native int openY8CameraWithRTSPAddress(String address, GuideMedia media);
    private native int openY8CameraWithRTSPAddressAndParam(String address, GuideMedia media, boolean z, int i, int frameLimit);
    private native int scopeStart(String path, int type);
    private native int scopeStop();
    private native int scopeStopFinish();
    public native void setIgnoreVideoRepeatPTS(boolean ignore);
}
