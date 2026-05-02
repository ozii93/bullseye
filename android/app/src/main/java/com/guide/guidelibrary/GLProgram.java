package com.guide.guidelibrary;

import android.opengl.GLES20;
import android.util.Log;
import java.nio.Buffer;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;

public class GLProgram {
    private static final String FRAGMENT_SHADER = "precision mediump float;\nuniform sampler2D tex_y;\nuniform sampler2D tex_u;\nuniform sampler2D tex_v;\nvarying vec2 tc;\nvoid main() {\nvec4 c = vec4((texture2D(tex_y, tc).r - 16./255.) * 1.164);\nvec4 U = vec4(texture2D(tex_u, tc).r - 128./255.);\nvec4 V = vec4(texture2D(tex_v, tc).r - 128./255.);\nc += V * vec4(1.596, -0.813, 0, 0);\nc += U * vec4(0, -0.392, 2.017, 0);\nc.a = 1.0;\ngl_FragColor = c;\n}\n";
    private static final String VERTEX_SHADER = "attribute vec4 vPosition;\nattribute vec2 a_texCoord;\nvarying vec2 tc;\nvoid main() {\ngl_Position = vPosition;\ntc = a_texCoord;\n}\n";

    static final float[] squareVertices = {-1.0f, -1.0f, 1.0f, -1.0f, -1.0f, 1.0f, 1.0f, 1.0f};
    private static final float[] coordVertices = {0.0f, 1.0f, 1.0f, 1.0f, 0.0f, 0.0f, 1.0f, 0.0f};

    private final String TAG = "GLProgram";
    private int _program;
    private int _positionHandle = -1;
    private int _coordHandle = -1;
    private int _yhandle = -1;
    private int _uhandle = -1;
    private int _vhandle = -1;
    private int _ytid = -1;
    private int _utid = -1;
    private int _vtid = -1;
    private int _video_width = -1;
    private int _video_height = -1;
    private boolean isProgBuilt;

    private ByteBuffer _vertice_buffer;
    private ByteBuffer _coord_buffer;

    public boolean isProgramBuilt() { return isProgBuilt; }

    public void buildProgram() {
        if (_program <= 0) {
            _program = createProgram(VERTEX_SHADER, FRAGMENT_SHADER);
        }
        _positionHandle = GLES20.glGetAttribLocation(_program, "vPosition");
        _coordHandle = GLES20.glGetAttribLocation(_program, "a_texCoord");
        _yhandle = GLES20.glGetUniformLocation(_program, "tex_y");
        _uhandle = GLES20.glGetUniformLocation(_program, "tex_u");
        _vhandle = GLES20.glGetUniformLocation(_program, "tex_v");
        isProgBuilt = true;
    }

    public void createBuffers(float[] vertices) {
        _vertice_buffer = ByteBuffer.allocateDirect(vertices.length * 4);
        _vertice_buffer.order(ByteOrder.nativeOrder());
        _vertice_buffer.asFloatBuffer().put(vertices);
        _vertice_buffer.position(0);
        if (_coord_buffer == null) {
            _coord_buffer = ByteBuffer.allocateDirect(coordVertices.length * 4);
            _coord_buffer.order(ByteOrder.nativeOrder());
            _coord_buffer.asFloatBuffer().put(coordVertices);
            _coord_buffer.position(0);
        }
    }

