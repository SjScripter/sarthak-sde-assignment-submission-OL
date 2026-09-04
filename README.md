# ReachInbox - Full-stack Email Job Scheduler

A production-grade email scheduler service and dashboard.

## Architecture

This project is structured as a monorepo containing a `server` (backend) and `client` (frontend).

### Scheduling & Persistence
- We use **BullMQ** backed by **Redis** as the job queue.
- To schedule emails, we use BullMQ's built-in `delay` feature rather than cron jobs. This means we calculate the time difference between "now" and the "scheduled time" and add the job with that delay.
- Because jobs are stored in Redis, they persist across server restarts. If the Node.js process crashes, BullMQ will pick up the delayed jobs exactly where it left off when it restarts.

### Rate Limiting & Concurrency
- **Concurrency**: The BullMQ worker is configured to process up to 5 jobs concurrently (`concurrency: 5`).
- **Hourly Rate Limit**: Implemented using a custom Redis counter keyed by `rate_limit:{userId}:{currentHourTimestamp}`. 
  - Before sending, the worker increments this counter.
  - If the count exceeds the `hourlyLimit`, the worker calculates the time remaining until the next hour window and re-schedules the job (using `job.moveToDelayed`) to run then.
  - This preserves the queue state without dropping jobs.
- **Delay Between Sends**: A simple `sleep` is implemented in the worker to simulate a provider delay (e.g., waiting 2 seconds before calling the SMTP transport).

### Slack Notifications
- A mock OAuth flow is provided. You can connect a Slack workspace and it will save the token/webhook to the database.
- When an hourly rate limit is hit, the worker checks if the user has a connected Slack account and sends an alert.

### Elasticsearch
- Sent emails are indexed in an Elasticsearch cluster.
- The dashboard allows searching across these indexed emails (Subject, Body, Receiver) via the backend search API.

## Requirements

- Node.js (v18+)
- Docker (for Redis, PostgreSQL, Elasticsearch)

## Getting Started

### 1. Start Infrastructure
Run the following at the root of the project to spin up PostgreSQL, Redis, and Elasticsearch.
```bash
docker compose up -d
```

### 2. Setup Backend (`/server`)

Create a `.env` file in the `/server` directory:
```env
PORT=4000
DATABASE_URL="postgresql://root:rootpassword@localhost:5432/reachinbox_db?schema=public"
REDIS_HOST="localhost"
REDIS_PORT=6379
ELASTICSEARCH_NODE="http://localhost:9200"

# Ethereal Email (Generate at https://ethereal.email/)
SMTP_HOST="smtp.ethereal.email"
SMTP_PORT=587
SMTP_USER="your-ethereal-user"
SMTP_PASS="your-ethereal-pass"

# Auth Config
JWT_SECRET="super-secret-jwt-key"

# Slack OAuth (Optional for real test, required if you want actual Slack msgs)
SLACK_CLIENT_ID=""
SLACK_CLIENT_SECRET=""
SLACK_REDIRECT_URI="http://localhost:4000/api/slack/oauth_redirect"
```

Install dependencies, run migrations, and start:
```bash
cd server
npm install
npx prisma db push
npm run dev
```

*Note: The BullMQ dashboard is available at `http://localhost:4000/admin/queues`*

### 3. Setup Frontend (`/client`)

Open a new terminal:
```bash
cd client
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`. 
Mock Google Login is configured, so just click "Sign in with Google" to access the dashboard.
