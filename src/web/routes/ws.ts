type WSData = { channel?: string };

export const wsHandlers: Bun.WebSocketHandler<WSData> = {
  message(ws, message) {
    try {
      const { type, channel, data } = JSON.parse(String(message));
      if (type === "subscribe" && channel) {
        ws.subscribe(channel);
        ws.data.channel = channel;
        ws.send(JSON.stringify({ ok: true, subscribed: channel }));
      } else if (type === "publish" && channel && data) {
        ws.publish(channel, JSON.stringify({ data }));
      }
    } catch {
      ws.send(JSON.stringify({ error: "Invalid message" }));
    }
  },
};


