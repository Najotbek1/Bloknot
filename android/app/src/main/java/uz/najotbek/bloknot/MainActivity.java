package uz.najotbek.bloknot;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;
import uz.najotbek.bloknot.alarm.AlarmPlugin;
import uz.najotbek.bloknot.alarm.AlarmService;

public class MainActivity extends BridgeActivity {

    /** Set on the intent the ringing alarm opens the app with. */
    public static final String EXTRA_ALARM = "maqsad_alarm";

    /** Whether the app is on screen; the ringing alarm uses it to call the user back. */
    private static volatile boolean visible;

    public static boolean isVisible() {
        return visible;
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AlarmPlugin.class);
        super.onCreate(savedInstanceState);
        setAlarmWindow(isAlarmIntent(getIntent()));
    }

    @Override
    public void onStart() {
        super.onStart();
        visible = true;
    }

    @Override
    public void onStop() {
        super.onStop();
        visible = false;
        // Left while the alarm rings (home gesture, recents, another app): the service calls the user back.
        AlarmService.onAppLeft(this);
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
