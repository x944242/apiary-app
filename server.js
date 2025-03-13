require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const app = express();

app.use(express.json());

// ✅ Debug logs for startup
console.log('🚀 Server starting...');
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials. Check your .env file.');
  process.exit(1);
}
console.log('✅ SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('✅ SUPABASE_KEY:', process.env.SUPABASE_KEY.slice(0, 5) + '...');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
console.log('✅ Supabase client initialized');

// ✅ CORS Configuration
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  console.log(`🛠️ Middleware: ${req.method} ${req.path} from ${req.headers.origin || 'Unknown'}`);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// ✅ Server Test Route
app.get('/', (req, res) => {
  res.send('API is running');
});

// ✅ Fetch Inspections
app.get('/hive_inspections', async (req, res) => {
  console.log('📊 GET /hive_inspections');
  try {
    const { data, error } = await supabase
      .from('hive_inspections')
      .select(`
        id, hive_id, inspection_date, general_behavior, flight_activity, population_growth, 
        forager_activity, supering_needed, feeding_required, next_inspection_needs, status, 
        is_deleted, created_at, completed_actions,
        queen_status (queen_seen, queen_marked, queen_mark_color, queen_clipped, egg_laying, 
          supersedure_cells, swarm_cells, notes),
        brood_presence (eggs_present, larvae_present, larvae_stage, sealed_brood, brood_pattern, 
          drone_brood, queen_cells, notes),
        colony_strength (bee_coverage, brood_frames, drone_population, queenright_status, notes)
      `)
      .order('inspection_date', { ascending: false });
    if (error) throw error;
    console.log('Data:', data); // Debug log to check response
    res.json(data);
  } catch (err) {
    console.error('❌ Database error:', err.message, err.stack);
    res.status(500).send('Server error');
  }
});

// ✅ Add Inspection
app.post('/hive_inspections', async (req, res) => {
  console.log('📝 POST /hive_inspections received:', req.body);
  const {
    hive_id, inspection_date, general_behavior, flight_activity, population_growth,
    forager_activity, supering_needed, feeding_required, next_inspection_needs,
    status, is_deleted, completed_actions,
    eggs_present, larvae_present, larvae_stage, sealed_brood, brood_pattern,
    drone_brood, queen_cells,
    bee_coverage, brood_frames, drone_population, queenright_status, colony_notes,
    queen_seen, queen_marked, queen_mark_color, queen_clipped, egg_laying,
    supersedure_cells, swarm_cells, queen_notes, brood_notes
  } = req.body;

  if (!hive_id) {
    console.error('❌ Missing hive_id in request body:', req.body);
    return res.status(400).json({ error: 'hive_id is required' });
  }

  try {
    // ✅ Validate if hive exists
    const { data: hiveData, error: hiveError } = await supabase
      .from('hives')
      .select('id')
      .eq('id', hive_id)
      .single();
    if (!hiveData || hiveError) {
      console.error('❌ Hive not found:', hiveError);
      return res.status(400).json({ error: 'Hive not found' });
    }

    // ✅ Insert into hive_inspections
    const { data: inspectionData, error: inspError } = await supabase
      .from('hive_inspections')
      .insert([
        {
          hive_id,
          inspection_date,
          general_behavior: general_behavior || null,
          flight_activity: flight_activity || null,
          population_growth: population_growth || null,
          forager_activity: forager_activity || null,
          supering_needed: supering_needed || false,
          feeding_required: feeding_required || false,
          next_inspection_needs: next_inspection_needs || null,
          status: status || null,
          is_deleted: is_deleted || false,
          completed_actions: completed_actions || null,
        },
      ])
      .select()
      .single();
    if (inspError) throw inspError;

    const inspectionId = inspectionData.id;

    // ✅ Insert into brood_presence
    const { error: broodError } = await supabase
      .from('brood_presence')
      .insert([
        {
          inspection_id: inspectionId,
          eggs_present: eggs_present || false,
          larvae_present: larvae_present || false,
          larvae_stage: larvae_stage || null,
          sealed_brood: sealed_brood || false,
          brood_pattern: brood_pattern || null,
          drone_brood: drone_brood || 0,
          queen_cells: queen_cells || null,
          notes: brood_notes || null,
        },
      ]);
    if (broodError) throw broodError;

    // ✅ Insert into colony_strength
    const { error: colonyError } = await supabase
      .from('colony_strength')
      .insert([
        {
          inspection_id: inspectionId,
          bee_coverage: bee_coverage || 0,
          brood_frames: brood_frames || 0,
          drone_population: drone_population || null,
          queenright_status: queenright_status || null,
          notes: colony_notes || null,
        },
      ]);
    if (colonyError) throw colonyError;

    // ✅ Insert into queen_status
    const { error: queenError } = await supabase
      .from('queen_status')
      .insert([
        {
          inspection_id: inspectionId,
          queen_seen: queen_seen || false,
          queen_marked: queen_marked || false,
          queen_mark_color: queen_mark_color || null,
          queen_clipped: queen_clipped || false,
          egg_laying: egg_laying || null,
          supersedure_cells: supersedure_cells || 0,
          swarm_cells: swarm_cells || 0,
          notes: queen_notes || null,
        },
      ]);
    if (queenError) throw queenError;

    res.json(inspectionData);
  } catch (err) {
    console.error('❌ Database error:', err.stack);
    res.status(500).send('Server error');
  }
});

// ✅ Fetch Apiaries, Hives, Add Apiary, Add Hive, Update Hive, Delete Apiary, Delete Hive, Update Apiary, Debug Route
app.get('/apiaries', async (req, res) => {
  console.log('🏡 GET /apiaries');
  try {
    const { data, error } = await supabase
      .from('apiaries')
      .select('id, name, postcode');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('❌ Database error:', err.stack);
    res.status(500).send('Server error');
  }
});

app.post('/apiaries', async (req, res) => {
  console.log('📍 POST /apiaries received:', req.body);
  const { name, postcode } = req.body;

  try {
    const beekeeper_id = 1; // Hardcoded for now
    const apiaryData = {
      beekeeper_id,
      name: name || null,
      postcode: postcode || null,
    };
    console.log('🔍 Inserting into Supabase:', apiaryData);
    const { data, error } = await supabase
      .from('apiaries')
      .insert([apiaryData])
      .select();
    if (error) throw error;
    console.log('✅ Successfully inserted:', data);
    res.json(data[0]);
  } catch (err) {
    console.error('❌ Database error:', err.message, err.details || err.stack);
    res.status(500).json({ error: err.message || 'Server error', details: err.details });
  }
});

app.get('/hives', async (req, res) => {
  console.log('🐝 GET /hives');
  try {
    const { data, error } = await supabase
      .from('hives')
      .select('id, apiary_id, name, hive_type');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('❌ Database error:', err.stack);
    res.status(500).send('Server error');
  }
});

app.post('/hives', async (req, res) => {
  console.log('🔍 POST /hives received:', req.body);
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  const { name, currentApiary, type } = req.body;

  try {
    console.log('🔍 Checking if apiary exists:', currentApiary);
    let apiaryId = null;
    if (currentApiary) {
      const { data: apiary, error: apiaryError } = await supabase
        .from('apiaries')
        .select('id')
        .eq('name', currentApiary)
        .single();
      if (apiaryError && apiaryError.code !== 'PGRST116') {
        console.error('❌ Supabase error fetching apiary:', apiaryError);
        return res.status(500).send(`Error fetching apiary: ${apiaryError.message}`);
      }
      if (apiary) apiaryId = apiary.id;
      else console.warn('⚠️ No apiary found for:', currentApiary);
    }

    console.log('✅ Using apiary_id:', apiaryId);

    const { data, error } = await supabase
      .from('hives')
      .insert([
        {
          apiary_id: apiaryId,
          name: name || '',
          hive_type: type || 'Langstroth',
        },
      ])
      .select();
    if (error) throw error;

    console.log('✅ Successfully inserted hive:', data);
    res.json(data[0]);
  } catch (err) {
    console.error('❌ Unexpected database error:', err);
    res.status(500).send('Unexpected server error');
  }
});

app.put('/hives/:id', async (req, res) => {
  const { id } = req.params;
  const { name, apiary_id, hive_type } = req.body;

  try {
    const { data, error } = await supabase
      .from('hives')
      .update({ name, apiary_id, hive_type })
      .eq('id', id)
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).send('Server error');
  }
});

