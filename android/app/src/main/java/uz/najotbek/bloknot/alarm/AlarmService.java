package uz.najotbek.bloknot.alarm;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.PixelFormat;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;
import org.json.JSONException;
import org.json.JSONObject;
import uz.najotbek.bloknot.MainActivity;
import uz.najotbek.bloknot.R;

/**
 * Plays the alarm in a loop until the app, after the user typed the text, calls stop. The ongoing
 * notification has no dismiss action; its full-screen intent opens the app over the lock screen.
 *
 * Android lets no app block the home or recents gesture, so when the user leaves the ringing app
 * the service calls them back: with «Display over other apps» allowed it reopens the ringing
 * screen at once; without it the notification is posted again so it drops down at the top, while
 * the sound goes on either way.
 */
public class AlarmService extends Service {

    private static final String TAG = "MaqsadAlarm";
    static final String CHANNEL_ID = "maqsad_alarm";
    private static final int NOTIFICATION_ID = 7001;
    /** The "still ringing" reminder posted when the user leaves; a fresh post always drops down. */
    private static final int RETURN_NOTIFICATION_ID = 7002;
    /** Safety net: never ring for more than an hour (a forgotten phone would drain its battery). */
    private static final long MAX_RING_MS = 60L * 60L * 1000L;
    /** The alarm stream is raised to at least this share of its maximum when ringing starts. */
    private static final float MIN_VOLUME = 0.7f;
    /** The ringing service, if any; set on the main thread. */
    private static AlarmService current;
    /** How often the ringing screen is reopened while the user stays away (overlay allowed). */
    private static final long REOPEN_MS = 1500L;
    /** How often the notification drops down again while the user stays away. */
    private static final long REPOST_MS = 30_000L;

    private MediaPlayer player;
    private Vibrator vibrator;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable timeout = this::stopSelf;
    private final Runnable callBack = this::callBack;
    private String title = "Maqsad";
    private String returnBody = "";
    private long lastPost;
    /** A 1×1 invisible overlay: Android 15+ lets an app open its screen from the background only with one shown. */
    private View overlay;

    /** Called by the activity whenever it stops; does nothing unless an alarm is ringing. */
    public static void onAppLeft(Context context) {
        AlarmService service = current;
        if (service != null && AlarmStore.getRinging(context) != null) service.startCallBack(true);
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        current = this;
        String title = intent != null ? intent.getStringExtra(AlarmScheduler.EXTRA_TITLE) : null;
        String body = intent != null ? intent.getStringExtra(AlarmScheduler.EXTRA_BODY) : null;
        String label = intent != null ? intent.getStringExtra(AlarmScheduler.EXTRA_LABEL) : null;
        if (TextUtils.isEmpty(title)) title = "Maqsad";
        if (TextUtils.isEmpty(body)) body = label != null ? label : "";

        JSONObject ringing = new JSONObject();
        try {
            ringing.put("nativeId", intent != null ? intent.getIntExtra(AlarmScheduler.EXTRA_NATIVE_ID, 0) : 0);
            ringing.put("alarmId", intent != null ? intent.getStringExtra(AlarmScheduler.EXTRA_ALARM_ID) : "");
            ringing.put("label", label != null ? label : "");
            ringing.put("since", System.currentTimeMillis());
        } catch (JSONException ignored) {}
        AlarmStore.setRinging(this, ringing);

        String back = intent != null ? intent.getStringExtra(AlarmScheduler.EXTRA_RETURN_BODY) : null;
        this.title = title;
        this.returnBody = TextUtils.isEmpty(back) ? body : back;

        Notification notification = buildNotification(title, body);
        int type = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q ? ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK : 0;
        ServiceCompat.startForeground(this, NOTIFICATION_ID, notification, type);

        startSound(intent != null ? intent.getStringExtra(AlarmScheduler.EXTRA_RINGTONE) : null);
        startVibration();
        handler.removeCallbacks(timeout);
        handler.postDelayed(timeout, MAX_RING_MS);

        AlarmPlugin.onRinging(ringing);
        showOverlay();
        // Rang while the user was in another app: the full-screen intent only drops a banner then.
        // The notification itself drops down first, so the reminder waits its turn.
        if (!MainActivity.isVisible()) startCallBack(false);
        return START_STICKY;
    }

