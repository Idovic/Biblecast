package app.biblecast.localserver;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Enumeration;

@CapacitorPlugin(name = "LocalServer")
public class LocalServerPlugin extends Plugin {

    private BibleCastHttpServer httpServer;
    private BibleCastWsServer wsServer;

    @PluginMethod
    public void startServer(PluginCall call) {
        int httpPort = call.getInt("httpPort", 8090);
        int wsPort   = call.getInt("wsPort",   8091);
        try {
            if (httpServer != null) { httpServer.stop(); httpServer = null; }
            if (wsServer   != null) { try { wsServer.stop(); } catch (Exception ignored) {} wsServer = null; }

            httpServer = new BibleCastHttpServer(getContext().getAssets(), httpPort);
            wsServer   = new BibleCastWsServer(wsPort, this::onWsMessage);
            wsServer.start();

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("httpPort", httpPort);
            result.put("wsPort", wsPort);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Échec démarrage serveur: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopServer(PluginCall call) {
        try {
            if (httpServer != null) { httpServer.stop(); httpServer = null; }
            if (wsServer   != null) { try { wsServer.stop(); } catch (Exception ignored) {} wsServer = null; }
            call.resolve();
        } catch (Exception e) {
            call.reject("Échec arrêt serveur: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getLocalIP(PluginCall call) {
        JSObject result = new JSObject();
        result.put("ip", resolveLocalIP());
        call.resolve(result);
    }

    @PluginMethod
    public void sendWsMessage(PluginCall call) {
        String message = call.getString("message", "");
        if (wsServer != null && message != null && !message.isEmpty()) {
            wsServer.broadcastMessage(message);
        }
        call.resolve();
    }

    private void onWsMessage(String message) {
        JSObject event = new JSObject();
        event.put("message", message);
        notifyListeners("wsMessage", event);
    }

    private String resolveLocalIP() {
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            String fallback = null;
            while (interfaces != null && interfaces.hasMoreElements()) {
                NetworkInterface iface = interfaces.nextElement();
                if (!iface.isUp() || iface.isLoopback()) continue;
                Enumeration<InetAddress> addrs = iface.getInetAddresses();
                while (addrs.hasMoreElements()) {
                    InetAddress addr = addrs.nextElement();
                    if (!(addr instanceof Inet4Address) || addr.isLoopbackAddress()) continue;
                    String ip = addr.getHostAddress();
                    if (ip == null) continue;
                    if (ip.startsWith("192.168.43.")) return ip;
                    if (fallback == null) fallback = ip;
                }
            }
            if (fallback != null) return fallback;
        } catch (Exception ignored) { }
        return "127.0.0.1";
    }
}
