import React, { useState, useEffect } from 'react';
import axios from 'axios';

function InspectionForm({ onInspectionSaved, selectedApiary, selectedHive, hives }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    general_behavior: '',
    flight_activity: '',
    population_growth: '',
    forager_activity: '',
    supering_needed: false,
    feeding_required: false,
    next_inspection_needs: '',
    status: '',
    is_deleted: false,
    completed_actions: '',
    // brood_presence fields
    eggs_present: false,
    larvae_present: false,
    larvae_stage: '',
    sealed_brood: false,
    brood_pattern: '',
    drone_brood: 0,
    queen_cells: '',
    brood_notes: '',
    // colony_strength fields
    bee_coverage: 0,
    brood_frames: 0,
    drone_population: '',
    queenright_status: '',
    colony_notes: '',
    // queen_status fields
    queen_seen: false,
    queen_marked: false,
    queen_mark_color: '',
    queen_clipped: false,
    egg_laying: '',
    supersedure_cells: 0,
    swarm_cells: 0,
    queen_notes: '',
    // Additional fields not in schema
    running_on_frames: false,
    following_behavior: false,
    stinging_tendency: '',
    buzzing_sound: '',
    honey_stores: '',
    pollen_stores: '',
    feeding_type: '',
    disease_check: '',
    actions: [],
  });

  const [previousActions, setPreviousActions] = useState([]);
  const [latestInspection, setLatestInspection] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    date: false,
    queenStatus: false,
    broodPresence: false,
    colonyTemperament: false,
    colonyStrength: false,
    resourcesHealth: false,
    actions: false,
  });

  useEffect(() => {
    console.log('useEffect running, selectedHive:', selectedHive);
    const fetchPreviousInspection = async () => {
      if (!selectedHive?.id) return;

      try {
        const response = await axios.get('http://localhost:3001/hive_inspections');
        const latestInspectionData = response.data
          .filter((i) => i.hive_id === selectedHive.id)
          .sort((a, b) => new Date(b.inspection_date) - new Date(a.inspection_date))[0];

        console.log('Fetched latest inspection:', latestInspectionData);

        if (latestInspectionData) {
          setLatestInspection(latestInspectionData);
          const broodNotes = latestInspectionData.brood_presence[0]?.notes || '';
          const colonyNotes = latestInspectionData.colony_strength[0]?.notes || '';
          const queenNotes = latestInspectionData.queen_status[0]?.notes || '';
          const additionalFields = {};
          [broodNotes, colonyNotes, queenNotes].forEach((note) => {
            note.split('\n').forEach((line) => {
              const [key, value] = line.split(':').map((s) => s.trim());
              if (key && value) additionalFields[key] = value;
            });
          });

          setFormData({
            date: new Date().toISOString().split('T')[0],
            general_behavior: latestInspectionData.general_behavior || '',
            flight_activity: latestInspectionData.flight_activity || '',
            population_growth: latestInspectionData.population_growth || '',
            forager_activity: latestInspectionData.forager_activity || '',
            supering_needed: latestInspectionData.supering_needed || false,
            feeding_required: latestInspectionData.feeding_required || false,
            next_inspection_needs: latestInspectionData.next_inspection_needs || '',
            status: latestInspectionData.status || '',
            is_deleted: latestInspectionData.is_deleted || false,
            completed_actions: latestInspectionData.completed_actions || '',
            eggs_present: latestInspectionData.brood_presence[0]?.eggs_present || false,
            larvae_present: latestInspectionData.brood_presence[0]?.larvae_present || false,
            larvae_stage: latestInspectionData.brood_presence[0]?.larvae_stage || '',
            sealed_brood: latestInspectionData.brood_presence[0]?.sealed_brood || false,
            brood_pattern: latestInspectionData.brood_presence[0]?.brood_pattern || '',
            drone_brood: latestInspectionData.brood_presence[0]?.drone_brood || 0,
            queen_cells: latestInspectionData.brood_presence[0]?.queen_cells || '',
            brood_notes: broodNotes,
            bee_coverage: latestInspectionData.colony_strength[0]?.bee_coverage || 0,
            brood_frames: latestInspectionData.colony_strength[0]?.brood_frames || 0,
            drone_population: latestInspectionData.colony_strength[0]?.drone_population || '',
            queenright_status: latestInspectionData.colony_strength[0]?.queenright_status || '',
            colony_notes: colonyNotes,
            queen_seen: latestInspectionData.queen_status[0]?.queen_seen || false,
            queen_marked: latestInspectionData.queen_status[0]?.queen_marked || false,
            queen_mark_color: latestInspectionData.queen_status[0]?.queen_mark_color || '',
            queen_clipped: latestInspectionData.queen_status[0]?.queen_clipped || false,
            egg_laying: latestInspectionData.queen_status[0]?.egg_laying || '',
            supersedure_cells: latestInspectionData.queen_status[0]?.supersedure_cells || 0,
            swarm_cells: latestInspectionData.queen_status[0]?.swarm_cells || 0,
            queen_notes: queenNotes,
            running_on_frames: additionalFields['Running on Frames'] === 'Yes' || false,
            following_behavior: additionalFields['Following Behavior'] === 'Yes' || false,
            stinging_tendency: additionalFields['Stinging Tendency'] || '',
            buzzing_sound: additionalFields['Buzzing Sound'] || '',
            honey_stores: additionalFields['Honey Stores'] || '',
            pollen_stores: additionalFields['Pollen Stores'] || '',
            feeding_type: additionalFields['Feeding Type'] || '',
            disease_check: additionalFields['Disease Check'] || '',
            actions: [],
          });
          const actionsArray = latestInspectionData.next_inspection_needs
            ? latestInspectionData.next_inspection_needs
              .split('\n')
              .filter((line) => line.trim())
              .map((text, index) => ({ id: index + 1, text, checked: false, completed_at: null }))
            : [];
          setPreviousActions(actionsArray);
        } else {
          setLatestInspection(null);
          setPreviousActions([]);
          setFormData({
            date: new Date().toISOString().split('T')[0],
            general_behavior: '',
            flight_activity: '',
            population_growth: '',
            forager_activity: '',
            supering_needed: false,
            feeding_required: false,
            next_inspection_needs: '',
            status: '',
            is_deleted: false,
            completed_actions: '',
            eggs_present: false,
            larvae_present: false,
            larvae_stage: '',
            sealed_brood: false,
            brood_pattern: '',
            drone_brood: 0,
            queen_cells: '',
            brood_notes: '',
            bee_coverage: 0,
            brood_frames: 0,
            drone_population: '',
            queenright_status: '',
            colony_notes: '',
            queen_seen: false,
            queen_marked: false,
            queen_mark_color: '',
            queen_clipped: false,
            egg_laying: '',
            supersedure_cells: 0,
            swarm_cells: 0,
            queen_notes: '',
            running_on_frames: false,
            following_behavior: false,
            stinging_tendency: '',
            buzzing_sound: '',
            honey_stores: '',
            pollen_stores: '',
            feeding_type: '',
            disease_check: '',
            actions: [],
          });
        }
      } catch (err) {
        console.error('Error fetching previous inspection:', err);
      }
    };

    fetchPreviousInspection();
  }, [selectedHive]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleActionChange = (index, field, value) => {
    const updatedActions = [...formData.actions];
    updatedActions[index] = { ...updatedActions[index], [field]: value };
    setFormData({ ...formData, actions: updatedActions });
  };

  const handlePreviousActionChange = (index, checked) => {
    const updatedPreviousActions = [...previousActions];
    updatedPreviousActions[index] = { ...updatedPreviousActions[index], checked };
    setPreviousActions(updatedPreviousActions);
  };

  const addAction = () => {
    const newActionId = formData.actions.length
      ? Math.max(...formData.actions.map((a) => a.id)) + 1
      : previousActions.length
        ? Math.max(...previousActions.map((a) => a.id)) + 1
        : 1;
    setFormData({
      ...formData,
      actions: [...formData.actions, { id: newActionId, text: '', checked: false }],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedHive || !selectedHive.id) {
      alert('❌ Error: You must select a hive before submitting an inspection.');
      return;
    }

    const hive_id = selectedHive.id;

    const completedActions = previousActions
      .filter((a) => a.checked)
      .map((a) => ({ text: a.text, completed_at: new Date().toISOString() })) || [];

    const followUpActions = [
      ...previousActions.filter((a) => !a.checked),
      ...formData.actions.filter((a) => a.text.trim()),
    ];

    const followUpActionsText = followUpActions.length > 0
      ? followUpActions.map((a, i) => `${i + 1}. ${a.text}`).join('\n')
      : null;

    const broodAdditionalNotes = [
      `Running on Frames: ${formData.running_on_frames ? 'Yes' : 'No'}`,
      `Following Behavior: ${formData.following_behavior ? 'Yes' : 'No'}`,
      `Stinging Tendency: ${formData.stinging_tendency}`,
      `Buzzing Sound: ${formData.buzzing_sound}`,
    ].filter(Boolean).join('\n');
    const fullBroodNotes = formData.brood_notes ? `${formData.brood_notes}\n${broodAdditionalNotes}` : broodAdditionalNotes;

    const colonyAdditionalNotes = [];
    const fullColonyNotes = formData.colony_notes || null;

    const queenAdditionalNotes = [
      `Honey Stores: ${formData.honey_stores}`,
      `Pollen Stores: ${formData.pollen_stores}`,
      `Feeding Type: ${formData.feeding_type}`,
      `Disease Check: ${formData.disease_check}`,
    ].filter(Boolean).join('\n');
    const fullQueenNotes = formData.queen_notes ? `${formData.queen_notes}\n${queenAdditionalNotes}` : queenAdditionalNotes;

    const payload = {
      hive_id,
      inspection_date: formData.date,
      general_behavior: formData.general_behavior || null,
      flight_activity: formData.flight_activity || null,
      population_growth: formData.population_growth || null,
      forager_activity: formData.forager_activity || null,
      supering_needed: formData.supering_needed || false,
      feeding_required: formData.feeding_required || false,
      next_inspection_needs: followUpActionsText,
      status: formData.status || null,
      is_deleted: formData.is_deleted || false,
      completed_actions: completedActions.length ? JSON.stringify(completedActions) : null,
      eggs_present: formData.eggs_present || false,
      larvae_present: formData.larvae_present || false,
      larvae_stage: formData.larvae_stage || null,
      sealed_brood: formData.sealed_brood || false,
      brood_pattern: formData.brood_pattern || null,
      drone_brood: formData.drone_brood || 0,
      queen_cells: formData.queen_cells || null,
      brood_notes: fullBroodNotes || null,
      bee_coverage: formData.bee_coverage || 0,
      brood_frames: formData.brood_frames || 0,
      drone_population: formData.drone_population || null,
      queenright_status: formData.queenright_status || null,
      colony_notes: fullColonyNotes,
      queen_seen: formData.queen_seen || false,
      queen_marked: formData.queen_marked || false,
      queen_mark_color: formData.queen_mark_color || null,
      queen_clipped: formData.queen_clipped || false,
      egg_laying: formData.egg_laying || null,
      supersedure_cells: formData.supersedure_cells || 0,
      swarm_cells: formData.swarm_cells || 0,
      queen_notes: fullQueenNotes || null,
    };

    console.log('📤 Sending payload:', JSON.stringify(payload, null, 2));

    try {
      const response = await axios.post('http://localhost:3001/hive_inspections', payload);
      console.log('✅ Inspection saved successfully:', response.data);
      alert('Inspection saved successfully!');

      setFormData({
        date: new Date().toISOString().split('T')[0],
        general_behavior: '',
        flight_activity: '',
        population_growth: '',
        forager_activity: '',
        supering_needed: false,
        feeding_required: false,
        next_inspection_needs: '',
        status: '',
        is_deleted: false,
        completed_actions: '',
        eggs_present: false,
        larvae_present: false,
        larvae_stage: '',
        sealed_brood: false,
        brood_pattern: '',
        drone_brood: 0,
        queen_cells: '',
        brood_notes: '',
        bee_coverage: 0,
        brood_frames: 0,
        drone_population: '',
        queenright_status: '',
        colony_notes: '',
        queen_seen: false,
        queen_marked: false,
        queen_mark_color: '',
        queen_clipped: false,
        egg_laying: '',
        supersedure_cells: 0,
        swarm_cells: 0,
        queen_notes: '',
        running_on_frames: false,
        following_behavior: false,
        stinging_tendency: '',
        buzzing_sound: '',
        honey_stores: '',
        pollen_stores: '',
        feeding_type: '',
        disease_check: '',
        actions: [],
      });

      if (onInspectionSaved) onInspectionSaved();
    } catch (err) {
      console.error('❌ Error saving inspection:', err.response ? err.response.data : err);
      alert('Failed to save inspection');
    }
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Render nothing if no hive is selected
  if (!selectedHive) {
    return (
      <div className="text-center text-gray-600">
        Please select a hive to start an inspection.
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Inspection Date Section */}
        <div className="border rounded-md p-4 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => toggleSection('date')}
            className="w-full text-left text-lg font-medium text-amber-600 hover:text-amber-800 focus:outline-none"
          >
            Inspection Date 📅 {expandedSections.date ? '▼' : '▶'}
          </button>
          {expandedSections.date && (
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* Queen Status Section */}
        <div className="border rounded-md p-4 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => toggleSection('queenStatus')}
            className="w-full text-left text-lg font-medium text-amber-600 hover:text-amber-800 focus:outline-none"
          >
            Queen Status 👑 {expandedSections.queenStatus ? '▼' : '▶'}
          </button>
          {expandedSections.queenStatus && (
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Queen Seen? ✅</label>
                <input
                  type="checkbox"
                  name="queen_seen"
                  checked={formData.queen_seen}
                  onChange={handleChange}
                  className="mr-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Queen Marked? 🎨</label>
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    name="queen_marked"
                    checked={formData.queen_marked}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  {formData.queen_marked && (
                    <select
                      name="queen_mark_color"
                      value={formData.queen_mark_color}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      <option value="">Select Color</option>
                      <option value="White">White</option>
                      <option value="Yellow">Yellow</option>
                      <option value="Red">Red</option>
                      <option value="Green">Green</option>
                      <option value="Blue">Blue</option>
                    </select>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Queen Clipped? ✂</label>
                <input
                  type="checkbox"
                  name="queen_clipped"
                  checked={formData.queen_clipped}
                  onChange={handleChange}
                  className="mr-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Egg Laying Pattern 🥚</label>
                <select
                  name="egg_laying"
                  value={formData.egg_laying}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Select Pattern</option>
                  <option value="Good">Good</option>
                  <option value="Patchy">Patchy</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Supersedure Cells 🛑</label>
                <input
                  type="number"
                  name="supersedure_cells"
                  value={formData.supersedure_cells}
                  onChange={handleChange}
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Swarm Cells ⚠️</label>
                <input
                  type="number"
                  name="swarm_cells"
                  value={formData.swarm_cells}
                  onChange={handleChange}
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Notes ✍️</label>
                <textarea
                  name="queen_notes"
                  value={formData.queen_notes}
                  onChange={handleChange}
                  placeholder="Queen status notes"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400 min-h-[50px]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Brood Presence Section */}
        <div className="border rounded-md p-4 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => toggleSection('broodPresence')}
            className="w-full text-left text-lg font-medium text-amber-600 hover:text-amber-800 focus:outline-none"
          >
            Brood Presence (BIAS) 🐣 {expandedSections.broodPresence ? '▼' : '▶'}
          </button>
          {expandedSections.broodPresence && (
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Eggs Present? ✅</label>
                <input
                  type="checkbox"
                  name="eggs_present"
                  checked={formData.eggs_present}
                  onChange={handleChange}
                  className="mr-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Larvae Present? ✅</label>
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    name="larvae_present"
                    checked={formData.larvae_present}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  {formData.larvae_present && (
                    <select
                      name="larvae_stage"
                      value={formData.larvae_stage}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      <option value="">Select Stage</option>
                      <option value="Young">Young</option>
                      <option value="Old">Old</option>
                    </select>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Sealed Brood? ✅</label>
                <input
                  type="checkbox"
                  name="sealed_brood"
                  checked={formData.sealed_brood}
                  onChange={handleChange}
                  className="mr-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Brood Pattern 📌</label>
                <select
                  name="brood_pattern"
                  value={formData.brood_pattern}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Select Pattern</option>
                  <option value="Uniform">Uniform</option>
                  <option value="Patchy">Patchy</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Drone Brood Count 🪶</label>
                <input
                  type="number"
                  name="drone_brood"
                  value={formData.drone_brood}
                  onChange={handleChange}
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Queen Cells 👑</label>
                <select
                  name="queen_cells"
                  value={formData.queen_cells}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Select Type</option>
                  <option value="None">None</option>
                  <option value="Swarm">Swarm</option>
                  <option value="Supersedure">Supersedure</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Notes ✍️</label>
                <textarea
                  name="brood_notes"
                  value={formData.brood_notes}
                  onChange={handleChange}
                  placeholder="Brood presence notes"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400 min-h-[50px]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Colony Temperament Section */}
        <div className="border rounded-md p-4 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => toggleSection('colonyTemperament')}
            className="w-full text-left text-lg font-medium text-amber-600 hover:text-amber-800 focus:outline-none"
          >
            Colony Temperament 🏳️ {expandedSections.colonyTemperament ? '▼' : '▶'}
          </button>
          {expandedSections.colonyTemperament && (
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">General Behavior 🕊️</label>
                <select
                  name="general_behavior"
                  value={formData.general_behavior}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Select Behavior</option>
                  <option value="Calm">Calm</option>
                  <option value="Nervous">Nervous</option>
                  <option value="Aggressive">Aggressive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Flight Activity ✈️</label>
                <select
                  name="flight_activity"
                  value={formData.flight_activity}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Select Activity</option>
                  <option value="Low">Low</option>
                  <option value="Moderate">Moderate</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Running on Frames? 🐝</label>
                <input
                  type="checkbox"
                  name="running_on_frames"
                  checked={formData.running_on_frames}
                  onChange={handleChange}
                  className="mr-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Following Behavior? 🔄</label>
                <input
                  type="checkbox"
                  name="following_behavior"
                  checked={formData.following_behavior}
                  onChange={handleChange}
                  className="mr-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Stinging Tendency ⚠️</label>
                <select
                  name="stinging_tendency"
                  value={formData.stinging_tendency}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Select Tendency</option>
                  <option value="None">None</option>
                  <option value="Occasional">Occasional</option>
                  <option value="Frequent">Frequent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Buzzing Sound 🔊</label>
                <select
                  name="buzzing_sound"
                  value={formData.buzzing_sound}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Select Sound</option>
                  <option value="Quiet">Quiet</option>
                  <option value="Loud">Loud</option>
                  <option value="Unsettled">Unsettled</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Colony Strength Section */}
        <div className="border rounded-md p-4 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => toggleSection('colonyStrength')}
            className="w-full text-left text-lg font-medium text-amber-600 hover:text-amber-800 focus:outline-none"
          >
            Colony Strength 💪 {expandedSections.colonyStrength ? '▼' : '▶'}
          </button>
          {expandedSections.colonyStrength && (
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Bee Coverage (frames) 🐝</label>
                <input
                  type="number"
                  name="bee_coverage"
                  value={formData.bee_coverage}
                  onChange={handleChange}
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Brood Frames Count 🪵</label>
                <input
                  type="number"
                  name="brood_frames"
                  value={formData.brood_frames}
                  onChange={handleChange}
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Population Growth 📊</label>
                <select
                  name="population_growth"
                  value={formData.population_growth}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Select Growth</option>
                  <option value="Increasing">Increasing</option>
                  <option value="Stable">Stable</option>
                  <option value="Decreasing">Decreasing</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Forager Activity 🍃</label>
                <select
                  name="forager_activity"
                  value={formData.forager_activity}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Select Activity</option>
                  <option value="Low">Low</option>
                  <option value="Moderate">Moderate</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Drone Population 👑</label>
                <select
                  name="drone_population"
                  value={formData.drone_population}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Select Population</option>
                  <option value="Few">Few</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Many">Many</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Queenright Status ✅</label>
                <select
                  name="queenright_status"
                  value={formData.queenright_status}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Select Status</option>
                  <option value="Queen Seen">Queen Seen</option>
                  <option value="Eggs Present">Eggs Present</option>
                  <option value="Emergency Cells">Emergency Cells</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Notes ✍️</label>
                <textarea
                  name="colony_notes"
                  value={formData.colony_notes}
                  onChange={handleChange}
                  placeholder="Colony strength notes"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400 min-h-[50px]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Resources & Health Section */}
        <div className="border rounded-md p-4 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => toggleSection('resourcesHealth')}
            className="w-full text-left text-lg font-medium text-amber-600 hover:text-amber-800 focus:outline-none"
          >
            Resources & Health 🍯 {expandedSections.resourcesHealth ? '▼' : '▶'}
          </button>
          {expandedSections.resourcesHealth && (
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Honey Stores 🍯</label>
                <select
                  name="honey_stores"
                  value={formData.honey_stores}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Select Level</option>
                  <option value="Low">Low</option>
                  <option value="Moderate">Moderate</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Pollen Stores 🌿</label>
                <select
                  name="pollen_stores"
                  value={formData.pollen_stores}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Select Level</option>
                  <option value="Low">Low</option>
                  <option value="Moderate">Moderate</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Feeding Required? 🍽️</label>
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    name="feeding_required"
                    checked={formData.feeding_required}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  {formData.feeding_required && (
                    <select
                      name="feeding_type"
                      value={formData.feeding_type}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      <option value="">Select Type</option>
                      <option value="Syrup">Syrup</option>
                      <option value="Fondant">Fondant</option>
                      <option value="None">None</option>
                    </select>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Supering Needed? 📦</label>
                <input
                  type="checkbox"
                  name="supering_needed"
                  checked={formData.supering_needed}
                  onChange={handleChange}
                  className="mr-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Disease Check ⚕️</label>
                <select
                  name="disease_check"
                  value={formData.disease_check}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Select Condition</option>
                  <option value="None">None</option>
                  <option value="Varroa">Varroa</option>
                  <option value="Chalkbrood">Chalkbrood</option>
                  <option value="EFB">EFB</option>
                  <option value="AFB">AFB</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Actions Section */}
        <div className="border rounded-md p-4 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => toggleSection('actions')}
            className="w-full text-left text-lg font-medium text-amber-600 hover:text-amber-800 focus:outline-none"
          >
            Actions 📋 {expandedSections.actions ? '▼' : '▶'}
          </button>
          {expandedSections.actions && (
            <div className="mt-2 space-y-2">
              {previousActions.map((action, index) => (
                <div key={action.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={action.checked}
                    onChange={(e) => handlePreviousActionChange(index, e.target.checked)}
                    className="mr-2"
                  />
                  <input
                    type="text"
                    value={action.text}
                    className={`w-full p-2 border border-gray-300 rounded-md bg-gray-100 ${action.checked ? 'line-through text-gray-500' : ''}`}
                    disabled
                  />
                </div>
              ))}
              {formData.actions.map((action, index) => (
                <div key={action.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={action.checked}
                    onChange={(e) => handleActionChange(index, 'checked', e.target.checked)}
                    className="mr-2"
                  />
                  <input
                    type="text"
                    value={action.text}
                    onChange={(e) => handleActionChange(index, 'text', e.target.value)}
                    className={`w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400 ${action.checked ? 'line-through text-gray-500' : ''}`}
                    placeholder={`${action.id}. Enter action`}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addAction}
                className="mt-2 p-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Add Action
              </button>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full p-3 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors duration-200 font-medium"
        >
          Save Inspection
        </button>
      </form>
    </div>
  );
}

export default InspectionForm;