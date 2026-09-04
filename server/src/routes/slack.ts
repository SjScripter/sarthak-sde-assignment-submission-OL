import { Router } from 'express';
import { prisma } from '../index';
import axios from 'axios';

const router = Router();

// OAuth callback for Slack
router.get('/oauth_redirect', async (req, res) => {
  const { code, state } = req.query; // state should ideally hold the userId
  const userId = state as string;

  if (!code || !userId) {
    return res.status(400).send('Missing code or state (userId)');
  }

  try {
    const response = await axios.post('https://slack.com/api/oauth.v2.access', null, {
      params: {
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        code,
        redirect_uri: process.env.SLACK_REDIRECT_URI
      }
    });

    if (response.data.ok) {
      // For simplicity, just storing webhook if available, or the bot token
      const webhook = response.data.incoming_webhook?.url;
      const token = response.data.access_token;

      await prisma.user.update({
        where: { id: userId },
        data: {
          slackWebhook: webhook || null,
          slackToken: token || null
        }
      });

      res.send('Slack connected successfully! You can close this window.');
    } else {
      res.status(400).send(`Slack connection failed: ${response.data.error}`);
    }
  } catch (error) {
    res.status(500).send('Server error during Slack OAuth');
  }
});

// Fallback webhook save endpoint
router.post('/webhook', async (req, res) => {
  const { userId, webhookUrl } = req.body;
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { slackWebhook: webhookUrl }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save webhook' });
  }
});

export default router;