    public void buildTextures(Buffer yBuf, Buffer uBuf, Buffer vBuf, int width, int height) {
        boolean sizeChanged = (width != _video_width || height != _video_height);
        if (sizeChanged) {
            _video_width = width;
            _video_height = height;
        }

        int[] texIds = new int[1];

        if (_ytid < 0 || sizeChanged) {
            if (_ytid >= 0) GLES20.glDeleteTextures(1, new int[]{_ytid}, 0);
            GLES20.glGenTextures(1, texIds, 0);
            _ytid = texIds[0];
        }
        GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, _ytid);
        GLES20.glTexImage2D(GLES20.GL_TEXTURE_2D, 0, GLES20.GL_LUMINANCE, _video_width, _video_height, 0, GLES20.GL_LUMINANCE, GLES20.GL_UNSIGNED_BYTE, yBuf);
        GLES20.glTexParameterf(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MIN_FILTER, GLES20.GL_NEAREST);
        GLES20.glTexParameterf(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MAG_FILTER, GLES20.GL_LINEAR);
        GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_S, GLES20.GL_CLAMP_TO_EDGE);
        GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_T, GLES20.GL_CLAMP_TO_EDGE);

        int uvW = _video_width / 2;
        int uvH = _video_height / 2;

        if (_utid < 0 || sizeChanged) {
            if (_utid >= 0) GLES20.glDeleteTextures(1, new int[]{_utid}, 0);
            GLES20.glGenTextures(1, texIds, 0);
            _utid = texIds[0];
        }
        GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, _utid);
        GLES20.glTexImage2D(GLES20.GL_TEXTURE_2D, 0, GLES20.GL_LUMINANCE, uvW, uvH, 0, GLES20.GL_LUMINANCE, GLES20.GL_UNSIGNED_BYTE, uBuf);
        GLES20.glTexParameterf(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MIN_FILTER, GLES20.GL_NEAREST);
        GLES20.glTexParameterf(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MAG_FILTER, GLES20.GL_LINEAR);
        GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_S, GLES20.GL_CLAMP_TO_EDGE);
        GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_T, GLES20.GL_CLAMP_TO_EDGE);

        if (_vtid < 0 || sizeChanged) {
            if (_vtid >= 0) GLES20.glDeleteTextures(1, new int[]{_vtid}, 0);
            GLES20.glGenTextures(1, texIds, 0);
            _vtid = texIds[0];
        }
        GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, _vtid);
        GLES20.glTexImage2D(GLES20.GL_TEXTURE_2D, 0, GLES20.GL_LUMINANCE, uvW, uvH, 0, GLES20.GL_LUMINANCE, GLES20.GL_UNSIGNED_BYTE, vBuf);
        GLES20.glTexParameterf(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MIN_FILTER, GLES20.GL_NEAREST);
        GLES20.glTexParameterf(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MAG_FILTER, GLES20.GL_LINEAR);
        GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_S, GLES20.GL_CLAMP_TO_EDGE);
        GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_T, GLES20.GL_CLAMP_TO_EDGE);
    }

    public void drawFrame() {
        GLES20.glUseProgram(_program);
        GLES20.glVertexAttribPointer(_positionHandle, 2, GLES20.GL_FLOAT, false, 8, _vertice_buffer);
        GLES20.glEnableVertexAttribArray(_positionHandle);
        GLES20.glVertexAttribPointer(_coordHandle, 2, GLES20.GL_FLOAT, false, 8, _coord_buffer);
        GLES20.glEnableVertexAttribArray(_coordHandle);

        GLES20.glActiveTexture(GLES20.GL_TEXTURE0);
        GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, _ytid);
        GLES20.glUniform1i(_yhandle, 0);

        GLES20.glActiveTexture(GLES20.GL_TEXTURE1);
        GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, _utid);
        GLES20.glUniform1i(_uhandle, 1);

        GLES20.glActiveTexture(GLES20.GL_TEXTURE2);
        GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, _vtid);
        GLES20.glUniform1i(_vhandle, 2);

        GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP, 0, 4);
        GLES20.glFinish();
        GLES20.glDisableVertexAttribArray(_positionHandle);
        GLES20.glDisableVertexAttribArray(_coordHandle);
    }

    private int createProgram(String vertexSrc, String fragmentSrc) {
        int vs = loadShader(GLES20.GL_VERTEX_SHADER, vertexSrc);
        int fs = loadShader(GLES20.GL_FRAGMENT_SHADER, fragmentSrc);
        int program = GLES20.glCreateProgram();
        if (program != 0) {
            GLES20.glAttachShader(program, vs);
            GLES20.glAttachShader(program, fs);
            GLES20.glLinkProgram(program);
            int[] status = new int[1];
            GLES20.glGetProgramiv(program, GLES20.GL_LINK_STATUS, status, 0);
            if (status[0] != GLES20.GL_TRUE) {
                Log.e("GLProgram", "Link failed: " + GLES20.glGetProgramInfoLog(program));
                GLES20.glDeleteProgram(program);
                return 0;
            }
        }
        return program;
    }

    private int loadShader(int type, String source) {
        int shader = GLES20.glCreateShader(type);
        if (shader != 0) {
            GLES20.glShaderSource(shader, source);
            GLES20.glCompileShader(shader);
            int[] compiled = new int[1];
            GLES20.glGetShaderiv(shader, GLES20.GL_COMPILE_STATUS, compiled, 0);
            if (compiled[0] == 0) {
                Log.e("GLProgram", "Compile error: " + GLES20.glGetShaderInfoLog(shader));
                GLES20.glDeleteShader(shader);
                return 0;
            }
        }
        return shader;
    }
}
