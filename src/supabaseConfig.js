import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://laxslqxepzxxpkbnocic.supabase.co';
const supabaseKey = 'sb_publishable_L983uwBjQxEcEcP8EflQRQ_F-A4dcoy';

export const supabase = createClient(supabaseUrl, supabaseKey);
