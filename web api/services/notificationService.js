const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");

// Maintain active SSE client connections
let clients = [];

exports.notificationStream = asyncHandler(async (req, res, next) => {
  const userId = (req.user?.id || req.user?._id || "").toString();
  if (!userId) {
    return next(new ApiError("User not authenticated", 401));
  }

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  const newClient = {
    id: userId,
    res,
  };

  clients.push(newClient);
  console.log(`SSE Client connected: User ${userId}. Total clients: ${clients.length}`);

  // Send initial keep-alive comment
  res.write(": ok\n\n");

  // Keep connection alive with periodic pings
  const keepAliveInterval = setInterval(() => {
    res.write(": keep-alive\n\n");
  }, 30000);

  req.on("close", () => {
    clearInterval(keepAliveInterval);
    clients = clients.filter((c) => c.res !== res);
    console.log(`SSE Client disconnected: User ${userId}. Total clients: ${clients.length}`);
  });
});

exports.sendNotificationToUser = (userId, eventData) => {
  const targetId = userId.toString();
  const targetClients = clients.filter((c) => c.id === targetId);
  
  console.log(`Broadcasting event to user ${targetId}. Found ${targetClients.length} active tab(s).`);

  targetClients.forEach((client) => {
    client.res.write(`event: order_confirmed\n`);
    client.res.write(`data: ${JSON.stringify(eventData)}\n\n`);
  });
};
