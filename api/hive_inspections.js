import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('hive_inspections')
        .select('*'); // Or filter if needed
      if (error) throw error;
      return res.status(200).json(data);
    } catch (err) {
      console.error('Error fetching hive inspections:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    console.log("📥 Received inspection data:", req.body);
    return res.status(200).json({ message: 'Mock: Inspection saved successfully' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
