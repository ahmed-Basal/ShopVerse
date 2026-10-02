/**
 * Email Queue — BullMQ + ioredis
 * Handles asynchronous email sending with retries and SSE status broadcasting
 */
const { Queue, Worker } = require('bullmq');
const nodemailer = require('nodemailer');
const { createRedisConnection } = require('../config/redis');
const sseHub = require('./sseHub');

const QUEUE_NAME = 'emailQueue';

// ─── Queue instance (Producer) ────────────────────────────────────────────────
let emailQueue = null;

function getEmailQueue() {
  if (!emailQueue) {
    emailQueue = new Queue(QUEUE_NAME, {
      connection: createRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: { count: 50 },
        removeOnFail: { count: 50 },
      },
    });
  }
  return emailQueue;
}

// ─── Nodemailer Transporter ───────────────────────────────────────────────────
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10) || 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
}

// ─── Email Templates ──────────────────────────────────────────────────────────
function buildEmailHtml(type, data) {
  const base = (content) => `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0C0B10; color: #EDEAF2; border-radius: 14px; overflow: hidden; border: 1px solid #2A2635;">
      <div style="background: linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%); padding: 32px 40px; text-align: center;">
        <h1 style="margin: 0; font-size: 1.5rem; color: #fff; letter-spacing: -0.02em;">🛍️ ShopVerse</h1>
      </div>
      <div style="padding: 32px 40px;">${content}</div>
      <div style="padding: 16px 40px; border-top: 1px solid #2A2635; text-align: center;">
        <p style="font-size: 0.75rem; color: #635C77; margin: 0;">© ${new Date().getFullYear()} ShopVerse. All rights reserved.</p>
      </div>
    </div>
  `;

  switch (type) {
    case 'WELCOME_EMAIL':
      return base(`
        <h2 style="color: #A78BFA; margin-top: 0;">Welcome, ${data.name || 'New User'}! 🎉</h2>
        <p style="color: #A29DAE; line-height: 1.7;">We're thrilled to have you join ShopVerse. Explore thousands of products and enjoy a premium shopping experience.</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${process.env.BASE_URL || 'http://localhost:4200'}" style="background: #7C3AED; color: #fff; padding: 12px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; display: inline-block;">Start Shopping →</a>
        </div>
      `);

    case 'VERIFY_CODE_EMAIL':
      return base(`
        <h2 style="color: #A78BFA; margin-top: 0;">Verify Your Email</h2>
        <p style="color: #A29DAE;">Use the code below to verify your account:</p>
        <div style="background: #1C1829; border: 2px solid #7C3AED; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 2rem; font-weight: 800; color: #A78BFA; letter-spacing: 0.15em;">${data.code}</span>
        </div>
        <p style="color: #635C77; font-size: 0.85rem;">This code expires in 10 minutes. Do not share it with anyone.</p>
      `);

    case 'ORDER_CONFIRMATION_EMAIL':
      return base(`
        <h2 style="color: #34D399; margin-top: 0;">Order Confirmed! ✅</h2>
        <p style="color: #A29DAE;">Thank you for your order <strong style="color: #EDEAF2;">#${data.orderId}</strong>.</p>
        <p style="color: #A29DAE;">Amount: <strong style="color: #EDEAF2;">$${data.amount}</strong></p>
        <p style="color: #A29DAE; line-height: 1.7;">Your order is being processed and will be shipped soon.</p>
      `);

    case 'PASSWORD_RESET_EMAIL':
      return base(`
        <h2 style="color: #A78BFA; margin-top: 0;">Password Reset Request</h2>
        <p style="color: #A29DAE;">We received a request to reset your password. Use the code below:</p>
        <div style="background: #1C1829; border: 2px solid #F87171; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 2rem; font-weight: 800; color: #F87171; letter-spacing: 0.15em;">${data.resetCode}</span>
        </div>
        <p style="color: #635C77; font-size: 0.85rem;">If you didn't request this, please ignore this email. Code expires in 10 minutes.</p>
      `);

    default:
      return base(`<p style="color: #A29DAE;">${data.message || 'No content.'}</p>`);
  }
}

// ─── Worker (Consumer) ────────────────────────────────────────────────────────
let emailWorker = null;

function startEmailWorker() {
  if (emailWorker) return;

  emailWorker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { type, to, subject, data, userId } = job.data;

      // Notify SSE: processing
      if (userId) {
        sseHub.sendToUser(userId, 'emailStatus', {
          jobId: job.id,
          status: 'processing',
          type,
          to,
        });
      }

      const transporter = createTransporter();
      const html = buildEmailHtml(type, data);

      await transporter.sendMail({
        from: `"ShopVerse" <${process.env.EMAIL_USER}>`,
        to,
        subject: subject || 'ShopVerse Notification',
        html,
      });

      // Notify SSE: delivered
      if (userId) {
        sseHub.sendToUser(userId, 'emailStatus', {
          jobId: job.id,
          status: 'delivered',
          type,
          to,
        });
      }

      return { delivered: true, to, type };
    },
    {
      connection: createRedisConnection(),
      concurrency: 5,
    }
  );

  emailWorker.on('completed', (job, result) => {
    console.log(`✅ Email job ${job.id} completed:`, result.to);
  });

  emailWorker.on('failed', (job, err) => {
    console.error(`❌ Email job ${job?.id} failed:`, err.message);
    if (job?.data?.userId) {
      sseHub.sendToUser(job.data.userId, 'emailStatus', {
        jobId: job.id,
        status: 'failed',
        type: job.data.type,
        error: err.message,
      });
    }
  });

  console.log('📧 Email worker started');
}

/**
 * Enqueue an email job
 * @param {object} options
 * @param {string} options.type - WELCOME_EMAIL | VERIFY_CODE_EMAIL | ORDER_CONFIRMATION_EMAIL | PASSWORD_RESET_EMAIL
 * @param {string} options.to - recipient email
 * @param {string} options.subject - email subject
 * @param {object} options.data - template data
 * @param {string} [options.userId] - for SSE status updates
 */
async function enqueueEmail({ type, to, subject, data, userId }) {
  try {
    const queue = getEmailQueue();
    const job = await queue.add(type, { type, to, subject, data, userId });
    console.log(`📬 Email job queued: ${job.id} [${type}] → ${to}`);
    return job.id;
  } catch (err) {
    console.error('Failed to queue email:', err.message);
    // Fallback: try to send synchronously
    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: `"ShopVerse" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: buildEmailHtml(type, data),
      });
    } catch (fallbackErr) {
      console.error('Email fallback also failed:', fallbackErr.message);
    }
  }
}

module.exports = { enqueueEmail, startEmailWorker, getEmailQueue };
