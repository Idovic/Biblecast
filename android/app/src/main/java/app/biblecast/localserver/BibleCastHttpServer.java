package app.biblecast.localserver;

import android.content.res.AssetManager;
import java.io.IOException;
import java.io.InputStream;
import fi.iki.elonen.NanoHTTPD;

public class BibleCastHttpServer extends NanoHTTPD {

    private final AssetManager assets;

    public BibleCastHttpServer(AssetManager assets, int port) throws IOException {
        super(port);
        this.assets = assets;
        start(NanoHTTPD.SOCKET_READ_TIMEOUT, false);
    }

    @Override
    public Response serve(IHTTPSession session) {
        String uri = session.getUri();
        if (uri.startsWith("/")) uri = uri.substring(1);
        if (uri.isEmpty()) uri = "index.html";

        uri = uri.split("\\?")[0];

        try {
            InputStream stream = assets.open("public/" + uri);
            return newChunkedResponse(Response.Status.OK, getMimeType(uri), stream);
        } catch (IOException e) {
            try {
                InputStream stream = assets.open("public/index.html");
                return newChunkedResponse(Response.Status.OK, "text/html; charset=utf-8", stream);
            } catch (IOException ex) {
                return newFixedLengthResponse(Response.Status.NOT_FOUND, "text/plain", "Not found");
            }
        }
    }

    private String getMimeType(String uri) {
        if (uri.endsWith(".html")) return "text/html; charset=utf-8";
        if (uri.endsWith(".js") || uri.endsWith(".mjs")) return "application/javascript";
        if (uri.endsWith(".css")) return "text/css";
        if (uri.endsWith(".json")) return "application/json";
        if (uri.endsWith(".png")) return "image/png";
        if (uri.endsWith(".jpg") || uri.endsWith(".jpeg")) return "image/jpeg";
        if (uri.endsWith(".svg")) return "image/svg+xml";
        if (uri.endsWith(".ico")) return "image/x-icon";
        if (uri.endsWith(".woff2")) return "font/woff2";
        if (uri.endsWith(".woff")) return "font/woff";
        if (uri.endsWith(".ttf")) return "font/ttf";
        if (uri.endsWith(".webp")) return "image/webp";
        return "application/octet-stream";
    }
}
