import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('hive_inspections')
        .select('*');
      if (error) throw error;
      return res.status(200).json(data);
    } catch (err) {
      console.error('Error fetching hive inspections:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    const { completed_action_ids, ...inspectionData } = req.body;
    try {
      // Insert the inspection into the database
      const { data: inspection, error: insertError } = await supabase
        .from('hive_inspections')
        .insert([inspectionData])
        .select();
      if (insertError) throw insertError;

      const inspectionId = inspection[0].id;

      // Update completed actions if any are provided
      if (completed_action_ids && completed_action_ids.length > 0) {
        const { error: updateError } = await supabase
          .from('hive_actions')
          .update({ completed: true, completed_at: new Date().toISOString() })
          .in('id', completed_action_ids);
        if (updateError) throw updateError;
      }

      return res.status(201).json({ id: inspectionId, ...inspection[0] });
    } catch (err) {
      console.error('Error saving inspection:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  console.log("Received data:", req.body);
  return res.status(405).json({ error: 'Method not allowed' });
}