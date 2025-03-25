import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Configure Axios to include credentials (cookies) with requests
axios.defaults.withCredentials = true;

function InspectionForm({ onInspectionSaved, selectedApiary, selectedHive, setSelectedHive, hives, fetchHiveActions }) {
  // Initial form state with all fields
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    general_behavior: '',
    flight_activity: '',
    population_growth: '',
    forager_activity: '',
    supering_needed: false,
    feeding_required: false,
    status: '',
    is_deleted: false,
    eggs_present: false,
    larvae_present: false,
    larvae_stage: '',
    sealed_brood: false,
    brood_pattern: '',
    drone_brood: 0,
    bee_coverage: 0,
    brood_frames: 0,
    drone_population: '',
    queenright_status: '',
    queen_seen: false,
    queen_marked: false,
    queen_mark_color: '',
    queen_clipped: false,
    egg_laying: '',
    queen_cells: '',
    running_on_frames: false,
    following_behavior: false,
    stinging_tendency: '',
    buzzing_sound: '',
    honey_stores: '',
    pollen_stores: '',
    feeding_type: '',
    disease_check: '',
    actions: [], // Array for new actions
    notes: '',
  });

  const API_BASE_URL = "";

  // State for outstanding actions fetched from the server
  const [outstandingActions, setOutstandingActions] = useState([]);

  // State for collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    queenStatus: false,
    broodPresence: false,
    colonyTemperament: false,
    colonyStrength: false,
    resourcesHealth: false,
  });

  // Fetch outstanding actions when the selected hive changes
  useEffect(() => {
    if (selectedHive) {
      const fetchOutstandingActions = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/hive_actions`, {
            params: { hive_id: selectedHive.id, completed: false },
          });
          setOutstandingActions(
            response.data.map((action) => ({
              id: action.id,
              text: action.action_text,
              checked: false,
            }))
          );
        } catch (err) {
          console.error('Error fetching outstanding actions:', err);
          setOutstandingActions([]);
        }
      };
      fetchOutstandingActions();
    } else {
      setOutstandingActions([]);
    }
  }, [selectedHive, API_BASE_URL]);


  
  // Reset form when selected hive changes
  useEffect(() => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      general_behavior: '',
      flight_activity: '',
      population_growth: '',
      forager_activity: '',
      supering_needed: false,
      feeding_required: false,
      status: '',
      is_deleted: false,
      eggs_present: false,
      larvae_present: false,
      larvae_stage: '',
      sealed_brood: false,
      brood_pattern: '',
      drone_brood: 0,
      bee_coverage: 0,
      brood_frames: 0,
      drone_population: '',
      queenright_status: '',
      queen_seen: false,
      queen_marked: false,
      queen_mark_color: '',
      queen_clipped: false,
      egg_laying: '',
      queen_cells: '',
      running_on_frames: false,
      following_behavior: false,
      stinging_tendency: '',
      buzzing_sound: '',
      honey_stores: '',
      pollen_stores: '',
      feeding_type: '',
      disease_check: '',
      actions: [],
      notes: '',
    });
  }, [selectedHive, API_BASE_URL]);

  // Handle input changes for form fields
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  // Handle changes to new actions
  const handleActionChange = (index, field, value) => {
    const updatedActions = [...formData.actions];
    updatedActions[index][field] = value;
    setFormData({ ...formData, actions: updatedActions });
  };

  // Handle checkbox changes for outstanding actions
  const handleOutstandingActionChange = (index, checked) => {
    const updatedActions = [...outstandingActions];
    updatedActions[index].checked = checked;
    setOutstandingActions(updatedActions);
  };

  // Add a new action to the form
  const addAction = () => {
    setFormData({
      ...formData,
      actions: [...formData.actions, { text: '', checked: false }],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!selectedHive) {
      alert('Please select a hive before saving the inspection.');
      return; // Stop if no hive is selected
    }
  
    const colonyStrengthData = {
      hive_id: selectedHive.id, // Include the hive_id
      bee_coverage: formData.bee_coverage,
      brood_frames: formData.brood_frames,
      drone_population: formData.drone_population,
      queenright_status: formData.queenright_status,
    };
  
    const inspectionData = {
      ...formData,
      colonyStrengthData,
      actions: formData.actions, // Include actions
      notes: formData.notes,     // Include notes
    };
  
    try {
      const response = await fetch('/api/hive_inspections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inspectionData), // Send all form data
      });
  
      if (!response.ok) {
        const errorData = await response.json(); // Attempt to get error message
        throw new Error(errorData.message || 'Failed to save inspection');
      }
  
      // Remove completed actions from outstanding list
      setOutstandingActions((prev) => prev.filter((action) => !action.checked));
  
      if (onInspectionSaved) onInspectionSaved();
  
      // Reset selected hive (hides the form)
      setSelectedHive(null);
    } catch (err) {
      console.error('Error saving inspection:', err);
      alert('Failed to save inspection: ' + err.message); // Show user the error
    }
  };
  
  
  
  

  // Toggle collapsible sections
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Render message if no hive is selected
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
          <h3 className="text-lg font-medium text-amber-600">Inspection Date 📅</h3>
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

      {/* Actions and Notes Section */}
{/* Actions and Notes Section */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Actions Section */}
  <div className="border rounded-md p-4 bg-white shadow-sm">
    <h3 className="text-lg font-medium text-amber-600">Actions 📋</h3>

    {/* List of Previously Added Actions */}
    <div className="mt-2 space-y-2">
      {outstandingActions.map((action, index) => (
        <div key={action.id} className="flex items-center">
          <input
            type="checkbox"
            checked={action.checked}
            onChange={(e) => handleOutstandingActionChange(index, e.target.checked)}
            className="mr-2"
          />
          <span className={`w-full p-2 ${action.checked ? 'line-through text-gray-400' : ''}`}>
            {action.text}
          </span>
        </div>
      ))}
    </div>

    {/* New Actions List */}
    <div className="mt-4 space-y-2">
      {formData.actions.map((action, index) => (
        <div key={index} className="flex items-center">
          <input
            type="text"
            value={action.text}
            onChange={(e) => handleActionChange(index, 'text', e.target.value)}
            placeholder="Enter New Action"
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <input
            type="checkbox"
            checked={action.checked}
            onChange={(e) => handleActionChange(index, 'checked', e.target.checked)}
            className="ml-2"
          />
        </div>
      ))}
    </div>

    {/* Add Action Button */}
    <button
      type="button"
      onClick={addAction}
      className="mt-2 p-2 bg-green-500 text-white rounded-md hover:bg-green-600"
    >
      Add Action
    </button>
  </div>

  {/* Notes Section */}
  <div className="border rounded-md p-4 bg-white shadow-sm">
    <h3 className="text-lg font-medium text-amber-600">Notes ✍️</h3>
    <div className="mt-2">
      <textarea
        name="notes"
        value={formData.notes}
        onChange={handleChange}
        placeholder="Enter inspection notes"
        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400 min-h-[150px]"
      />
    </div>
  </div>
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