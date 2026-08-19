import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Group from "../models/Group.js";
import Message from "../models/Message.js";

export const initializeSocket = (io) => {
  // SOCKET AUTHENTICATION
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

  // SOCKET CONNECTION
  io.on("connection", (socket) => {
    console.log(`🔌 User connected: ${socket.user.fullName} (${socket.id})`);

    // ACTIVE GROUP
    socket.activeGroupId = null;
    socket.unreadCounts = {};

    // JOIN GROUP
    socket.on("join-group", async (groupId) => {
      try {
        if (!groupId) {
          return socket.emit("chat-error", {
            message: "Group ID is required.",
          });
        }

        // Find group
        const group = await Group.findById(groupId);

        if (!group) {
          return socket.emit("chat-error", {
            message: "Group not found.",
          });
        }

        // Check whether user belongs to group
        const isMember = group.members.some(
          (member) => member.toString() === socket.user._id.toString(),
        );

        if (!isMember) {
          return socket.emit("chat-error", {
            message: "You are not a member of this group.",
          });
        }

        // Create room name
        const roomName = `group_${groupId}`;

        // Join group room
        socket.join(roomName);

        // Store currently active group
        socket.activeGroupId = groupId.toString();

        console.log(`👥 ${socket.user.fullName} joined ${roomName}`);

        // Tell frontend
        socket.emit("group-joined", {
          success: true,
          groupId,
          message: "Joined group chat successfully.",
        });
      } catch (error) {
        console.error("JOIN GROUP ERROR:", error);

        socket.emit("chat-error", {
          message: "Unable to join group chat.",
        });
      }
    });

    // TYPING
    socket.on("typing", ({ groupId }) => {
      try {
        if (!groupId) return;

        const roomName = `group_${groupId}`;

        // Send to everyone except the person typing
        socket.to(roomName).emit("user-typing", {
          userId: socket.user._id,
          fullName: socket.user.fullName,
          groupId,
        });

        console.log(`⌨️ ${socket.user.fullName} is typing in ${roomName}`);
      } catch (error) {
        console.error("TYPING ERROR:", error);
      }
    });

    // STOP TYPING

    socket.on("stop-typing", ({ groupId }) => {
      try {
        if (!groupId) return;

        const roomName = `group_${groupId}`;

        // Tell everyone except the person
        // who stopped typing
        socket.to(roomName).emit("user-stopped-typing", {
          userId: socket.user._id,
          fullName: socket.user.fullName,
          groupId,
        });

        console.log(`⌨️ ${socket.user.fullName} stopped typing`);
      } catch (error) {
        console.error("STOP TYPING ERROR:", error);
      }
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

        // Find group
        const group = await Group.findById(groupId);

        if (!group) {
          return socket.emit("chat-error", {
            message: "Group not found.",
          });
        }

        // Check membership
        const isMember = group.members.some(
          (member) => member.toString() === socket.user._id.toString(),
        );

        if (!isMember) {
          return socket.emit("chat-error", {
            message: "You are not a member of this group.",
          });
        }

        // =================================================
        // CREATE MESSAGE
        // =================================================

        const newMessage = await Message.create({
          group: groupId,
          sender: socket.user._id,
          message: message.trim(),

          // Sender has already seen
          // their own message
          seenBy: [
            {
              user: socket.user._id,
              seenAt: new Date(),
            },
          ],
        });

        // Populate sender
        await newMessage.populate("sender", "fullName email");

        // Group room
        const roomName = `group_${groupId}`;

        // =================================================
        // SEND MESSAGE TO GROUP
        // =================================================

        io.to(roomName).emit("receive-message", {
          success: true,
          message: newMessage,
        });

        // =================================================
        // UPDATE UNREAD COUNT
        // =================================================

        /*
            The sender should NOT receive
            an unread count.

            For every other connected socket:

            If they are NOT currently viewing
            this group:

              previous count + 1
          */

        const sockets = await io.fetchSockets();

        for (const userSocket of sockets) {
          // Don't count the message
          // for the sender
          if (userSocket.user._id.toString() === socket.user._id.toString()) {
            continue;
          }

          // Make sure this socket
          // belongs to this group
          const isGroupMember = group.members.some(
            (member) => member.toString() === userSocket.user._id.toString(),
          );

          if (!isGroupMember) {
            continue;
          }

          // User is currently viewing
          // this group.
          //
          // Therefore don't increase
          // unread count.
          if (userSocket.activeGroupId === groupId.toString()) {
            continue;
          }

          // Get previous count
          const previousCount = userSocket.unreadCounts[groupId] || 0;

          // Increase by 1
          const newUnreadCount = previousCount + 1;

          // Save in socket memory
          userSocket.unreadCounts[groupId] = newUnreadCount;

          // Send updated count
          // only to that user
          userSocket.emit("unread-count", {
            groupId,
            count: newUnreadCount,
          });
        }

        console.log(`💬 ${socket.user.fullName}: ${message.trim()}`);
      } catch (error) {
        console.error("SEND MESSAGE ERROR:", error);

        socket.emit("chat-error", {
          message: "Unable to send message.",
        });
      }
    });
    // GET INITIAL UNREAD COUNT

    socket.on("get-initial-unread-count", async ({ groupId }) => {
      try {
        if (!groupId) return;

        // Check group
        const group = await Group.findById(groupId);

        if (!group) {
          return socket.emit("chat-error", {
            message: "Group not found.",
          });
        }

        // Check membership
        const isMember = group.members.some(
          (member) => member.toString() === socket.user._id.toString(),
        );

        if (!isMember) {
          return socket.emit("chat-error", {
            message: "You are not a member of this group.",
          });
        }

        // Count unseen messages
        const count = await Message.countDocuments({
          group: groupId,

          // Don't count own messages
          sender: {
            $ne: socket.user._id,
          },

          // User hasn't seen message
          "seenBy.user": {
            $ne: socket.user._id,
          },
        });

        // Store count
        socket.unreadCounts[groupId] = count;

        // Send count to frontend
        socket.emit("unread-count", {
          groupId,
          count,
        });

        console.log(
          `📩 ${socket.user.fullName} has ${count} unread messages in ${groupId}`,
        );
      } catch (error) {
        console.error("INITIAL UNREAD COUNT ERROR:", error);

        socket.emit("chat-error", {
          message: "Unable to get unread message count.",
        });
      }
    });

    // MARK ENTIRE GROUP AS SEEN

    socket.on("mark-group-seen", async ({ groupId }) => {
      try {
        if (!groupId) {
          return socket.emit("chat-error", {
            message: "Group ID is required.",
          });
        }

        // Find group
        const group = await Group.findById(groupId);

        if (!group) {
          return socket.emit("chat-error", {
            message: "Group not found.",
          });
        }

        // Check membership
        const isMember = group.members.some(
          (member) => member.toString() === socket.user._id.toString(),
        );

        if (!isMember) {
          return socket.emit("chat-error", {
            message: "You are not a member of this group.",
          });
        }

        // Find unseen messages
        const unseenMessages = await Message.find({
          group: groupId,

          // Don't mark own messages
          sender: {
            $ne: socket.user._id,
          },

          // Only messages not seen
          // by current user
          "seenBy.user": {
            $ne: socket.user._id,
          },
        });

        // Mark each message as seen
        for (const message of unseenMessages) {
          message.seenBy.push({
            user: socket.user._id,
            seenAt: new Date(),
          });

          await message.save();
        }

        // Reset unread count
        socket.unreadCounts[groupId] = 0;

        // Tell frontend
        socket.emit("unread-count", {
          groupId,
          count: 0,
        });

        // Tell everyone in group
        io.to(`group_${groupId}`).emit("group-messages-seen", {
          groupId,
          userId: socket.user._id,
          fullName: socket.user.fullName,
        });

        console.log(
          `👁️ ${socket.user.fullName} saw all messages in group ${groupId}`,
        );
      } catch (error) {
        console.error("MARK GROUP SEEN ERROR:", error);

        socket.emit("chat-error", {
          message: "Unable to mark messages as seen.",
        });
      }
    });

    // INDIVIDUAL MESSAGE SEEN
    socket.on("message-seen", async ({ messageId, groupId }) => {
      try {
        if (!messageId || !groupId) {
          return socket.emit("chat-error", {
            message: "Message ID and Group ID are required.",
          });
        }

        // Find group
        const group = await Group.findById(groupId);

        if (!group) {
          return socket.emit("chat-error", {
            message: "Group not found.",
          });
        }

        // Check membership
        const isMember = group.members.some(
          (member) => member.toString() === socket.user._id.toString(),
        );

        if (!isMember) {
          return socket.emit("chat-error", {
            message: "You are not a member of this group.",
          });
        }

        // Find message
        const message = await Message.findOne({
          _id: messageId,
          group: groupId,
        });

        if (!message) {
          return socket.emit("chat-error", {
            message: "Message not found.",
          });
        }

        // Don't mark your own message
        if (message.sender.toString() === socket.user._id.toString()) {
          return;
        }

        // Check if already seen
        const alreadySeen = message.seenBy.some(
          (item) => item.user.toString() === socket.user._id.toString(),
        );

        // Add user only if not seen
        if (!alreadySeen) {
          message.seenBy.push({
            user: socket.user._id,
            seenAt: new Date(),
          });

          await message.save();
        }

        // Notify everyone in group
        io.to(`group_${groupId}`).emit("message-seen", {
          messageId,
          userId: socket.user._id,
          fullName: socket.user.fullName,
          seenAt: new Date(),
        });

        console.log(`👁️ ${socket.user.fullName} saw message ${messageId}`);
      } catch (error) {
        console.error("MESSAGE SEEN ERROR:", error);

        socket.emit("chat-error", {
          message: "Unable to mark message as seen.",
        });
      }
    });
    // LEAVE GROUP
    socket.on("leave-group", (groupId) => {
      if (!groupId) return;

      const roomName = `group_${groupId}`;

      socket.leave(roomName);

      // If this was the active group,
      if (socket.activeGroupId === groupId.toString()) {
        socket.activeGroupId = null;
      }

      console.log(`🚪 ${socket.user.fullName} left ${roomName}`);
    });

    // DISCONNECT
    socket.on("disconnect", () => {
      console.log(`❌ ${socket.user.fullName} disconnected`);
    });
  });
};
