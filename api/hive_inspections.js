import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('hive_inspections')
        .select('*');

      if (error) {
        console.error('Error fetching hive inspections:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(data);
    } catch (err) {
      console.error('Error fetching hive inspections:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    const {
      colonyStrengthData,
      actions,
      notes,
      queenStatusData,
      completed_action_ids,
      ...inspectionData
    } = req.body;

    console.log('📥 Received inspection submission:', req.body);

    try {
      // 1. Insert into hive_inspections
      const { data: inspection, error: insertInspectionError } = await supabase
        .from('hive_inspections')
        .insert([{ ...inspectionData, actions, notes }])
        .select();

      if (insertInspectionError) {
        console.error('❌ DB Error inserting into hive_inspections:', insertInspectionError);
        return res.status(500).json({ error: insertInspectionError.message });
      }

      if (!inspection || inspection.length === 0) {
        const errorMessage = 'Failed to insert inspection: No data returned.';
        console.error('❌', errorMessage);
        return res.status(500).json({ error: errorMessage });
      }

      const inspectionId = inspection[0].id;

      // 2. Insert into colony_strength (if present)
      if (colonyStrengthData) {
        const strengthPayload = {
          inspection_id: inspectionId,
          ...colonyStrengthData,
        };
        const { error: insertStrengthError } = await supabase
          .from('colony_strength')
          .insert([strengthPayload]);

        if (insertStrengthError) {
          console.error('❌ DB Error inserting into colony_strength:', insertStrengthError);
          return res.status(500).json({ error: insertStrengthError.message });
        }
      }

      // 3. Insert into queen_status (if present)
      if (queenStatusData) {
        const queenPayload = {
          inspection_id: inspectionId,
          ...queenStatusData,
        };
        const { error: insertQueenError } = await supabase
          .from('queen_status')
          .insert([queenPayload]);

        if (insertQueenError) {
          console.error('❌ DB Error inserting into queen_status:', insertQueenError);
          return res.status(500).json({ error: insertQueenError.message });
        }
      }

      // 4. Update completed hive_actions
      if (completed_action_ids && completed_action_ids.length > 0) {
        const { error: updateError } = await supabase
          .from('hive_actions')
          .update({
            completed: true,
            completed_at: new Date().toISOString(),
          })
          .in('id', completed_action_ids);

        if (updateError) {
          console.error('❌ DB Error updating hive_actions:', updateError);
          return res.status(500).json({ error: updateError.message });
        }
      }

      console.log('✅ Inspection saved successfully');
      return res.status(201).json(inspection[0]);
    } catch (err) {
      console.error('❌ Unexpected server error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
