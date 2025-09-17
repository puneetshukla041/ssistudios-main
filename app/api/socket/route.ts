// app/api/socket/route.ts
import { Server as IOServer } from "socket.io";
import { NextRequest } from "next/server";

declare global {
  // Extend globalThis to persist io across hot reloads
  // eslint-disable-next-line no-var
  var io: IOServer | undefined;
}

export async function GET(req: NextRequest) {
  if (!globalThis.io) {
    console.log("🔌 Starting Socket.IO server...");

    const io = new IOServer({
      path: "/api/socketio",
      cors: { origin: "*" },
    });

    globalThis.io = io;

    io.on("connection", (socket) => {
      console.log("✅ New client connected:", socket.id);

      socket.on("join", (userId: string) => {
        console.log(`🟢 User ${userId} joined`);
        (socket as any).userId = userId;
        io.emit("userStatus", { userId, status: "online" });
      });

      socket.on("leave", (userId: string) => {
        console.log(`🔴 User ${userId} left`);
        io.emit("userStatus", { userId, status: "offline" });
      });

      socket.on("disconnect", () => {
        const userId = (socket as any).userId;
        if (userId) {
          console.log(`❌ User ${userId} disconnected`);
          io.emit("userStatus", { userId, status: "offline" });
        }
      });
    });
  }

  return new Response("Socket.IO server is running");
}
