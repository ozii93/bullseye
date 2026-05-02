package com.guide.guidelibrary;

public interface GuideCameraSurface {
    GuideFileParam generateFileParam();
    GuideAnalyser[] getCurrentAnalysers();
    String onGetMeasureParamFromFile(int i);
    String onSaveMeasureParamToFile(int i);
    void onSlapFinish(boolean z);
    void onY16CameraDataTreatY16DataArrived(short[] sArr, int i, int i2, int i3, int i4, int i5, int i6, int i7, int i8, int i9, int i10, int i11, int i12, int i13, int i14, int i15, int i16, int i17, int i18, int i19, int i20, int i21);
    void onY8CameraDataTreatYUVDataArrived(int width, int height, byte[] y, byte[] u, byte[] v);
    void onY8CameraTreatParamDataArrived(byte[] data);
    void onY8Status(int status);
}
