package uz.najotbek.bloknot.alarm;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;
import org.json.JSONArray;
import org.json.JSONObject;
import uz.najotbek.bloknot.MainActivity;

/** Puts the planned rings into Android's AlarmManager as real alarm clocks. */
final class AlarmScheduler {

    private static final String TAG = "MaqsadAlarm";
    /** Request codes 1..MAX are the plan; the test ring uses its own code. */
    static final int MAX_ALARMS = 64;
    static final int TEST_REQUEST_CODE = 9999;

    static final String EXTRA_NATIVE_ID = "nativeId";
    static final String EXTRA_ALARM_ID = "alarmId";
    static final String EXTRA_LABEL = "label";
    static final String EXTRA_TITLE = "title";
    static final String EXTRA_BODY = "body";
    static final String EXTRA_RINGTONE = "ringtone";

    private AlarmScheduler() {}

    /** Replaces every scheduled ring with the stored plan, skipping times already past. */
    static void applyStored(Context context) {
        cancelAll(context);
        JSONArray schedule = AlarmStore.getSchedule(context);
        long now = System.currentTimeMillis();
        for (int i = 0; i < schedule.length(); i++) {
            JSONObject item = schedule.optJSONObject(i);
            if (item == null) continue;
            long at = item.optLong("at", 0);
            int id = item.optInt("id", 0);
            if (at <= now || id < 1 || id > MAX_ALARMS) continue;
            schedule(context, id, at, item);
        }
    }

    static void schedule(Context context, int requestCode, long at, JSONObject item) {
        AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (manager == null) return;
        PendingIntent fire = PendingIntent.getBroadcast(
            context,
            requestCode,
            ringIntent(context, requestCode, item),
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        Intent open = new Intent(context, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent show = PendingIntent.getActivity(context, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        try {
            manager.setAlarmClock(new AlarmManager.AlarmClockInfo(at, show), fire);
        } catch (SecurityException e) {
            // Exact alarms not allowed (Android 12/13 with the permission revoked): ring as close as we may.
            Log.w(TAG, "Exact alarm not permitted, using an inexact one", e);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, fire);
            } else {
                manager.set(AlarmManager.RTC_WAKEUP, at, fire);
            }
        }
    }

    private static Intent ringIntent(Context context, int nativeId, JSONObject item) {
        return new Intent(context, AlarmReceiver.class)
            .setAction("uz.najotbek.bloknot.ALARM_" + nativeId)
            .putExtra(EXTRA_NATIVE_ID, nativeId)
            .putExtra(EXTRA_ALARM_ID, item.optString("alarmId", ""))
            .putExtra(EXTRA_LABEL, item.optString("label", ""))
            .putExtra(EXTRA_TITLE, item.optString("title", ""))
            .putExtra(EXTRA_BODY, item.optString("body", ""))
            .putExtra(EXTRA_RINGTONE, item.optString("ringtone", ""));
    }

    private static void cancelAll(Context context) {
        AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (manager == null) return;
        for (int id = 1; id <= MAX_ALARMS; id++) {
            Intent intent = new Intent(context, AlarmReceiver.class).setAction("uz.najotbek.bloknot.ALARM_" + id);
            PendingIntent pending = PendingIntent.getBroadcast(
                context,
                id,
                intent,
                PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
            );
            if (pending != null) {
                manager.cancel(pending);
                pending.cancel();
            }
        }
    }
}
