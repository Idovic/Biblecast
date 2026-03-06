package app.biblecast.localserver;

import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

import java.net.InetSocketAddress;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

public class BibleCastWsServer extends WebSocketServer {

    public interface MessageCallback {
        void onMessage(String message);
    }

    private final MessageCallback callback;
    private final Set<WebSocket> clients = Collections.synchronizedSet(new HashSet<>());

    public BibleCastWsServer(int port, MessageCallback callback) {
        super(new InetSocketAddress(port));
        this.callback = callback;
        setReuseAddr(true);
    }

    @Override
    public void onOpen(WebSocket conn, ClientHandshake handshake) {
        clients.add(conn);
    }

    @Override
    public void onClose(WebSocket conn, int code, String reason, boolean remote) {
        clients.remove(conn);
    }

    @Override
    public void onMessage(WebSocket conn, String message) {
        if (callback != null) callback.onMessage(message);
        for (WebSocket client : clients) {
            if (client != conn && client.isOpen()) {
                try { client.send(message); } catch (Exception ignored) { }
            }
        }
    }

    @Override
    public void onError(WebSocket conn, Exception ex) { }

    @Override
    public void onStart() { }

    public void broadcastMessage(String message) {
        for (WebSocket client : clients) {
            if (client.isOpen()) {
                try { client.send(message); } catch (Exception ignored) { }
            }
        }
    }
}
