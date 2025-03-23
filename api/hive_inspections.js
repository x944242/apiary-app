import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('hive_inspections')
        .select('*');
      if (error) {
        console.error('Error fetching hive inspections:', error);
        return res.status(500).json({ error: error.message }); // * Ensure JSON response
      }
      return res.status(200).json(data);
    } catch (err) {
      console.error('Error fetching hive inspections:', err);
      return res.status(500).json({ error: 'Internal server error' }); // * More generic error
    }
  }

  if (req.method === 'POST') {
    const { colonyStrengthData, actions, notes, ...inspectionData } = req.body;
    console.log('Received data:', req.body);

    try {
      // 1. Insert into hive_inspections
      const { data: inspection, error: insertInspectionError } = await supabase
        .from('hive_inspections')
        .insert([{ ...inspectionData, actions, notes }])
        .select();

      if (insertInspectionError) {
        console.error("DB Error inserting into hive_inspections", insertInspectionError);
        return res.status(500).json({ error: insertInspectionError.message });
      }

      if (!inspection || inspection.length === 0) {
        const errorMessage = "Failed to insert inspection: No data returned from insert operation.";
        console.error(errorMessage);
        return res.status(500).json({ error: errorMessage });
      }
      const inspectionId = inspection[0].id;

      // 2. Insert into colony_strength
      if (colonyStrengthData) {
        const colonyStrengthToInsert = {
          inspection_id: inspectionId,
          ...colonyStrengthData,
        };
        const { data: colonyStrengthResult, error: insertStrengthError } = await supabase
          .from('colony_strength')
          .insert([colonyStrengthToInsert]);

        if (insertStrengthError) {
          console.error("DB Error inserting into colony_strength", insertStrengthError);
          return res.status(500).json({ error: insertStrengthError.message });
        }
        if (!colonyStrengthResult || colonyStrengthResult.length === 0) {
          console.warn("Colony strength data was provided, but the insert operation did not return any data.");
        }
      }

      // 3. Update completed actions
      if (req.body.completed_action_ids && req.body.completed_action_ids.length > 0) {
        const { error: updateError } = await supabase
          .from('hive_actions')
          .update({ completed: true, completed_at: new Date().toISOString() })
          .in('id', req.body.completed_action_ids);
        if (updateError) {
          console.error("DB Error updating hive_actions", updateError);
          return res.status(500).json({ error: updateError.message });
        }
      }

      const responseData = inspection[0];
      console.log('Response data:', responseData);
      return res.status(201).json(responseData);
    } catch (err) {
      console.error('Error saving inspection data:', err);
      return res.status(500).json({ error: 'Internal server error' }); // * More generic error
    }
  }

  console.log("Received data:", req.body);
  return res.status(405).json({ error: 'Method not allowed' });
}
