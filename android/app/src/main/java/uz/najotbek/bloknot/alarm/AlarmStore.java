package uz.najotbek.bloknot.alarm;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * What the alarm code keeps between app runs: the planned rings (so they survive a reboot without
 * the app being opened) and the alarm that is ringing right now.
 */
final class AlarmStore {

    private static final String PREFS = "maqsad_alarms";
    private static final String KEY_SCHEDULE = "schedule";
    private static final String KEY_RINGING = "ringing";

    private AlarmStore() {}

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static JSONArray getSchedule(Context context) {
        try {
            return new JSONArray(prefs(context).getString(KEY_SCHEDULE, "[]"));
        } catch (JSONException e) {
            return new JSONArray();
        }
    }

    static void setSchedule(Context context, JSONArray schedule) {
        prefs(context).edit().putString(KEY_SCHEDULE, schedule.toString()).apply();
    }

    /** The ringing alarm: {nativeId, alarmId, label, since}, or null. */
    static JSONObject getRinging(Context context) {
        String raw = prefs(context).getString(KEY_RINGING, null);
        if (raw == null) return null;
        try {
            return new JSONObject(raw);
        } catch (JSONException e) {
            return null;
        }
    }

    static void setRinging(Context context, JSONObject ringing) {
        SharedPreferences.Editor editor = prefs(context).edit();
        if (ringing == null) editor.remove(KEY_RINGING);
        else editor.putString(KEY_RINGING, ringing.toString());
        // commit, not apply: the app may read it right after the service starts.
        editor.commit();
    }
}