    private Notification buildNotification(String title, String body) {
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && manager != null) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, title, NotificationManager.IMPORTANCE_HIGH);
            // The service plays the sound itself, in a loop.
            channel.setSound(null, null);
            channel.enableVibration(false);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            manager.createNotificationChannel(channel);
        }
        Intent open = new Intent(this, MainActivity.class)
            .putExtra(MainActivity.EXTRA_ALARM, true)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent openPending = PendingIntent.getActivity(
            this,
            1,
            open,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_bloknot)
            .setContentTitle(title)
            .setContentText(body)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setAutoCancel(false)
            .setContentIntent(openPending)
            .setFullScreenIntent(openPending, true)
            .build();
    }

    private void startCallBack(boolean postNow) {
        lastPost = postNow ? 0 : System.currentTimeMillis();
        handler.removeCallbacks(callBack);
        handler.post(callBack);
    }

    /** Repeats until the ringing screen is back on top or the alarm is stopped. */
    private void callBack() {
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (MainActivity.isVisible() || AlarmStore.getRinging(this) == null) {
            if (manager != null) manager.cancel(RETURN_NOTIFICATION_ID);
            return;
        }
        if (canDrawOverlays()) reopen();
        long now = System.currentTimeMillis();
        if (manager != null && now - lastPost >= REPOST_MS) {
            lastPost = now;
            manager.cancel(RETURN_NOTIFICATION_ID);
            manager.notify(RETURN_NOTIFICATION_ID, buildNotification(title, returnBody));
        }
        handler.postDelayed(callBack, canDrawOverlays() ? REOPEN_MS : REPOST_MS);
    }

    private void reopen() {
        Intent open = new Intent(this, MainActivity.class)
            .putExtra(MainActivity.EXTRA_ALARM, true)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        try {
            startActivity(open);
        } catch (RuntimeException e) {
            Log.w(TAG, "Cannot reopen the ringing screen", e);
        }
    }

    private boolean canDrawOverlays() {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(this);
    }

    private void showOverlay() {
        if (overlay != null || Build.VERSION.SDK_INT < Build.VERSION_CODES.O || !canDrawOverlays()) return;
        WindowManager windows = (WindowManager) getSystemService(Context.WINDOW_SERVICE);
        if (windows == null) return;
        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
            1,
            1,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE,
            PixelFormat.TRANSLUCENT
        );
        params.gravity = Gravity.TOP | Gravity.START;
        View view = new View(this);
        try {
            windows.addView(view, params);
            overlay = view;
        } catch (RuntimeException e) {
            Log.w(TAG, "Cannot show the overlay", e);
        }
    }

    private void hideOverlay() {
        if (overlay == null) return;
        WindowManager windows = (WindowManager) getSystemService(Context.WINDOW_SERVICE);
        try {
            if (windows != null) windows.removeView(overlay);
        } catch (RuntimeException ignored) {}
        overlay = null;
    }

    private Uri soundUri(String picked) {
        if (!TextUtils.isEmpty(picked)) return Uri.parse(picked);
        Uri uri = RingtoneManager.getActualDefaultRingtoneUri(this, RingtoneManager.TYPE_ALARM);
        if (uri == null) uri = RingtoneManager.getActualDefaultRingtoneUri(this, RingtoneManager.TYPE_RINGTONE);
        if (uri == null) uri = Settings.System.DEFAULT_ALARM_ALERT_URI;
        return uri;
    }

    private void startSound(String picked) {
        stopSound();
        raiseVolume();
        player = createPlayer(soundUri(picked));
        // A picked ringtone may have been deleted: fall back to the phone's default alarm.
        if (player == null && !TextUtils.isEmpty(picked)) player = createPlayer(soundUri(null));
        if (player != null) player.start();
    }

    private MediaPlayer createPlayer(Uri uri) {
        MediaPlayer media = new MediaPlayer();
        try {
            media.setAudioAttributes(
                new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
            );
            media.setDataSource(this, uri);
            media.setLooping(true);
            media.setWakeMode(this, PowerManager.PARTIAL_WAKE_LOCK);
            media.prepare();
            return media;
        } catch (Exception e) {
            Log.w(TAG, "Cannot play " + uri, e);
            media.release();
            return null;
        }
    }

    private void raiseVolume() {
        AudioManager audio = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        if (audio == null) return;
        int max = audio.getStreamMaxVolume(AudioManager.STREAM_ALARM);
        int min = Math.round(max * MIN_VOLUME);
        try {
            if (audio.getStreamVolume(AudioManager.STREAM_ALARM) < min) {
                audio.setStreamVolume(AudioManager.STREAM_ALARM, min, 0);
            }
        } catch (SecurityException e) {
            Log.w(TAG, "Cannot raise the alarm volume", e);
        }
    }

    @SuppressWarnings("deprecation")
    private void startVibration() {
        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator == null || !vibrator.hasVibrator()) return;
        long[] pattern = { 0, 800, 800 };
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
        } else {
            vibrator.vibrate(pattern, 0);
        }
    }

    private void stopSound() {
        if (player != null) {
            try {
                player.stop();
            } catch (IllegalStateException ignored) {}
            player.release();
            player = null;
        }
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacks(timeout);
        handler.removeCallbacks(callBack);
        if (current == this) current = null;
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) manager.cancel(RETURN_NOTIFICATION_ID);
        hideOverlay();
        stopSound();
        if (vibrator != null) vibrator.cancel();
        AlarmStore.setRinging(this, null);
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
        super.onDestroy();
    }
}
