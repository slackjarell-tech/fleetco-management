package org.fleetcomanagement.driver;

import android.content.Intent;
import android.os.Build;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "DashcamService")
public class DashcamPlugin extends Plugin {

    @PluginMethod
    public void start(PluginCall call) {
        String label = call.getString("label", "Road cam active — keep app open");
        Intent intent = new Intent(getContext(), DashcamForegroundService.class);
        intent.putExtra("label", label);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(intent);
        } else {
            getContext().startService(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getContext().stopService(new Intent(getContext(), DashcamForegroundService.class));
        call.resolve();
    }
}
