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
      return res.status(500).json({ error: err.message }); // * Ensure JSON response
    }
  }

  if (req.method === 'POST') {
    const { colonyStrengthData, actions, notes, ...inspectionData } = req.body;
    console.log('Received data:', req.body); // Log the request body

    try {
      // 1. Insert into hive_inspections
      const { data: inspection, error: insertInspectionError } = await supabase
        .from('hive_inspections')
        .insert([{ ...inspectionData, actions, notes }])
        .select();
      console.log('Supabase insert result (hive_inspections):', { inspection, insertInspectionError }); // Log Supabase result

      if (insertInspectionError) {
        console.error("DB Error on insertInspectionError", insertInspectionError);
        return res.status(500).json({ error: insertInspectionError.message });
      }

      const inspectionId = inspection[0].id;

      // 2. Insert into colony_strength
      if (colonyStrengthData) {
        const colonyStrengthToInsert = {
          inspection_id: inspectionId,
          ...colonyStrengthData,
        };
        const { data: colonyStrengthDataResult, error: insertStrengthError } = await supabase
          .from('colony_strength')
          .insert([colonyStrengthToInsert]);
        console.log('Supabase insert result (colony_strength):', { colonyStrengthDataResult, insertStrengthError }); // Log Supabase result
        if (insertStrengthError) {
          console.error("DB Error on insertStrengthError", insertStrengthError);
          return res.status(500).json({ error: insertStrengthError.message });
        }
      }

      // 3. Update completed actions (remains the same, but ensure JSON on error)
      if (req.body.completed_action_ids && req.body.completed_action_ids.length > 0) {
        const { error: updateError } = await supabase
          .from('hive_actions')
          .update({ completed: true, completed_at: new Date().toISOString() })
          .in('id', req.body.completed_action_ids);
        if (updateError) {
          console.error("DB Error on updateError", updateError);
          return res.status(500).json({ error: updateError.message });
        }
      }

      // * Ensure JSON response
      const responseData = { id: inspectionId, ...inspection[0] };
      console.log('Response data:', responseData);
      return res.status(201).json(responseData);
    } catch (err) {
      console.error('Error saving inspection data:', err);
      return res.status(500).json({ error: err.message }); // * Ensure JSON response
    }
  }

  // * Ensure JSON response for all paths
  console.log("Received data:", req.body);
  return res.status(405).json({ error: 'Method not allowed' }); // * Ensure JSON response
}
