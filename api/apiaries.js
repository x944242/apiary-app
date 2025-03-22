import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

console.log("🔧 Running /api/apiaries");
console.log("🔑 SUPABASE_URL:", process.env.SUPABASE_URL);
console.log("🔑 SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase
      .from('apiaries')
      .select('id, name, postcode');
    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    console.error('❌ Error fetching apiaries:', err.message);
    res.status(500).json({ error: err.message });
  }
}
