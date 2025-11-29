# Supabase Email Schema Setup

## Quick Setup

1. Open your Supabase project
2. Go to **SQL Editor**
3. Copy and paste the contents of [`supabase-email-schema.sql`](file:///Users/aaravgandhi/Downloads/rfq/supabase-email-schema.sql)
4. Click **Run**

## What Gets Created

### New Tables:
- ✅ `email_accounts` - Store Gmail/Yahoo/cPanel credentials
- ✅ `processed_emails` - Track all incoming emails
- ✅ `admin_users` - Admin login credentials
- ✅ `email_processing_log` - Detailed processing logs

### Updated Tables:
- ✅ `products` - Added bulk import tracking
- ✅ `rfq_requests` - Added email linkage

### Default Admin Login:
- **Username:** `admin`
- **Password:** `admin123` (⚠️ Change this after first login!)

## After Running SQL

Update your `.env.local` with:
```bash
# Add to existing .env.local
OPENAI_API_KEY=your_openai_api_key_here
NEXTAUTH_SECRET=generate_random_secret_here
```

Then I'll continue building the email monitoring system! 🚀
