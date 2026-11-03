package net.almoghani.live;

import android.Manifest;
import android.app.Activity;
import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.PermissionRequest;
import android.webkit.SslErrorHandler;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.net.http.SslError;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.List;

/**
 * ALMOGHANI LIVE Android APK.
 * The website remains the single source of truth for channels, subscriptions and content.
 * No user passwords or stream links are embedded in this application.
 */
public final class MainActivity extends Activity {
    private static final String HOME_URL = "https://almoghani-net-22.lovable.app/";
    private static final int FILE_REQUEST = 1001;
    private static final int MEDIA_PERMISSION_REQUEST = 1002;

    private FrameLayout root;
    private WebView browser;
    private ProgressBar progress;
    private LinearLayout offlineScreen;
    private boolean pageHasError = false;
    private ValueCallback<Uri[]> uploadCallback;
    private PermissionRequest pendingMediaRequest;
    private String[] pendingWebResources;
    private View fullScreenView;
    private WebChromeClient.CustomViewCallback fullScreenCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(9, 10, 13));
        getWindow().setNavigationBarColor(Color.rgb(9, 10, 13));
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);

        root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(9, 10, 13));
        if (Build.VERSION.SDK_INT >= 35) {
            root.setOnApplyWindowInsetsListener((v, insets) -> {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars());
                v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return insets;
            });
        }

        browser = new WebView(this);
        browser.setBackgroundColor(Color.rgb(9, 10, 13));
        browser.setOverScrollMode(View.OVER_SCROLL_NEVER);
        WebView.setWebContentsDebuggingEnabled(false);
        WebSettings settings = browser.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(browser, true);

        browser.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (!request.isForMainFrame()) return false;
                Uri uri = request.getUrl();
                if (trusted(uri)) return false;
                openExternal(uri);
                return true;
            }

            @Override public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                pageHasError = false;
                offlineScreen.setVisibility(View.GONE);
                progress.setVisibility(View.VISIBLE);
            }

            @Override public void onPageFinished(WebView view, String url) {
                progress.setVisibility(View.GONE);
                if (!pageHasError) offlineScreen.setVisibility(View.GONE);
            }

            @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    pageHasError = true;
                    offlineScreen.setVisibility(View.VISIBLE);
                    progress.setVisibility(View.GONE);
                }
            }

            @Override public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                // Never bypass SSL errors, even when a television stream is unavailable.
                handler.cancel();
                if (trusted(Uri.parse(error.getUrl()))) {
                    pageHasError = true;
                    offlineScreen.setVisibility(View.VISIBLE);
                }
            }
        });

        browser.setWebChromeClient(new WebChromeClient() {
            @Override public void onProgressChanged(WebView view, int newProgress) {
                progress.setProgress(newProgress);
                if (newProgress >= 100) progress.setVisibility(View.GONE);
            }

            @Override public boolean onShowFileChooser(
                    WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (uploadCallback != null) uploadCallback.onReceiveValue(null);
                uploadCallback = callback;
                Intent picker = new Intent(Intent.ACTION_GET_CONTENT);
                picker.addCategory(Intent.CATEGORY_OPENABLE);
                picker.setType("*/*");
                String[] accept = params.getAcceptTypes();
                if (accept != null && accept.length > 0 && !accept[0].isEmpty()) {
                    picker.setType(accept.length == 1 ? accept[0] : "*/*");
                    if (accept.length > 1) picker.putExtra(Intent.EXTRA_MIME_TYPES, accept);
                }
                picker.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,
                    params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE);
                try {
                    startActivityForResult(Intent.createChooser(picker, "اختر ملفًا"), FILE_REQUEST);
                    return true;
                } catch (Exception ex) {
                    uploadCallback = null;
                    callback.onReceiveValue(null);
                    return false;
                }
            }

            @Override public void onPermissionRequest(PermissionRequest request) {
                runOnUiThread(() -> askForMediaPermissions(request));
            }

            @Override public void onPermissionRequestCanceled(PermissionRequest request) {
                runOnUiThread(() -> {
                    if (pendingMediaRequest == request) {
                        pendingMediaRequest = null;
                        pendingWebResources = null;
                    }
                });
            }

            @Override public void onShowCustomView(View view, CustomViewCallback callback) {
                if (fullScreenView != null) {
                    callback.onCustomViewHidden();
                    return;
                }
                fullScreenView = view;
                fullScreenCallback = callback;
                browser.setVisibility(View.GONE);
                root.addView(view, new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
            }

            @Override public void onHideCustomView() {
                hideFullScreen();
            }
        });

        browser.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) ->
            download(url, userAgent, contentDisposition, mimeType));

        root.addView(browser, new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(100);
        progress.setProgressTintList(android.content.res.ColorStateList.valueOf(Color.rgb(229, 188, 84)));
        FrameLayout.LayoutParams progressLayout = new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, dp(3), Gravity.TOP);
        root.addView(progress, progressLayout);

        createOfflineScreen();
        setContentView(root);
        if (savedInstanceState == null || browser.restoreState(savedInstanceState) == null) {
            browser.loadUrl(HOME_URL);
        }
    }

    private void createOfflineScreen() {
        offlineScreen = new LinearLayout(this);
        offlineScreen.setOrientation(LinearLayout.VERTICAL);
        offlineScreen.setGravity(Gravity.CENTER);
        offlineScreen.setPadding(dp(30), dp(25), dp(30), dp(25));
        offlineScreen.setBackgroundColor(Color.rgb(9, 10, 13));
        TextView heading = new TextView(this);
        heading.setText(R.string.offline_title);
        heading.setTextColor(Color.rgb(244, 218, 133));
        heading.setTextSize(22);
        heading.setGravity(Gravity.CENTER);
        TextView desc = new TextView(this);
        desc.setText(R.string.offline_desc);
        desc.setTextColor(Color.WHITE);
        desc.setTextSize(15);
        desc.setGravity(Gravity.CENTER);
        desc.setPadding(0, dp(14), 0, dp(22));
        Button retry = new Button(this);
        retry.setText(R.string.retry);
        retry.setOnClickListener(v -> {
            offlineScreen.setVisibility(View.GONE);
            browser.loadUrl(HOME_URL);
        });
        offlineScreen.addView(heading);
        offlineScreen.addView(desc);
        offlineScreen.addView(retry);
        offlineScreen.setVisibility(View.GONE);
        root.addView(offlineScreen, new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
    }

    private int dp(int amount) {
        return (int) (amount * getResources().getDisplayMetrics().density + 0.5f);
    }

    private boolean trusted(Uri uri) {
        String scheme = uri.getScheme();
        String host = uri.getHost();
        return "https".equalsIgnoreCase(scheme) && host != null
            && ("almoghani-net-22.lovable.app".equalsIgnoreCase(host)
                || "almoghani.net".equalsIgnoreCase(host)
                || host.toLowerCase(java.util.Locale.ROOT).endsWith(".almoghani.net"));
    }

    private void openExternal(Uri uri) {
        try {
            String scheme = uri.getScheme();
            if (scheme == null || scheme.equals("file") || scheme.equals("content")
                || scheme.equals("javascript") || scheme.equals("data")) return;
            Intent intent;
            if ("intent".equalsIgnoreCase(scheme)) {
                intent = Intent.parseUri(uri.toString(), Intent.URI_INTENT_SCHEME);
                intent.setComponent(null);
                intent.setSelector(null);
                intent.addCategory(Intent.CATEGORY_BROWSABLE);
            } else {
                intent = new Intent(Intent.ACTION_VIEW, uri);
                intent.addCategory(Intent.CATEGORY_BROWSABLE);
            }
            startActivity(intent);
        } catch (Exception ignored) {
            Toast.makeText(this, "لا يوجد تطبيق لفتح هذا الرابط", Toast.LENGTH_SHORT).show();
        }
    }

    private void download(String url, String userAgent, String disposition, String type) {
        try {
            Uri uri = Uri.parse(url);
            if (!"https".equalsIgnoreCase(uri.getScheme())) {
                Toast.makeText(this, R.string.download_failed, Toast.LENGTH_SHORT).show();
                return;
            }
            DownloadManager.Request request = new DownloadManager.Request(uri);
            String filename = URLUtil.guessFileName(url, disposition, type);
            request.setTitle(filename);
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.addRequestHeader("User-Agent", userAgent);
            String cookies = CookieManager.getInstance().getCookie(url);
            if (cookies != null) request.addRequestHeader("Cookie", cookies);
            if (Build.VERSION.SDK_INT >= 29) {
                request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename);
            } else {
                request.setDestinationInExternalFilesDir(this, Environment.DIRECTORY_DOWNLOADS, filename);
            }
            DownloadManager manager = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
            manager.enqueue(request);
            Toast.makeText(this, R.string.downloading, Toast.LENGTH_SHORT).show();
        } catch (Exception ex) {
            Toast.makeText(this, R.string.download_failed, Toast.LENGTH_SHORT).show();
        }
    }

    private void askForMediaPermissions(PermissionRequest request) {
        if (!trusted(request.getOrigin())) {
            request.deny();
            return;
        }
        List<String> resourceList = new ArrayList<>();
        List<String> androidPermissions = new ArrayList<>();
        for (String resource : request.getResources()) {
            if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) {
                resourceList.add(resource);
                if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED)
                    androidPermissions.add(Manifest.permission.RECORD_AUDIO);
            } else if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)) {
                resourceList.add(resource);
                if (checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED)
                    androidPermissions.add(Manifest.permission.CAMERA);
            }
        }
        if (resourceList.isEmpty()) {
            request.deny();
            return;
        }
        pendingMediaRequest = request;
        pendingWebResources = resourceList.toArray(new String[0]);
        if (!androidPermissions.isEmpty()) {
            requestPermissions(androidPermissions.toArray(new String[0]), MEDIA_PERMISSION_REQUEST);
        } else {
            request.grant(pendingWebResources);
            pendingMediaRequest = null;
            pendingWebResources = null;
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(requestCode, permissions, results);
        if (requestCode == MEDIA_PERMISSION_REQUEST && pendingMediaRequest != null) {
            boolean granted = results.length > 0;
            for (int value : results) {
                if (value != PackageManager.PERMISSION_GRANTED) granted = false;
            }
            if (granted) pendingMediaRequest.grant(pendingWebResources);
            else pendingMediaRequest.deny();
            pendingMediaRequest = null;
            pendingWebResources = null;
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != FILE_REQUEST || uploadCallback == null) return;
        Uri[] result = null;
        if (resultCode == RESULT_OK && data != null) {
            if (data.getClipData() != null) {
                int count = data.getClipData().getItemCount();
                result = new Uri[count];
                for (int i = 0; i < count; i++)
                    result[i] = data.getClipData().getItemAt(i).getUri();
            } else if (data.getData() != null) result = new Uri[]{data.getData()};
        }
        uploadCallback.onReceiveValue(result);
        uploadCallback = null;
    }

    private void hideFullScreen() {
        if (fullScreenView == null) return;
        root.removeView(fullScreenView);
        fullScreenView = null;
        browser.setVisibility(View.VISIBLE);
        if (fullScreenCallback != null) fullScreenCallback.onCustomViewHidden();
        fullScreenCallback = null;
    }

    @Override
    public void onBackPressed() {
        if (fullScreenView != null) hideFullScreen();
        else if (browser.canGoBack()) browser.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onSaveInstanceState(Bundle state) {
        browser.saveState(state);
        super.onSaveInstanceState(state);
    }

    @Override
    protected void onDestroy() {
        if (uploadCallback != null) uploadCallback.onReceiveValue(null);
        if (pendingMediaRequest != null) pendingMediaRequest.deny();
        root.removeView(browser);
        browser.destroy();
        super.onDestroy();
    }
}
