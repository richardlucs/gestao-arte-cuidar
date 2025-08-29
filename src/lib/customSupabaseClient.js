import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zznhanicwmumaagigukw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6bmhhbmljd211bWFhZ2lndWt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MjQ0NTIsImV4cCI6MjA3MjAwMDQ1Mn0.5r-47DDRoUNbPgi6i-pEHgj8LUoGWglxcYygoqajyjg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);