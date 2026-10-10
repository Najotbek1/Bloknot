package uz.najotbek.bloknot.alarm;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
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
import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;
import org.json.JSONException;
import org.json.JSONObject;
import uz.najotbek.bloknot.MainActivity;
import uz.najotbek.bloknot.R;

/**
 * Plays the alarm in a loop until the app, after the user typed the text, calls stop. The ongoing
 * notification has no dismiss action; its full-screen intent opens the app over the lock screen.
 */
public class AlarmService extends Service {

    private static final String TAG = "MaqsadAlarm";
    static final String CHANNEL_ID = "maqsad_alarm";
    private static final int NOTIFICATION_ID = 7001;
    /** Safety net: never ring for more than an hour (a forgotten phone would drain its battery). */
    private static final long MAX_RING_MS = 60L * 60L * 1000L;
    /** The alarm stream is raised to at least this share of its maximum when ringing starts. */
    private static final float MIN_VOLUME = 0.7f;

    private MediaPlayer player;
    private Vibrator vibrator;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable timeout = this::stopSelf;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
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

        Notification notification = buildNotification(title, body);
        int type = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q ? ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK : 0;
        ServiceCompat.startForeground(this, NOTIFICATION_ID, notification, type);

        startSound(intent != null ? intent.getStringExtra(AlarmScheduler.EXTRA_RINGTONE) : null);
        startVibration();
        handler.removeCallbacks(timeout);
        handler.postDelayed(timeout, MAX_RING_MS);

        AlarmPlugin.onRinging(ringing);
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
        stopSound();
        if (vibrator != null) vibrator.cancel();
        AlarmStore.setRinging(this, null);
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
        super.onDestroy();
    }
}
