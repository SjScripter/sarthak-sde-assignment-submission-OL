# ReachInbox - Full-stack Email Job Scheduler

A production-grade email scheduler service and dashboard, designed for high-concurrency and resilience.

## 🚀 Live Demo
- **Frontend Hosted on Vercel:** [Your Vercel URL Here]

*(Note: The backend requires a local setup for the SMTP, Redis, Elasticsearch, and PostgreSQL connections to fully function)*

## 🛠️ Tech Stack & Technologies Used

### Frontend
- **React 18** with **TypeScript**
- **Vite** for blazing fast builds
- **Tailwind CSS** for responsive, modern styling
- **Lucide React** for icons
- **Axios** for API requests
- **PapaParse** for robust CSV parsing

### Backend
- **Node.js** & **Express** with **TypeScript**
- **Prisma ORM** for type-safe database interactions
- **PostgreSQL** (Hosted on Supabase) for primary data storage
- **BullMQ** backed by **Redis** (Upstash) for the robust job queue and email scheduling
- **Elasticsearch** (Bonsai) for lightning-fast indexing and searching of sent emails

### Integrations
- **Ethereal Email:** Mock SMTP service for sending emails safely
- **Slack API:** OAuth flow and webhook integration for sending alerts when rate limits are hit

## 🏗️ Architecture & Core Features

### 1. Scheduling & Persistence (BullMQ + Redis)
- To schedule emails, we use BullMQ's built-in `delay` feature rather than standard cron jobs. The time difference is calculated between "now" and the "scheduled time".
- Because jobs are stored in Redis, they persist across server restarts. If the Node.js process crashes, BullMQ picks up the delayed jobs exactly where it left off, ensuring zero data loss.
- **Dashboard:** A BullMQ admin dashboard is available at `/admin/queues` to visually monitor pending, active, and failed jobs.

### 2. Rate Limiting & Concurrency
- **Concurrency:** The BullMQ worker is configured to process up to 5 jobs concurrently (`concurrency: 5`).
- **Hourly Rate Limit:** Implemented using a custom Redis counter keyed by `rate_limit:{userId}:{currentHourTimestamp}`. 
  - Before sending an email, the worker increments this counter.
  - If the count exceeds the `hourlyLimit`, the worker calculates the time remaining until the next hour window and re-schedules the job (using `job.moveToDelayed`) to run then.
  - This preserves the queue state without dropping any emails.
- **Delay Between Sends:** A `sleep` function is implemented in the worker to simulate a provider delay (e.g., waiting 2 seconds before calling the SMTP transport).

### 3. Slack Notifications
- A complete OAuth flow is provided. Users can connect a Slack workspace, which securely saves the token and webhook URL to the database.
- When an hourly rate limit is hit, the worker checks if the user has a connected Slack account and dispatches an automated alert.

### 4. Elasticsearch Integration
- Sent emails are immediately indexed in an Elasticsearch cluster.
- The dashboard allows lightning-fast, full-text searching across these indexed emails (searching by Subject, Body, or Receiver) via the backend search API.

---

## 💻 Local Setup & Installation

### Requirements
- Node.js (v18+)

### 1. Setup Backend (`/server`)

Create a `.env` file in the `/server` directory:
```env
PORT=4000
DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]:5432/postgres"
REDIS_URL="redis://[USER]:[PASSWORD]@[HOST]:6379"
ELASTICSEARCH_NODE="https://[USER]:[PASSWORD]@[HOST]"

# Ethereal Email (Generate at https://ethereal.email/)
SMTP_HOST="smtp.ethereal.email"
SMTP_PORT=587
SMTP_USER="your-ethereal-user"
SMTP_PASS="your-ethereal-pass"

# Auth Config
JWT_SECRET="super-secret-jwt-key"

# Slack OAuth 
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

### 2. Setup Frontend (`/client`)

Open a new terminal:
```bash
cd client
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`. 
Mock Google Login is configured, so just click "Sign in with Google" to access the dashboard.
