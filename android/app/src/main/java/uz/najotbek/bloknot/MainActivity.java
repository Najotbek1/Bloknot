package uz.najotbek.bloknot;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;
import uz.najotbek.bloknot.alarm.AlarmPlugin;

public class MainActivity extends BridgeActivity {

    /** Set on the intent the ringing alarm opens the app with. */
    public static final String EXTRA_ALARM = "maqsad_alarm";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AlarmPlugin.class);
        super.onCreate(savedInstanceState);
        setAlarmWindow(isAlarmIntent(getIntent()));
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (isAlarmIntent(intent)) setAlarmWindow(true);
    }

    private static boolean isAlarmIntent(Intent intent) {
        return intent != null && intent.getBooleanExtra(EXTRA_ALARM, false);
    }

    /**
     * While an alarm rings the app shows over the lock screen and turns the screen on, so the
     * text can be typed. Switched off again when the alarm is stopped.
     */
    @SuppressWarnings("deprecation")
    public void setAlarmWindow(boolean ringing) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(ringing);
            setTurnScreenOn(ringing);
        } else {
            int flags = WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON;
            if (ringing) getWindow().addFlags(flags);
            else getWindow().clearFlags(flags);
        }
        if (ringing) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }
}
