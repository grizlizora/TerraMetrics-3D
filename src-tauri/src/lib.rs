use tauri::Manager;

#[tauri::command]
fn trigger_haptic(pattern: &str) {
    let _ = pattern;
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Inject Windows DirectX 11 ANGLE and GPU rasterization flags before WebView2 initializes
    #[cfg(target_os = "windows")]
    {
        std::env::set_var(
            "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
            "--use-angle=d3d11 --enable-gpu-rasterization --enable-zero-copy --disable-features=TouchpadAndWheelScrollLatching --overscroll-history-navigation=0"
        );
    }

    // Inject Linux WebKitGTK DMA-BUF safety environment variable
    #[cfg(target_os = "linux")]
    {
        if std::env::var("WEBKIT_DISABLE_DMABUF_RENDERER").is_err() {
            std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        }
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
                let _ = window.unminimize();
            }
        }))
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .invoke_handler(tauri::generate_handler![trigger_haptic])
        .setup(|_app| {
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running terrametrics-3d");
}
