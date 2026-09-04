import axios from 'axios';

export const sendSlackNotification = async (user: any, message: string) => {
  try {
    if (user.slackWebhook) {
      await axios.post(user.slackWebhook, { text: message });
    } else if (user.slackToken) {
      await axios.post('https://slack.com/api/chat.postMessage', 
        {
          channel: '#general', // This ideally comes from the user config
          text: message
        },
        {
          headers: {
            Authorization: `Bearer ${user.slackToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
    }
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
  }
};
