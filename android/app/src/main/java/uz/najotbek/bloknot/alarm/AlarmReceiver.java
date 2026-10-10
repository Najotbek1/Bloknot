package uz.najotbek.bloknot.alarm;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import androidx.core.content.ContextCompat;

/** Fired by AlarmManager at the alarm time: starts the ringing service. */
public class AlarmReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        Intent service = new Intent(context, AlarmService.class);
        if (intent.getExtras() != null) service.putExtras(intent.getExtras());
        // Alarm-clock broadcasts may start a foreground service from the background.
        ContextCompat.startForegroundService(context, service);
    }
}
