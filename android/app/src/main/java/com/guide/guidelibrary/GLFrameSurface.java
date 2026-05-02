package com.guide.guidelibrary;

import android.content.Context;
import android.opengl.GLSurfaceView;
import android.util.AttributeSet;
import android.util.Log;

public class GLFrameSurface extends GLSurfaceView {

    private final String TAG = "GLFrameSurface";

    public GLFrameSurface(Context context) {
        super(context);
        setEGLContextClientVersion(2);
    }

    public GLFrameSurface(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    @Override
    protected void onAttachedToWindow() {
        Log.v(TAG, "onAttachedToWindow");
        super.onAttachedToWindow();
        if (isInEditMode()) return;
        setRenderMode(RENDERMODE_WHEN_DIRTY);
        Log.v(TAG, "setRenderMode RENDERMODE_WHEN_DIRTY");
    }
}
