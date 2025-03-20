const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  const {
    hive_id,
    inspection_date,
    general_behavior,
    flight_activity,
    population_growth,
    forager_activity,
    supering_needed,
    feeding_required,
    next_inspection_needs,
    status,
    is_deleted,
    completed_actions,
    eggs_present,
    larvae_present,
    larvae_stage,
    sealed_brood,
    brood_pattern,
    drone_brood,
    bee_coverage,
    brood_frames,
    drone_population,
    queenright_status,
    queen_seen,
    queen_marked,
    queen_mark_color,
    queen_clipped,
    egg_laying,
    queen_cells,
    notes,
  } = req.body;

  try {
    // Insert into hive_inspections
    const { data: inspection, error: inspectionError } = await supabase
      .from('hive_inspections')
      .insert([
        {
          hive_id,
          inspection_date,
          general_behavior,
          flight_activity,
          population_growth,
          forager_activity,
          supering_needed,
          feeding_required,
          next_inspection_needs,
          status,
          is_deleted,
          completed_actions,
          notes,
        },
      ])
      .select()
      .single();
    if (inspectionError) throw inspectionError;

    const inspection_id = inspection.id;

    // Insert into brood_presence
    const { error: broodError } = await supabase
      .from('brood_presence')
      .insert([
        {
          inspection_id,
          eggs_present,
          larvae_present,
          larvae_stage,
          sealed_brood,
          brood_pattern,
          drone_brood: parseInt(drone_brood, 10) || null,
        },
      ]);
    if (broodError) throw broodError;

    // Insert into colony_strength
    const { error: colonyError } = await supabase
      .from('colony_strength')
      .insert([
        {
          inspection_id,
          bee_coverage,
          brood_frames,
          drone_population,
          queenright_status,
        },
      ]);
    if (colonyError) throw colonyError;

    // Insert into queen_status
    const { error: queenError } = await supabase
      .from('queen_status')
      .insert([
        {
          inspection_id,
          queen_seen,
          queen_marked,
          queen_mark_color,
          queen_clipped,
          egg_laying,
          queen_cells,
        },
      ]);
    if (queenError) throw queenError;

    res.status(201).json(inspection);
  } catch (err) {
    console.error('Error saving inspection:', err);
    res.status(500).json({ error: err.message });
  }
};