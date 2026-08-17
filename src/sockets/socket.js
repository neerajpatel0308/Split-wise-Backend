import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Group from "../models/Group.js";
import Message from "../models/Message.js";

export const initializeSocket = (io) => {
  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;

      if (!cookieHeader) {
        return next(new Error("Unauthorized. Please login."));
      }

      // Find token inside cookies
      const tokenCookie = cookieHeader
        .split(";")
        .find((cookie) => cookie.trim().startsWith("token="));

      if (!tokenCookie) {
        return next(new Error("Unauthorized. Please login."));
      }

      const token = tokenCookie.trim().substring("token=".length);

      // Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return next(new Error("User not found."));
      }

      // Attach user to socket
      socket.user = user;

      next();
    } catch (error) {
      console.error("SOCKET AUTH ERROR:", error.message);

      next(new Error("Invalid or expired token."));
    }
  });

  io.on("connection", (socket) => {
    console.log(`🔌 User connected: ${socket.user.fullName} (${socket.id})`);

    // JOIN GROUP
    socket.on("join-group", async (groupId) => {
      // your existing code
    });

    // SEND MESSAGE
    socket.on("send-message", async (data) => {
      try {
        const { groupId, message } = data;

        if (!groupId || !message?.trim()) {
          return socket.emit("chat-error", {
            message: "Group ID and message are required.",
          });
        }

        const group = await Group.findById(groupId);

        if (!group) {
          return socket.emit("chat-error", {
            message: "Group not found.",
          });
        }

        const isMember = group.members.some(
          (member) => member.toString() === socket.user._id.toString(),
        );

        if (!isMember) {
          return socket.emit("chat-error", {
            message: "You are not a member of this group.",
          });
        }

        const newMessage = await Message.create({
          group: groupId,
          sender: socket.user._id,
          message: message.trim(),
        });

        await newMessage.populate("sender", "fullName email");

        const roomName = `group_${groupId}`;

        io.to(roomName).emit("receive-message", {
          success: true,
          message: newMessage,
        });

        console.log(`💬 ${socket.user.fullName}: ${message.trim()}`);
      } catch (error) {
        console.error("SEND MESSAGE ERROR:", error);

        socket.emit("chat-error", {
          message: "Unable to send message.",
        });
      }
    });

    // Leave a group
    socket.on("leave-group", (groupId) => {
      if (!groupId) return;
      const roomName = `group_${groupId}`;

      socket.leave(roomName);

      console.log(`🚪 ${socket.user.fullName} left ${roomName}`);
    });

    socket.on("disconnect", () => {
      console.log(`❌ ${socket.user.fullName} disconnected`);
    });
  });
};
