-- Add category and receiver columns to funds table
ALTER TABLE public.funds ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.funds ADD COLUMN IF NOT EXISTS receiver text;
