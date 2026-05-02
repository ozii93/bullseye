package com.guide.guidelibrary;

import android.content.Context;
import android.opengl.GLES20;
import android.opengl.GLSurfaceView;
import android.util.Log;
import java.nio.ByteBuffer;
import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.opengles.GL10;

public class GLFrameRenderer implements GLSurfaceView.Renderer {

    private final String TAG = "GLFrameRenderer";
    private final GLSurfaceView mTargetSurface;
    private final GLProgram prog = new GLProgram();

    private int mVideoWidth, mVideoHeight;
    private int mScreenWidth, mScreenHeight;
    private ByteBuffer y, u, v;

    public GLFrameRenderer(Context context, GLSurfaceView surface) {
        this.mTargetSurface = surface;
    }

    public void setShowRect(int w, int h) {
        this.mScreenWidth = w;
        this.mScreenHeight = h;
    }

    @Override
    public void onSurfaceCreated(GL10 gl, EGLConfig config) {
        Log.v(TAG, "onSurfaceCreated");
        if (!prog.isProgramBuilt()) {
            prog.buildProgram();
            Log.v(TAG, "buildProgram done");
        }
    }

    @Override
    public void onSurfaceChanged(GL10 gl, int width, int height) {
        Log.v(TAG, "onSurfaceChanged " + width + "x" + height);
        GLES20.glViewport(0, 0, width, height);
    }

    @Override
    public void onDrawFrame(GL10 gl) {
        synchronized (this) {
            if (y != null) {
                y.position(0);
                u.position(0);
                v.position(0);
                prog.buildTextures(y, u, v, mVideoWidth, mVideoHeight);
                GLES20.glClearColor(0.0f, 0.0f, 0.0f, 1.0f);
                GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT);
                prog.drawFrame();
            }
        }
    }

    public void update(int width, int height) {
        if (width <= 0 || height <= 0) return;
        int sw = this.mScreenWidth;
        int sh = this.mScreenHeight;
        if (sw > 0 && sh > 0) {
            float screenRatio = (sh * 1.0f) / sw;
            float videoRatio = (height * 1.0f) / width;
            float[] verts;
            if (screenRatio == videoRatio) {
                verts = GLProgram.squareVertices;
            } else if (screenRatio < videoRatio) {
                float s = screenRatio / videoRatio;
                verts = new float[]{-s, -1.0f, s, -1.0f, -s, 1.0f, s, 1.0f};
            } else {
                float s = videoRatio / screenRatio;
                verts = new float[]{-1.0f, -s, 1.0f, -s, -1.0f, s, 1.0f, s};
            }
            prog.createBuffers(verts);
        }
        if (width == mVideoWidth && height == mVideoHeight) return;
        mVideoWidth = width;
        mVideoHeight = height;
        int ySize = width * height;
        int uvSize = ySize / 4;
        synchronized (this) {
            y = ByteBuffer.allocate(ySize);
            u = ByteBuffer.allocate(uvSize);
            v = ByteBuffer.allocate(uvSize);
        }
    }

    public void update(byte[] yData, byte[] uData, byte[] vData) {
        synchronized (this) {
            if (y == null || u == null || v == null) return;
            y.clear();
            u.clear();
            v.clear();
            y.put(yData, 0, yData.length);
            u.put(uData, 0, uData.length);
            v.put(vData, 0, vData.length);
        }
        mTargetSurface.requestRender();
    }
}
