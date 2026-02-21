import { createClient } from '@supabase/supabase-js'

// Supabase 프로젝트 URL과 공개 키 (나중에 실제 값으로 교체하세요)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
