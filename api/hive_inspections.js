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
      queenStatusData,
      broodPresenceData,
      actions,
      notes,
      completed_action_ids,
      ...inspectionData
    } = req.body;
  
    console.log('📥 Received inspection submission:', req.body);
  
    const inspectionPayload = {
      ...inspectionData,
      notes,
    };
  
    console.log('🧪 Final inspection insert payload:', inspectionPayload);
  
    try {
      // 1. Insert into hive_inspections
      const { data: inspection, error: insertInspectionError } = await supabase
        .from('hive_inspections')
        .insert([inspectionPayload])
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
      const hiveId = inspectionData.hive_id;
  
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
  
      // 3. Insert into brood_presence
      if (broodPresenceData) {
        const broodPresenceToInsert = {
          inspection_id: inspectionId,
          ...broodPresenceData,
        };
        const { error: insertBroodError } = await supabase
          .from('brood_presence')
          .insert([broodPresenceToInsert]);
  
        if (insertBroodError) {
          console.error("❌ DB Error inserting into brood_presence", insertBroodError);
          return res.status(500).json({ error: insertBroodError.message });
        }
      }
  
      // 4. Insert into queen_status (if present)
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
  
      // 5. Update completed hive_actions
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
  
      // ✅ 6. Insert new actions from the form into hive_actions
      if (actions && actions.length > 0) {
        const newActions = actions
          .filter(action => action.text && action.text.trim() !== '')
          .map(action => ({
            hive_id: hiveId,
            inspection_id: inspectionId,
            action_text: action.text.trim(),
            completed: !!action.checked,
          }));
  
        if (newActions.length > 0) {
          const { error: insertActionError } = await supabase
            .from('hive_actions')
            .insert(newActions);
  
          if (insertActionError) {
            console.error('❌ DB Error inserting hive actions:', insertActionError);
            return res.status(500).json({ error: insertActionError.message });
          }
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
