import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  const { id } = req.query; // Access dynamic parameter

  if (req.method === 'PUT') {
    const { name, apiary_id, hive_type } = req.body;
    try {
      const { data, error } = await supabase
        .from('hives')
        .update({ name, apiary_id, hive_type })
        .eq('id', id)
        .select();
      if (error) throw error;
      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Hive not found' });
      }
      res.status(200).json(data[0]);
    } catch (err) {
      console.error('Error updating hive:', err);
      res.status(500).json({ error: err.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { data, error } = await supabase
        .from('hives')
        .delete()
        .eq('id', id);
      if (error) throw error;
      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Hive not found' });
      }
      res.status(200).json({ message: 'Hive deleted successfully' });
    } catch (err) {
      console.error('Error deleting hive:', err);
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};