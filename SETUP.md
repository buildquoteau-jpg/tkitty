# Travel Kitty — Setup Guide

## Prerequisites

- Node.js 18+ (download from nodejs.org)
- A Supabase account (supabase.com)
- A Clerk account (clerk.com)
- An Anthropic API key (console.anthropic.com)

## 1. Install dependencies

```bash
cd travel-kitty
npm install
```

## 2. Set up environment variables

Copy `.env.local.example` to `.env.local` and fill in all values:

```bash
cp .env.local.example .env.local
```

### Clerk (Authentication)
1. Go to https://dashboard.clerk.com
2. Create a new application
3. Copy the Publishable Key and Secret Key into `.env.local`

### Supabase (Database)
1. Go to https://supabase.com and create a new project
2. Copy your project URL and anon key from Settings → API
3. Also copy the service_role key (keep this secret)
4. Paste all three into `.env.local`

### Anthropic
1. Go to https://console.anthropic.com/settings/keys
2. Create a new API key and paste into `.env.local`

## 3. Set up the database

1. Go to your Supabase project → SQL Editor
2. Open `lib/supabase/schema.sql` from this project
3. Copy the entire contents and paste into the SQL Editor
4. Click "Run" to create all tables

## 4. Run the development server

```bash
npm run dev
```

Open http://localhost:3000

## 5. Create your first group

1. Sign up with your email
2. You'll be redirected to create a group
3. Enter your group name (e.g. "Portugal Girls 2027") and your first name
4. Start planning

## Deployment to Vercel

```bash
npm install -g vercel
vercel
```

Add all environment variables in the Vercel dashboard under Settings → Environment Variables.

## Key Features

- **Savings Dashboard**: Import bank statements via CSV or PDF — Claude parses and reconciles automatically
- **Destination Folders**: Create folders per trip, generate AI itineraries, vote on activities
- **Group Calendar**: Members set availability, Claude finds the best travel window
- **Messages**: Organised discussion threads per topic
- **AI Planning**: Natural language trip design — "Design a 12 day Portugal trip for 9 women who love food and wine"

## Architecture

```
travel-kitty/
├── app/
│   ├── (auth)/          # Clerk sign-in/sign-up pages
│   ├── (dashboard)/     # All authenticated pages
│   │   └── groups/      # Group-specific pages
│   └── api/             # Next.js API routes
├── components/          # React components
├── lib/
│   ├── anthropic.ts     # Claude API integration
│   ├── supabase/        # Supabase client + schema
│   └── constants.ts     # Member colours, destinations, nav
└── types/               # TypeScript types
```
