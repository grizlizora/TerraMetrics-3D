package com.terrametrics.globe3d;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.Display;
import android.view.View;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1. Edge-to-Edge immersive transparent bars
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);

        // 2. Unlock 120Hz ProMotion / 120Hz AMOLED high refresh rate
        unlockHighRefreshRate();

        // 3. Inject Safe Area insets into WebView CSS variables (--sat, --sab)
        setupSafeAreaBridge();
    }

    private void unlockHighRefreshRate() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            Display display = getDisplay();
            if (display != null) {
                Display.Mode[] modes = display.getSupportedModes();
                float maxRefreshRate = 60.0f;
                int bestModeId = 0;
                for (Display.Mode mode : modes) {
                    if (mode.getRefreshRate() > maxRefreshRate) {
                        maxRefreshRate = mode.getRefreshRate();
                        bestModeId = mode.getModeId();
                    }
                }
                if (bestModeId != 0) {
                    WindowManager.LayoutParams params = getWindow().getAttributes();
                    params.preferredDisplayModeId = bestModeId;
                    params.preferredRefreshRate = maxRefreshRate;
                    getWindow().setAttributes(params);
                }
            }
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            WindowManager.LayoutParams params = getWindow().getAttributes();
            params.preferredRefreshRate = 120.0f;
            getWindow().setAttributes(params);
        }
    }

    private void setupSafeAreaBridge() {
        WindowInsetsControllerCompat insetsController = new WindowInsetsControllerCompat(getWindow(), getWindow().getDecorView());
        insetsController.setAppearanceLightStatusBars(false);

        getWindow().getDecorView().setOnApplyWindowInsetsListener((v, insets) -> {
            int topInset = insets.getSystemWindowInsetTop();
            int bottomInset = insets.getSystemWindowInsetBottom();
            float density = getResources().getDisplayMetrics().density;

            int topDp = (int) (topInset / density);
            int bottomDp = (int) (bottomInset / density);

            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().evaluateJavascript(
                    "document.documentElement.style.setProperty('--sat', '" + topDp + "px');" +
                    "document.documentElement.style.setProperty('--sab', '" + bottomDp + "px');",
                    null
                );
            }
            return insets;
        });
    }
}
