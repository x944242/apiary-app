import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

  if (req.method === 'GET') {
    const { hive_id, completed } = req.query;
    try {
      let query = supabase.from('hive_actions').select('*');
      if (hive_id) query = query.eq('hive_id', hive_id);
      if (completed !== undefined) query = query.eq('completed', completed === 'true');
      const { data, error } = await query;
      if (error) throw error;
      res.status(200).json(data);
    } catch (err) {
      console.error('Error fetching hive actions:', err);
      res.status(500).json({ error: err.message });
    }
  } else if (req.method === 'POST') {
    const { hive_id, action_text, inspection_id } = req.body;
    try {
      const { data, error } = await supabase
        .from('hive_actions')
        .insert([{ hive_id, action_text, inspection_id, completed: false }])
        .select();
      if (error) throw error;
      res.status(201).json(data[0]);
    } catch (err) {
      console.error('Error creating hive action:', err);
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};