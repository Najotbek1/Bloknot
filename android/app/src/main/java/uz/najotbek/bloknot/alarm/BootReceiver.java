package uz.najotbek.bloknot.alarm;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Android forgets alarms on reboot and on app update: put the stored plan back. */
public class BootReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (
            Intent.ACTION_BOOT_COMPLETED.equals(action) ||
            Intent.ACTION_MY_PACKAGE_REPLACED.equals(action) ||
            "android.intent.action.QUICKBOOT_POWERON".equals(action)
        ) {
            AlarmScheduler.applyStored(context);
        }
    }
}
