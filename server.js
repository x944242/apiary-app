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
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000'); // Adjust if needed
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
  console.log('📊 GET /inspections');
  try {
    const { data, error } = await supabase
      .from('hive_inspections')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('❌ Database error:', err.stack);
    res.status(500).send('Server error');
  }
});

// ✅ Add Inspection
app.post('/hive_inspections', async (req, res) => {
  console.log('📝 POST /hive_inspections received:', req.body);
  
  // ✅ Extract `hive_id` from request body
  const { apiary, hive_id, date, queenStatus, foodStores, temperature, rain, broodPattern, notes, followUpActions } = req.body;

  if (!hive_id) {
    console.error("❌ Missing hive_id in request body:", req.body);
    return res.status(400).json({ error: "hive_id is required" });
  }

  try {
    // ✅ Validate if hive exists
    const { data: hiveData, error: hiveError } = await supabase
      .from('hives')
      .select('id')
      .eq('id', hive_id)  // ✅ Check `hive_id` directly
      .single();

    if (!hiveData || hiveError) {
      console.error("❌ Hive not found:", hiveError);
      return res.status(400).json({ error: "Hive not found" });
    }

    // ✅ Insert into `hive_inspections` using `hive_id`
    const { data, error } = await supabase
      .from('hive_inspections')
      .insert([
        {
          hive_id,  // ✅ Now correctly defined
          date,
          queen_status: queenStatus || null,
          food_stores: foodStores || null,
          temperature: temperature || null,
          rain: rain || null,
          brood_pattern: broodPattern || null,
          notes: notes || null,
          follow_up_actions: followUpActions || null,
        },
      ])
      .select();

    if (error) throw error;
    res.json(data[0]);

  } catch (err) {
    console.error('❌ Database error:', err.stack);
    res.status(500).send('Server error');
  }
});


// ✅ Fetch Apiaries
app.get('/apiaries', async (req, res) => {
  console.log('🏡 GET /apiaries');
  try {
    const { data, error } = await supabase.from('apiaries').select('*');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('❌ Database error:', err.stack);
    res.status(500).send('Server error');
  }
});

// ✅ Add Apiary
app.post('/apiaries', async (req, res) => {
  console.log('📍 POST /apiaries received:', req.body);
  const { name, postcode } = req.body;
  try {
    const beekeeper_id = 1; // Default beekeeper
    const { data, error } = await supabase
      .from('apiaries')
      .insert([{ beekeeper_id, name, postcode }])
      .select();
    if (error) throw error;
    console.log('✅ Successfully inserted:', data);
    res.json(data[0]);
  } catch (err) {
    console.error('❌ Database error:', err.stack);
    res.status(500).send('Server error');
  }
});

// ✅ Fetch Hives
app.get('/hives', async (req, res) => {
  console.log('🐝 GET /hives');
  try {
    const { data, error } = await supabase.from('hives').select('*');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('❌ Database error:', err.stack);
    res.status(500).send('Server error');
  }
});

// ✅ Add Hive
app.post('/hives', async (req, res) => {
  console.log('🔍 POST /hives received:', req.body);
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

  const { name, currentApiary, type } = req.body;

  try {
    console.log('🔍 Finding the highest existing hive number...');
    const { data: hives, error: hiveError } = await supabase
      .from('hives')
      .select('hive_number');

    if (hiveError) {
      console.error('❌ Supabase error fetching hives:', hiveError);
      return res.status(500).send(`Error fetching hives: ${hiveError.message}`);
    }

    // Get next available hive number (default to 1 if no hives exist)
    const hiveNumbers = hives.map(h => h.hive_number);
    const nextHiveNumber = hiveNumbers.length ? Math.max(...hiveNumbers) + 1 : 1;

    console.log('✅ Next hive number assigned:', nextHiveNumber);

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

      if (apiary) {
        apiaryId = apiary.id;
      } else {
        console.warn('⚠️ No apiary found for:', currentApiary);
        apiaryId = null;
      }
    }

    console.log('✅ Using apiary_id:', apiaryId);

    const { data, error } = await supabase
      .from('hives')
      .insert([
        {
          hive_number: nextHiveNumber,
          name: name || '',
          apiary_id: apiaryId,  // Will be NULL if no valid apiary found
          type: type || 'Full size',
        },
      ])
      .select();

    if (error) {
      console.error('❌ Supabase error inserting hive:', error);
      return res.status(500).send(`Error inserting hive: ${error.message}`);
    }

    console.log('✅ Successfully inserted hive:', data);
    res.json(data[0]);
  } catch (err) {
    console.error('❌ Unexpected database error:', err);
    res.status(500).send('Unexpected server error');
  }
});


app.put('/hives/:hiveNumber', async (req, res) => {
  const { hiveNumber } = req.params;
  const { name, apiary_id, type } = req.body;

  try {
    const { data, error } = await supabase
      .from('hives')
      .update({ name, apiary_id, type })
      .eq('hive_number', hiveNumber)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).send('Server error');
  }
});


app.delete('/apiaries/:name', async (req, res) => {
  const { name } = req.params;
  console.log(`DELETE /apiaries/${name}`);

  try {
    const { data: apiary, error: fetchError } = await supabase
      .from('apiaries')
      .select('id')
      .eq('name', name)
      .single();

    if (fetchError || !apiary) {
      return res.status(404).json({ error: 'Apiary not found' });
    }

    // Remove apiary reference from hives
    const { error: updateError } = await supabase
      .from('hives')
      .update({ apiary_id: null })
      .eq('apiary_id', apiary.id);
    if (updateError) throw updateError;

    // Delete the apiary
    const { error: deleteError } = await supabase
      .from('apiaries')
      .delete()
      .eq('name', name);
    if (deleteError) throw deleteError;

    res.sendStatus(204);
  } catch (err) {
    console.error('Supabase error:', err);
    res.status(500).json({ error: 'Failed to delete apiary' });
  }
});

app.delete('/hives/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('hives')
      .delete()
      .match({ id });

    if (error) throw error;

    res.status(200).send({ message: 'Hive deleted successfully' });
  } catch (error) {
    console.error('Error deleting hive:', error);
    res.status(500).send('Server error');
  }
});


// ✅ Debug Route
app.get('/debug', (req, res) => {
  res.send('Debugging route working!');
});

// ✅ Start Server
const PORT = 3001;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));

module.exports = app;
