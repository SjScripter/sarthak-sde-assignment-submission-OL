import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import nodemailer from 'nodemailer';
import { prisma } from '../index';
import dotenv from 'dotenv';
import { sendSlackNotification } from '../services/slack';
import { indexEmail } from '../services/elastic';

dotenv.config();

const connection = process.env.REDIS_URL 
  ? new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
  : new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: null,
    });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const emailWorker = new Worker(
  'email-queue',
  async (job: Job) => {
    const { scheduledEmailId, receiver, userId, delayBetween, hourlyLimit } = job.data;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    // Rate Limiting Logic (Hourly limit per sender)
    if (hourlyLimit > 0) {
      const currentHour = new Date().setMinutes(0, 0, 0); // Start of current hour
      const redisKey = `rate_limit:${userId}:${currentHour}`;
      
      const sentCount = await connection.incr(redisKey);
      
      if (sentCount === 1) {
        // Set expiry for 1 hour to clean up redis
        await connection.expire(redisKey, 3600);
      }

      if (sentCount > hourlyLimit) {
        // Limit reached, calculate delay to next hour
        const nextHour = new Date(currentHour).getTime() + 3600000;
        const delayToNextHour = nextHour - Date.now();
        
        console.log(`[Rate Limit Hit] User ${userId} hit limit. Delaying job by ${delayToNextHour}ms`);
        
        if (user.slackWebhook || user.slackToken) {
           await sendSlackNotification(user, `🚨 Hourly email limit reached (${hourlyLimit}). Remaining jobs delayed to next hour.`);
        }
        
        // Throw an error that BullMQ can catch and we will handle in a specific way
        // But better is to just move it back to queue with delay
        await job.moveToDelayed(Date.now() + delayToNextHour, job.token);
        return; // Stop processing this job now, it will retry later
      }
    }

    const scheduledEmail = await prisma.scheduledEmail.findUnique({
      where: { id: scheduledEmailId }
    });

    if (!scheduledEmail) throw new Error('Scheduled email not found');

    try {
      // Minimum delay between individual email sends
      if (delayBetween > 0) {
         await sleep(delayBetween * 1000);
      }

      const info = await transporter.sendMail({
        from: '"ReachInbox" <no-reply@reachinbox.ai>',
        to: receiver,
        subject: scheduledEmail.subject,
        text: scheduledEmail.body,
      });

      console.log('Message sent: %s', info.messageId);

      const sentRecord = await prisma.sentEmail.create({
        data: {
          userId,
          scheduledJobId: scheduledEmailId,
          receiver,
          subject: scheduledEmail.subject,
          body: scheduledEmail.body,
          status: 'sent',
        }
      });

      // Index in Elasticsearch
      await indexEmail({
        id: sentRecord.id,
        subject: sentRecord.subject,
        receiver: sentRecord.receiver,
        body: sentRecord.body,
        status: 'sent',
        type: 'sent'
      });

    } catch (error: any) {
      console.error('Failed to send email:', error);
      await prisma.sentEmail.create({
        data: {
          userId,
          scheduledJobId: scheduledEmailId,
          receiver,
          subject: scheduledEmail.subject,
          body: scheduledEmail.body,
          status: 'failed',
          error: error.message
        }
      });
      throw error;
    }
  },
  { 
    connection,
    concurrency: 5 // Process 5 jobs concurrently
  }
);
