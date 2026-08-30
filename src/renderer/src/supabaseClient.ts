import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = 
  import.meta.env?.VITE_SUPABASE_URL || 'https://jfehfblygghjzwvgrjmk.supabase.co'

export const SUPABASE_ANON_KEY = 
  import.meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmZWhmYmx5Z2doanp3dmdyam1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNTQ4NTEsImV4cCI6MjEwMzYzMDg1MX0.LzsFknA88zyLen8coDhM1xKEkdfQznGd1lU9nls0Hws'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})

