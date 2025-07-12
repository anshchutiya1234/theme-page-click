# Database Schema Documentation

This document explains the database schema for the Leverage Money Dashboard application.

## Tables Overview

### `users`
Stores user profile information and extends the built-in `auth.users` table.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, references `auth.users.id` |
| `name` | TEXT | User's full name |
| `username` | TEXT | Unique username |
| `email` | TEXT | User's email address |
| `instagram_username` | TEXT | Instagram handle |
| `partner_code` | TEXT | Unique referral code (auto-generated) |
| `referred_by` | TEXT | Partner code of the user who referred them |
| `joined_at` | TIMESTAMPTZ | When the user joined |
| `is_admin` | BOOLEAN | Whether the user has admin privileges |

### `clicks`
Tracks clicks on referral links and manages the earning system.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | User who owns the click |
| `source_user_id` | UUID | User who generated the click (for bonus clicks) |
| `type` | TEXT | Either 'direct' or 'bonus' |
| `ip_address` | TEXT | IP address of the click |
| `user_agent` | TEXT | User agent string |
| `created_at` | TIMESTAMPTZ | When the click occurred |

### `messages`
Handles messaging between users and admins.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `sender_id` | UUID | User who sent the message |
| `receiver_id` | UUID | User who receives the message |
| `content` | TEXT | Message content |
| `is_read` | BOOLEAN | Whether the message has been read |
| `is_admin` | BOOLEAN | Whether the message is from an admin |
| `is_broadcast` | BOOLEAN | Whether it's a broadcast message |
| `created_at` | TIMESTAMPTZ | When the message was created |

### `short_urls`
Manages URL shortening functionality.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | User who created the short URL |
| `short_code` | TEXT | Unique short code (auto-generated) |
| `target_url` | TEXT | The URL to redirect to |
| `created_at` | TIMESTAMPTZ | When the short URL was created |

### `withdrawals`
Tracks withdrawal requests and their status.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | User requesting the withdrawal |
| `amount` | DECIMAL | Amount to withdraw |
| `click_count` | INTEGER | Number of clicks this withdrawal is based on |
| `payment_method` | TEXT | Payment method (paypal, upi, crypto) |
| `payment_details` | TEXT | Payment details (email, UPI ID, etc.) |
| `status` | TEXT | pending, approved, or rejected |
| `admin_message` | TEXT | Message from admin about the withdrawal |
| `created_at` | TIMESTAMPTZ | When the withdrawal was requested |

## Database Functions

### `get_user_stats(user_id UUID)`
Returns comprehensive statistics for a user:
- `direct_clicks`: Number of direct clicks
- `bonus_clicks`: Number of bonus clicks
- `total_earnings`: Total earnings in dollars
- `sub_partners_count`: Number of sub-partners referred

### `check_withdrawal_eligibility(user_id UUID)`
Checks if a user is eligible for withdrawal:
- `is_eligible`: Whether user meets withdrawal criteria
- `days_since_signup`: Days since user joined
- `total_clicks`: Total clicks across all types

### `register_click(referrer_code TEXT)`
Registers a new click for a referral code and returns success status.

### `generate_unique_partner_code()`
Generates a unique 8-character partner code.

### `generate_unique_short_code()`
Generates a unique 6-character short code for URLs.

### `get_unread_messages_count(user_id UUID)`
Returns the number of unread messages for a user.

### `is_admin()`
Checks if the current user has admin privileges.

### `clear_direct_clicks()`
Admin function to clear all direct clicks (admin only).

### `update_referral_and_add_bonus(user_id_param UUID, referrer_code_param TEXT, referrer_id_param UUID)`
Updates a user's referral and adds 500 bonus clicks to the referrer.

## Business Logic

### Click Tracking System
1. **Direct Clicks**: When someone clicks a user's referral link
2. **Bonus Clicks**: 20% of sub-partner clicks are credited as bonus clicks
3. **Earnings**: Each click is worth $0.10

### Referral System
1. Users get a unique partner code upon signup
2. When someone signs up with a partner code, they become a sub-partner
3. The referrer gets 500 bonus clicks immediately
4. The referrer gets 20% of all future direct clicks from sub-partners

### Withdrawal System
1. Users must be active for 30+ days
2. Users must have 100+ total clicks
3. Withdrawals are processed manually by admins
4. Minimum withdrawal amount is based on total clicks × $0.10

## Security

### Row Level Security (RLS)
All tables have RLS enabled with policies that:
- Allow users to view/edit their own data
- Allow admins to view/edit all data
- Restrict sensitive operations to appropriate users

### Authentication
- Uses Supabase Auth for user management
- Automatic user profile creation via triggers
- JWT-based authentication for API access

## Triggers

### `on_auth_user_created`
Automatically creates a user profile in `public.users` when someone signs up via Supabase Auth.

### `trigger_auto_generate_partner_code`
Automatically generates a unique partner code for new users.

### `trigger_auto_generate_short_code`
Automatically generates a unique short code for new URL shortening requests. 