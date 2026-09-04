import { Router } from 'express';
import { prisma } from '../index';
import { emailQueue } from '../queue';
import { searchEmails } from '../services/elastic';

const router = Router();

// Schedule a new email or bulk emails
router.post('/schedule', async (req, res) => {
  const { userId, subject, body, receivers, scheduledTime, delayBetween, hourlyLimit } = req.body;
  
  if (!userId || !receivers || receivers.length === 0 || !scheduledTime) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const scheduledRecords = [];
    
    // We will create one ScheduledEmail record per receiver to track status independently
    // (This mimics how standard email marketing tools work).
    // Or we could have one parent record and loop them. Let's create multiple for simplicity in the UI.
    for (const receiver of receivers) {
      const record = await prisma.scheduledEmail.create({
        data: {
          userId,
          subject,
          body,
          receivers: receiver,
          scheduledTime: new Date(scheduledTime),
          delayBetween: parseInt(delayBetween) || 0,
          hourlyLimit: parseInt(hourlyLimit) || 0,
        }
      });
      
      const delay = new Date(scheduledTime).getTime() - Date.now();
      
      await emailQueue.add('send-email', {
        scheduledEmailId: record.id,
        receiver,
        userId,
        delayBetween: record.delayBetween,
        hourlyLimit: record.hourlyLimit
      }, {
        delay: Math.max(0, delay) // Cannot have negative delay
      });
      
      scheduledRecords.push(record);
    }
    
    res.json({ message: 'Emails scheduled successfully', scheduledRecords });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to schedule emails', details: error.message });
  }
});

router.get('/scheduled/:userId', async (req, res) => {
  try {
    const emails = await prisma.scheduledEmail.findMany({
      where: { userId: req.params.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(emails);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scheduled emails' });
  }
});

router.get('/sent/:userId', async (req, res) => {
  try {
    const emails = await prisma.sentEmail.findMany({
      where: { userId: req.params.userId },
      orderBy: { sentTime: 'desc' }
    });
    res.json(emails);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sent emails' });
  }
});

router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  
  const results = await searchEmails(q as string);
  res.json(results);
});

export default router;