app.delete('/apiaries/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    console.error('❌ Error: Missing apiary ID in request.');
    return res.status(400).json({ error: 'Apiary ID is required.' });
  }

  try {
    console.log(`📛 Attempting to delete apiary ID: ${id}`);

    // Step 1: Unassign all hives from this apiary
    const { error: hiveError } = await supabase
      .from('hives')
      .update({ apiary_id: null })
      .eq('apiary_id', id);

    if (hiveError) {
      console.error('❌ Error unassigning hives:', hiveError);
      return res.status(500).json({ error: 'Failed to unassign hives' });
    }

    // Step 2: Delete the apiary
    const { data, error: deleteError } = await supabase
      .from('apiaries')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('❌ Error deleting apiary:', deleteError);
      return res.status(500).json({ error: 'Failed to delete apiary' });
    }

    // Always return success, even if no rows were deleted (idempotent)
    console.log(`✅ Apiary ${id} deleted successfully or already gone:`, data);
    res.status(200).json({ message: 'Apiary deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting apiary:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/hives/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    console.error('❌ Error: Missing hive ID in request.');
    return res.status(400).json({ error: 'Hive ID is required.' });
  }

  try {
    console.log(`📛 Attempting to delete hive ID: ${id}`);

    const { data, error: deleteError } = await supabase
      .from('hives')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('❌ Error deleting hive:', deleteError);
      return res.status(500).json({ error: 'Failed to delete hive' });
    }

    if (!data || data.length === 0) {
      console.log('⚠️ Hive not found:', id);
      return res.status(404).json({ error: 'Hive not found' });
    }

    console.log(`✅ Hive deleted successfully:`, data);
    res.json({ message: 'Hive deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting hive:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/apiaries/:id', async (req, res) => {
  const { id } = req.params;
  const { name, postcode } = req.body;

  try {
    console.log(`📝 Attempting to update apiary ID: ${id} with`, { name, postcode });

    const { data, error } = await supabase
      .from('apiaries')
      .update({ name: name || null, postcode: postcode || null })
      .eq('id', id)
      .select();

    if (error) {
      console.error('❌ Error updating apiary:', error);
      return res.status(500).json({ error: 'Failed to update apiary' });
    }

    if (!data || data.length === 0) {
      console.log('⚠️ Apiary not found:', id);
      return res.status(404).json({ error: 'Apiary not found' });
    }

    console.log(`✅ Apiary updated successfully:`, data);
    res.json(data[0]);
  } catch (err) {
    console.error('❌ Unexpected error updating apiary:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/debug', (req, res) => {
  res.send('Debugging route working!');
});

const PORT = 3001;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));

module.exports = app;