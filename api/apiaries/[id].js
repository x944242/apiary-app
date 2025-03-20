import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  const { id } = req.query; // Access dynamic parameter

  if (req.method === 'PUT') {
    const { name, postcode } = req.body;
    try {
      const { data, error } = await supabase
        .from('apiaries')
        .update({ name: name || null, postcode: postcode || null })
        .eq('id', id)
        .select();
      if (error) throw error;
      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Apiary not found' });
      }
      res.status(200).json(data[0]);
    } catch (err) {
      console.error('Error updating apiary:', err);
      res.status(500).json({ error: err.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      // Unassign all hives from this apiary
      const { error: hiveError } = await supabase
        .from('hives')
        .update({ apiary_id: null })
        .eq('apiary_id', id);
      if (hiveError) throw hiveError;

      // Delete the apiary
      const { data, error: deleteError } = await supabase
        .from('apiaries')
        .delete()
        .eq('id', id);
      if (deleteError) throw deleteError;

      res.status(200).json({ message: 'Apiary deleted successfully' });
    } catch (err) {
      console.error('Error deleting apiary:', err);
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};