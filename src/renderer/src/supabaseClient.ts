import { createClient, SupabaseClient } from '@supabase/supabase-js'

export const DEFAULT_SUPABASE_URL = 'https://jfehfblygghjzwvgrjmk.supabase.co'
export const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmZWhmYmx5Z2doanp3dmdyam1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNTQ4NTEsImV4cCI6MjEwMzYzMDg1MX0.LzsFknA88zyLen8coDhM1xKEkdfQznGd1lU9nls0Hws'

export function getSupabaseConfig() {
  const customUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('pos_custom_supabase_url') : null
  const customKey = typeof localStorage !== 'undefined' ? localStorage.getItem('pos_custom_supabase_anon_key') : null

  const url = (customUrl && customUrl.trim()) || import.meta.env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
  const key = (customKey && customKey.trim()) || import.meta.env?.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

  return { url: url.trim(), key: key.trim() }
}

const config = getSupabaseConfig()
export const SUPABASE_URL = config.url
export const SUPABASE_ANON_KEY = config.key

export let supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})

export function reconfigureSupabase(url: string, key: string) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('pos_custom_supabase_url', url)
    localStorage.setItem('pos_custom_supabase_anon_key', key)
  }
  supabase = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  })
}

