/**
 * SSE (Server-Sent Events) Hub
 * Manages real-time connections and broadcasts events to clients
 */

/** @type {Map<string, {res: import('express').Response, userId: string}>} */
const clients = new Map();

let clientIdCounter = 0;

/**
 * Add a new SSE client connection
 * @param {import('express').Response} res
 * @param {string} userId
 * @returns {string} clientId
 */
function addClient(res, userId) {
  const clientId = `client_${++clientIdCounter}_${Date.now()}`;
  clients.set(clientId, { res, userId });
  console.log(`SSE: client connected [${clientId}] user=${userId} total=${clients.size}`);
  return clientId;
}

/**
 * Remove a client on disconnect
 * @param {string} clientId
 */
function removeClient(clientId) {
  clients.delete(clientId);
  console.log(`SSE: client disconnected [${clientId}] total=${clients.size}`);
}

/**
 * Broadcast an event to all connected clients
 * @param {string} event
 * @param {object} data
 */
function broadcastAll(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach(({ res }, clientId) => {
    try {
      res.write(payload);
    } catch (err) {
      console.error(`SSE: error writing to client ${clientId}`, err.message);
      removeClient(clientId);
    }
  });
}

/**
 * Send event to a specific user's connected clients
 * @param {string} userId
 * @param {string} event
 * @param {object} data
 */
function sendToUser(userId, event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach(({ res, userId: clientUserId }, clientId) => {
    if (clientUserId === userId) {
      try {
        res.write(payload);
      } catch (err) {
        console.error(`SSE: error writing to user ${userId}`, err.message);
        removeClient(clientId);
      }
    }
  });
}

/**
 * Get active connection count
 */
function getConnectionCount() {
  return clients.size;
}

/**
 * Start keep-alive heartbeat (prevents proxy timeouts)
 */
function startHeartbeat() {
  setInterval(() => {
    broadcastAll('heartbeat', { ts: Date.now() });
  }, 25000);
  console.log('SSE: heartbeat started (25s interval)');
}

module.exports = { addClient, removeClient, broadcastAll, sendToUser, getConnectionCount, startHeartbeat };
