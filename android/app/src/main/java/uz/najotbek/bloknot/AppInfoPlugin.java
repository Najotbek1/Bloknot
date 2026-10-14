package uz.najotbek.bloknot;

import android.content.pm.PackageManager;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Facts about this install that the web app cannot see (src/platform/appInfo.ts). */
@CapacitorPlugin(name = "MaqsadAppInfo")
public class AppInfoPlugin extends Plugin {

    /** The package that installed the app (a store, or the system installer for an APK); null if unknown. */
    @PluginMethod
    @SuppressWarnings("deprecation")
    public void getInstaller(PluginCall call) {
        PackageManager manager = getContext().getPackageManager();
        String name = getContext().getPackageName();
        String installer = null;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                installer = manager.getInstallSourceInfo(name).getInstallingPackageName();
            } else {
                installer = manager.getInstallerPackageName(name);
            }
        } catch (PackageManager.NameNotFoundException | IllegalArgumentException ignored) {
            // Unknown: treated like an APK install.
        }
        JSObject result = new JSObject();
        result.put("installer", installer);
        call.resolve(result);
    }
}
