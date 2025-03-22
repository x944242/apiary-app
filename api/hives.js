import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('hives')
        .select('id, apiary_id, name, hive_type');
      if (error) throw error;
      res.status(200).json(data);
    } catch (err) {
      console.error('Error fetching hives:', err);
      res.status(500).json({ error: err.message });
    }
  } else if (req.method === 'POST') {
    const { name, currentApiary, type } = req.body;
    try {
      let apiaryId = null;
      if (currentApiary) {
        const { data: apiary, error: apiaryError } = await supabase
          .from('apiaries')
          .select('id')
          .eq('name', currentApiary)
          .single();
        if (apiaryError) throw apiaryError;
        apiaryId = apiary?.id || null;
      }

      const { data, error } = await supabase
        .from('hives')
        .insert([{ apiary_id: apiaryId, name: name || '', hive_type: type || 'Langstroth' }])
        .select();
      if (error) throw error;
      res.status(201).json(data[0]);
    } catch (err) {
      console.error('Error adding hive:', err);
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};