# CancerGuardian Platform

CancerGuardian is a medical platform that uses AI to detect cancer risk through questionnaires and image analysis, providing personalized health recommendations.

## Features

- Basic and advanced cancer risk assessment tests
- AI-powered risk analysis using Gemini API
- User accounts and test result history
- Hospital finder with appointment scheduling
- AI chatbot for cancer-related questions
- Personalized recovery plans
- Community support

## Tech Stack

- **Frontend**: React with TypeScript
- **Backend**: Node.js with Express
- **Database**: PostgreSQL via Supabase
- **ORM**: Drizzle for direct database interaction
- **Styling**: Tailwind CSS with shadcn/ui components
- **AI**: Google Gemini API for intelligent responses
- **Authentication**: Session-based auth with Passport.js

## Setup Instructions

1. Clone the repository
2. Copy `.env.template` to `.env` and fill in the required values
3. Install dependencies:
   ```
   npm install
   ```
4. Create database tables by running the SQL in `database.sql` in your Supabase project

## Supabase Setup

1. Create a new project in [Supabase](https://supabase.com)
2. Go to SQL Editor and run the contents of `database.sql`
3. Get your API keys from Project Settings > API
4. Set the following environment variables in your `.env` file:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anon/public key
   - `SUPABASE_SERVICE_KEY`: Your Supabase service role key (for admin functions)
   - `DATABASE_URL`: Your PostgreSQL connection string (for session storage)

### Testing Supabase Connection

To verify your Supabase connection is working properly:

```
node scripts/test-supabase.js
```

This will test connectivity to your Supabase database and verify the required tables exist. If successful, you should see a confirmation message.

### Data Migration

If switching from in-memory storage to Supabase:

1. Ensure your Supabase project has all tables created by running `database.sql`
2. Set the `SUPABASE_URL` and `SUPABASE_ANON_KEY` environment variables
3. Restart the application - it will automatically use the Supabase implementation

## Running the Application

Start the development server:

```
npm run dev
```

The application will be available at http://localhost:5000

## Database Schema

The application uses several tables:

- `users`: User accounts and profiles
- `test_results`: Results from basic and advanced tests
- `hospitals`: Healthcare facilities for appointments
- `appointments`: Scheduled hospital visits
- `recovery_plans`: Personalized recovery plans
- `recovery_activities`: Activities for recovery plans
- `community_posts`: User community posts
- `comments`: Comments on community posts

See `database.sql` for the complete schema definition.

## API Routes

- `/api/user`: Get current user info
- `/api/login`, `/api/register`, `/api/logout`: Authentication 
- `/api/test-results`: CRUD operations for test results
- `/api/hospitals`: List and filter hospitals
- `/api/generate-question`: Get follow-up questions for tests
- `/api/generate-assessment`: Get risk assessment based on answers
- `/api/chatbot`: AI chatbot responses