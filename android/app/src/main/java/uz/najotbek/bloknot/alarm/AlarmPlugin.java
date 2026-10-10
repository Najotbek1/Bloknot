package uz.najotbek.bloknot.alarm;

import android.app.Activity;
import android.app.AlarmManager;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.text.TextUtils;
import androidx.activity.result.ActivityResult;
import androidx.core.app.NotificationManagerCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.lang.ref.WeakReference;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import uz.najotbek.bloknot.MainActivity;

/** The app's side of the alarm clock (src/platform/alarm.ts). */
@CapacitorPlugin(name = "MaqsadAlarm")
public class AlarmPlugin extends Plugin {

    private static WeakReference<AlarmPlugin> instance = new WeakReference<>(null);

    @Override
    public void load() {
        instance = new WeakReference<>(this);
    }

    /** Called by the service when an alarm starts ringing; tells the web app if it is running. */
    static void onRinging(JSONObject ringing) {
        AlarmPlugin plugin = instance.get();
        if (plugin != null) plugin.notifyListeners("ringing", toJS(ringing), true);
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        if (intent != null && intent.getBooleanExtra(MainActivity.EXTRA_ALARM, false)) {
            JSONObject ringing = AlarmStore.getRinging(getContext());
            if (ringing != null) notifyListeners("ringing", toJS(ringing), true);
        }
    }

    private static JSObject toJS(JSONObject json) {
        try {
            return JSObject.fromJSONObject(json);
        } catch (JSONException e) {
            return new JSObject();
        }
    }

    /** Replaces the planned rings: {alarms: [{id, at, alarmId, label, title, body, ringtone}]}. */
    @PluginMethod
    public void setSchedule(PluginCall call) {
        JSArray alarms = call.getArray("alarms", new JSArray());
        JSONArray copy = new JSONArray();
        for (int i = 0; i < alarms.length(); i++) {
            JSONObject item = alarms.optJSONObject(i);
            if (item != null) copy.put(item);
        }
        AlarmStore.setSchedule(getContext(), copy);
        AlarmScheduler.applyStored(getContext());
        call.resolve();
    }

    @PluginMethod
    public void getRinging(PluginCall call) {
        JSONObject ringing = AlarmStore.getRinging(getContext());
        JSObject result = new JSObject();
        result.put("ringing", ringing != null ? toJS(ringing) : null);
        call.resolve(result);
    }

    /** Stops the ringing; the app calls this only after the text was typed correctly. */
    @PluginMethod
    public void stop(PluginCall call) {
        Context context = getContext();
        context.stopService(new Intent(context, AlarmService.class));
        AlarmStore.setRinging(context, null);
        Activity activity = getActivity();
        if (activity instanceof MainActivity) {
            activity.runOnUiThread(() -> ((MainActivity) activity).setAlarmWindow(false));
        }
        call.resolve();
    }

    /** Rings once in `seconds` (default 10), to try the alarm out. */
    @PluginMethod
    public void testRing(PluginCall call) {
        int seconds = call.getInt("seconds", 10);
        JSONObject item = new JSONObject();
        try {
            item.put("alarmId", "test");
            item.put("label", call.getString("label", ""));
            item.put("title", call.getString("title", ""));
            item.put("body", call.getString("body", ""));
            item.put("ringtone", call.getString("ringtone", ""));
        } catch (JSONException ignored) {}
        AlarmScheduler.schedule(
            getContext(),
            AlarmScheduler.TEST_REQUEST_CODE,
            System.currentTimeMillis() + seconds * 1000L,
            item
        );
        call.resolve();
    }

    @PluginMethod
    public void pickRingtone(PluginCall call) {
        Intent intent = new Intent(RingtoneManager.ACTION_RINGTONE_PICKER)
            .putExtra(RingtoneManager.EXTRA_RINGTONE_TYPE, RingtoneManager.TYPE_ALARM)
            .putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_DEFAULT, true)
            .putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_SILENT, false)
            .putExtra(RingtoneManager.EXTRA_RINGTONE_DEFAULT_URI, Settings.System.DEFAULT_ALARM_ALERT_URI);
        String current = call.getString("current");
        if (!TextUtils.isEmpty(current)) intent.putExtra(RingtoneManager.EXTRA_RINGTONE_EXISTING_URI, Uri.parse(current));
        startActivityForResult(call, intent, "ringtonePicked");
    }

    @ActivityCallback
    private void ringtonePicked(PluginCall call, ActivityResult result) {
        if (call == null) return;
        JSObject answer = new JSObject();
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null) {
            answer.put("cancelled", true);
            call.resolve(answer);
            return;
        }
        Uri uri = data.getParcelableExtra(RingtoneManager.EXTRA_RINGTONE_PICKED_URI);
        boolean isDefault = uri == null || Settings.System.DEFAULT_ALARM_ALERT_URI.equals(uri);
        answer.put("cancelled", false);
        answer.put("uri", isDefault ? null : uri.toString());
        String title = null;
        if (!isDefault) {
            Ringtone ringtone = RingtoneManager.getRingtone(getContext(), uri);
            if (ringtone != null) title = ringtone.getTitle(getContext());
        }
        answer.put("title", title);
        call.resolve(answer);
    }

    /** What the alarm needs and whether the user allowed it. */
    @PluginMethod
    public void getStatus(PluginCall call) {
        Context context = getContext();
        boolean exact = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            exact = manager == null || manager.canScheduleExactAlarms();
        }
        boolean fullScreen = true;
        if (Build.VERSION.SDK_INT >= 34) {
            NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            fullScreen = manager == null || manager.canUseFullScreenIntent();
        }
        JSObject result = new JSObject();
        result.put("exact", exact);
        result.put("fullScreen", fullScreen);
        result.put("notifications", NotificationManagerCompat.from(context).areNotificationsEnabled());
        call.resolve(result);
    }

    /** Opens the system screen for one of: exact, fullScreen, notifications, app. */
    @PluginMethod
    public void openSettings(PluginCall call) {
        Context context = getContext();
        String which = call.getString("which", "app");
        Uri packageUri = Uri.parse("package:" + context.getPackageName());
        Intent intent;
        if ("exact".equals(which) && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, packageUri);
        } else if ("fullScreen".equals(which) && Build.VERSION.SDK_INT >= 34) {
            intent = new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, packageUri);
        } else if ("notifications".equals(which) && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, context.getPackageName());
        } else {
            intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, packageUri);
        }
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            context.startActivity(intent);
        } catch (Exception e) {
            context.startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, packageUri).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        }
        call.resolve();
    }
}
