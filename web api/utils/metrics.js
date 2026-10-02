/**
 * Prometheus Metrics Registry
 * Collects HTTP, SSE, BullMQ, and system metrics
 */
const client = require('prom-client');

// Enable default Node.js process metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// ─── HTTP Request Duration ────────────────────────────────────────────────────
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request duration in milliseconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [5, 15, 50, 100, 200, 500, 1000, 3000],
  registers: [register],
});

// ─── HTTP Request Counter ─────────────────────────────────────────────────────
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// ─── Active SSE Connections ───────────────────────────────────────────────────
const activeSSEConnections = new client.Gauge({
  name: 'sse_active_connections',
  help: 'Number of active SSE connections',
  registers: [register],
});

// ─── Email Queue Metrics ──────────────────────────────────────────────────────
const emailJobsTotal = new client.Counter({
  name: 'email_jobs_total',
  help: 'Total email jobs processed',
  labelNames: ['status'],
  registers: [register],
});

/**
 * Express middleware to record request metrics
 */
function metricsMiddleware(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = req.route?.path || req.path || 'unknown';
    const labels = { method: req.method, route, status_code: res.statusCode };
    httpRequestDuration.observe(labels, duration);
    httpRequestsTotal.inc(labels);
  });
  next();
}

module.exports = {
  register,
  httpRequestDuration,
  httpRequestsTotal,
  activeSSEConnections,
  emailJobsTotal,
  metricsMiddleware,
};
