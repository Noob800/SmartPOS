
# Database Migrations for Supabase

This folder contains SQL migration files that can be used to set up your database schema in Supabase.

## How to Apply Migration in Supabase

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `0000_initial_schema.sql`
5. Paste into the SQL editor
6. Click **Run** to execute the migration

### Option 2: Supabase CLI

If you have the Supabase CLI installed:

```bash
# Link your project
supabase link --project-ref your-project-ref

# Push the migration
supabase db push
```

### Option 3: Direct SQL Connection

You can also apply the migration using any PostgreSQL client:

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f migrations/0000_initial_schema.sql
```

## Migration Contents

The initial migration creates:

- **9 tables**: users, products, sales, sale_items, stock_adjustments, settings, accounts, journal_entries, ledger_entries
- **Foreign key constraints** to maintain referential integrity
- **Indexes** for optimized query performance
- **Table comments** for documentation

## Schema Features

- Complete POS system with sales tracking
- Inventory management with stock adjustments
- Double-entry accounting system
- User management with roles
- Flexible settings system

## After Migration

After applying the migration, you'll need to:

1. Update your `.env` file with Supabase connection string
2. Seed initial data (users, products, settings, chart of accounts)
3. Configure Row Level Security (RLS) policies if needed

## Updating from Drizzle to Supabase

If you're migrating from the current Drizzle setup to Supabase:

1. Export your existing data from the current database
2. Apply this migration to your Supabase database
3. Import the exported data
4. Update `DATABASE_URL` in your `.env` to point to Supabase

Your Supabase connection string format:
```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres
```
