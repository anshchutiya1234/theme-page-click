# Supabase Setup Guide for Leverage Money Dashboard

This guide will help you recreate your Supabase project from scratch after it was accidentally deleted.

## Prerequisites

1. **Supabase CLI** - Install it if you haven't already:
   ```bash
   npm install -g supabase
   ```

2. **Node.js and npm** - Make sure you have these installed.

## Step 1: Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Fill in the project details:
   - **Name**: `leverage-money-dashboard` (or any name you prefer)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the region closest to your users
5. Click "Create new project"
6. Wait for the project to be created (this may take a few minutes)

## Step 2: Get Your Project Credentials

Once your project is created, you'll need to copy the following credentials:

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **anon (public) key** (long JWT token)
   - **service_role (secret) key** (long JWT token - keep this secret!)

## Step 3: Update Your Local Configuration

### 3.1 Update the Supabase Client Configuration

Update the file `src/integrations/supabase/client.ts` with your new credentials:

```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "YOUR_PROJECT_URL_HERE";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "YOUR_ANON_KEY_HERE";
```

### 3.2 Create Environment Variables

Create a `.env.local` file in your project root:

```bash
VITE_SUPABASE_URL=your-project-url-here
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_EDGE_FUNCTIONS_URL=https://your-project-id.supabase.co/functions/v1
```

### 3.3 Update Supabase Config

Update `supabase/config.toml`:

```toml
project_id = "your-project-id"

[functions.track-click]
verify_jwt = false

[functions.redirect]
verify_jwt = false
```

## Step 4: Set Up Database Schema

### 4.1 Initialize Supabase Locally

```bash
supabase init
```

### 4.2 Link to Your Remote Project

```bash
supabase link --project-ref YOUR_PROJECT_ID
```

### 4.3 Apply Database Migrations

Run the database migration that was created for you:

```bash
supabase db push
```

This will create all the necessary tables, functions, and policies in your new Supabase project.

## Step 5: Set Up Authentication

### 5.1 Configure Authentication Settings

1. Go to **Authentication** → **Settings** in your Supabase dashboard
2. Configure the following:
   - **Site URL**: Your application URL (e.g., `http://localhost:5173` for development)
   - **Redirect URLs**: Add your application URLs where users should be redirected after auth

### 5.2 Enable Email Auth

1. Go to **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. Configure any additional providers you need

## Step 6: Create Edge Functions

### 6.1 Deploy the Redirect Function

```bash
supabase functions deploy redirect
```

### 6.2 Deploy the Track-Click Function

```bash
supabase functions deploy track-click
```

### 6.3 Set Edge Function Environment Variables

In your Supabase dashboard, go to **Edge Functions** → **Settings** and add:

- `SUPABASE_URL`: Your project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

## Step 7: Create an Admin User

### 7.1 Sign Up a New User

1. Run your application locally: `npm run dev`
2. Go to the sign-up page and create a new account
3. This will be your admin account

### 7.2 Make the User an Admin

1. Go to your Supabase dashboard
2. Navigate to **Table Editor** → **users**
3. Find the user you just created
4. Edit the row and set `is_admin` to `true`

## Step 8: Test Your Setup

### 8.1 Test Basic Functionality

1. **Authentication**: Try logging in and out
2. **Dashboard**: Check if stats are loading
3. **URL Shortening**: Create a short URL and test redirection
4. **Admin Panel**: Access the admin panel with your admin user

### 8.2 Test Edge Functions

1. **Redirect Function**: Create a short URL and test `yourdomain.com/r/shortcode`
2. **Track-Click Function**: Verify that clicks are being tracked

## Step 9: Update Types (Optional)

If you want to regenerate TypeScript types from your database:

```bash
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

## Troubleshooting

### Common Issues

1. **RLS Policies**: If you get permission errors, check that Row Level Security policies are properly configured
2. **Function Errors**: Make sure environment variables are set for edge functions
3. **CORS Errors**: Ensure your site URL is properly configured in Supabase settings

### Useful Commands

```bash
# Check Supabase status
supabase status

# View logs
supabase functions logs

# Reset local database (if needed)
supabase db reset

# Pull remote changes
supabase db pull
```

## Security Checklist

- [ ] Updated all hardcoded URLs and keys
- [ ] Set up proper environment variables
- [ ] Configured authentication settings
- [ ] Created admin user
- [ ] Tested all major functionality
- [ ] Verified RLS policies are working
- [ ] Edge functions are deployed and working

## Next Steps

After completing this setup:

1. **Backup**: Set up regular backups of your database
2. **Monitoring**: Set up monitoring and alerts
3. **Documentation**: Update any documentation with new URLs
4. **Team Access**: Grant access to team members if needed

## Support

If you encounter any issues:

1. Check the Supabase dashboard logs
2. Review the browser console for client-side errors
3. Check edge function logs in the Supabase dashboard
4. Refer to the [Supabase documentation](https://supabase.com/docs)

---

**Important**: Keep your service role key secure and never commit it to version control! 