import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

  try {
    const { data, error } = await supabase
      .from('apiaries')
      .select('id, name, postcode');
    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    console.error('Error fetching apiaries:', err);
    res.status(500).json({ error: err.message });
  }
};