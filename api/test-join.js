import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase
      .from('hive_inspections')
      .select(`
        *,
        queen_status(*),
        brood_presence(*),
        colony_strength(*)
      `)
      .order('inspection_date', { ascending: false })
      .limit(5); // Just grab the 5 most recent for test

    if (error) {
      console.error('❌ Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('✅ /api/test-join response:', data);
    return res.status(200).json(data);
  } catch (err) {
    console.error('❌ Unexpected server error:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
