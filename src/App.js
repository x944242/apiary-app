import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InspectionForm from './InspectionForm.js';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const API_BASE_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : '';





    console.log("🌍 API_BASE_URL is:", API_BASE_URL);
    console.log("NODE_ENV is:", process.env.NODE_ENV);
    

   

function App() {
  const [, setInspections] = useState([]); 
  const [hives, setHives] = useState([]);
  const [apiaries, setApiaries] = useState([]);
  
  const [activeTab, setActiveTab] = useState('inspection-dashboard');
  const [selectedApiary, setSelectedApiary] = useState('Ratho');
  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const [selectedHive, setSelectedHive] = useState(null);
  const [latestInspection, setLatestInspection] = useState(null);
  const [actionsForHives, setActionsForHives] = useState({}); // New state for actions
  //const [hiveActions, setHiveActions] = useState([]); // not being used=> commented out to avoid warnings

  useEffect(() => {
    console.log("🌍 API_BASE_URL is:", API_BASE_URL);
  
    // Test if we can fetch from /api/test
    axios.get(`${API_BASE_URL}/api/test`)
      .then(res => console.log("✅ /api/test success:", res.data))
      .catch(err => console.error("❌ /api/test failed:", err));
  
    // Test if we can fetch from /api/apiaries
    axios.get(`${API_BASE_URL}/api/apiaries`)
      .then(res => console.log("✅ /api/apiaries success:", res.data))
      .catch(err => console.error("❌ /api/apiaries failed:", err));
  }, []);
  
  // Fetch apiaries on mount
  useEffect(() => {
    const fetchApiaries = async () => {
      try {  const response = await axios.get(`${API_BASE_URL}/api/apiaries`);
        console.log('✅ Fetched latest apiary data:', response.data);
        setApiaries(response.data);
      } catch (err) {
        console.error('❌ Error fetching apiaries:', err);
      }
    };
    fetchApiaries();
  }, []);

  // Fetch hives on mount
  useEffect(() => {
    const fetchHives = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/hives`);
        setHives(response.data);
      } catch (err) {
        console.error('Error fetching hives:', err);
      }
    };
    fetchHives();
  }, []);

  const fetchHiveActions = async (hiveId) => {
    if (!hiveId) return; // Prevent invalid requests
  
    try {
      console.log(`Fetching Hive Box actions ONLY for Hive ${hiveId}...`);
  
      const response = await axios.get(`${API_BASE_URL}/api/hive_actions`, {
        params: { hive_id: hiveId, completed: false },
      });
  
      console.log(`✅ Fetched actions for Hive ${hiveId}:`, response.data);
  
      // ✅ Ensure we update only the relevant Hive Box
      setActionsForHives((prev) => ({
        ...prev,
        [hiveId]: response.data, // ✅ Update only this Hive's actions
      }));
  
    } catch (err) {
      console.error(`❌ Error fetching Hive Box actions for Hive ${hiveId}:`, err);
    }
  };
  
  
  

  // Fetch actions for all hives when hives change
  useEffect(() => {
    const fetchActionsForAllHives = async () => {
      const actionsByHive = {};
      for (const hive of hives) {
        try {
          const res = await axios.get(`${API_BASE_URL}/api/hive_actions`, {
            params: { hive_id: hive.id, completed: false },
          });
          actionsByHive[hive.id] = res.data;
        } catch (err) {
          console.error(`Error fetching actions for hive ${hive.id}:`, err);
          actionsByHive[hive.id] = [];
        }
      }
      setActionsForHives(actionsByHive);
    };
    if (hives.length > 0) fetchActionsForAllHives();
  }, [hives]);

  // Handle inspection save and refresh inspections
  const handleInspectionSaved = async () => {
   
    if (!selectedHive) return; // Ensure a hive is selected
  
    try {
      const hiveId = selectedHive.id; // ✅ Store hive ID before resetting
  
      console.log(`Fetching updated actions only for Hive ${hiveId}...`);
      await fetchHiveActions(hiveId); // ✅ Ensure only this Hive Box refreshes
  
      setSelectedHive(null); // ✅ Reset AFTER fetching updated actions
  
      const res = await axios.get(`${API_BASE_URL}/api/hive_inspections`);
      console.log('🧪 Full inspections from API:', res.data);

      console.log("🔍 Response from /hive_inspections:", res.data);

      setInspections(res.data);
  
      const latest = res.data
  .filter((i) => i.hive_id === hiveId)
  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

  
      setLatestInspection(latest || null);
    } catch (err) {
      console.error('❌ Error fetching inspections after save:', err);
    }
  };
  
  
  
  // Filter and sort hives by selected apiary
  const apiaryHives = hives
    .filter((hive) => {
      const matchingApiary = apiaries.find((apiary) => apiary.name === selectedApiary);
      return hive.apiary_id === (matchingApiary ? matchingApiary.id : null);
    })
    .sort((a, b) => {
      if (a.apiary_id && !b.apiary_id) return -1;
      if (!a.apiary_id && b.apiary_id) return 1;
      return a.id - b.id;
    });

  console.log('🔥 Updated apiaryHives:', apiaryHives);

  // Update hive details
  const updateHive = async (hiveId, newName, newApiaryName, newHiveType) => {
    try {
      const hive = hives.find((h) => h.id === hiveId);
      if (!hive) {
        console.error('❌ Hive not found:', hiveId);
        return;
      }

      let apiary_id = hive.apiary_id;
      if (newApiaryName !== undefined) {
        const apiary = apiaries.find((a) => a.name === newApiaryName);
        apiary_id = apiary ? apiary.id : null;
      }

      const updatedName = newName !== undefined ? newName : hive.name;
      const updatedHiveType = newHiveType !== undefined ? newHiveType : hive.hive_type;

      console.log('📤 Updating hive:', { hiveId, updatedName, apiary_id, updatedHiveType });

      await axios.put(`${API_BASE_URL}/api/hives/${hiveId}`, {
        name: updatedName,
        apiary_id,
        hive_type: updatedHiveType,
      });

      const response = await axios.get(`${API_BASE_URL}/api/hives`);
      setHives(response.data);
      console.log('✅ Hive updated successfully');
    } catch (err) {
      console.error('❌ Error updating hive:', err);
    }
  };

  // Add a new hive
  const addHive = async () => {
    const name = prompt('Enter hive name (optional):');
    const type = prompt('Enter hive type (Langstroth, Warre, Top Bar):') || 'Langstroth';
    try {
      const response = await axios.post(`${API_BASE_URL}/api/hives`, { name, type, currentApiary: null });
      setHives([...hives, response.data]);
    } catch (err) {
      console.error('Error adding hive:', err);
    }
  };

  // Add a new apiary
  const addApiary = async () => {
    const namePrompt = apiaries.length === 0 ? 'Enter apiary name (optional for first apiary):' : 'Enter apiary name:';
    const name = prompt(namePrompt);
    const postcode = prompt('Enter postcode (optional):');

    if (apiaries.length > 0 && !name) {
      console.log('⚠️ Name required for additional apiaries');
      alert('Name is required when adding additional apiaries.');
      return;
    }

    console.log('📤 Attempting to add apiary:', { name, postcode });
    try {
      const response = await axios.post(`${API_BASE_URL}/api/apiaries`, { name, postcode });
      console.log('✅ Apiary added:', response.data);
      setApiaries([...apiaries, response.data]);
    } catch (err) {
      console.error('❌ Error adding apiary:', err.response ? err.response.data : err.message);
    }
  };

  // Update apiary details
  const updateApiary = async (apiaryId, newName, newPostcode) => {
    try {
      const apiary = apiaries.find((a) => a.id === apiaryId);
      if (!apiary) {
        console.error('❌ Apiary not found:', apiaryId);
        return;
      }

      const updatedName = newName !== undefined ? newName : apiary.name;
      const updatedPostcode = newPostcode !== undefined ? newPostcode : apiary.postcode;

      console.log('📤 Updating apiary:', { apiaryId, updatedName, updatedPostcode });

      await axios.put(`${API_BASE_URL}/api/apiaries/${apiaryId}`, {
        name: updatedName,
        postcode: updatedPostcode,
      });

      const fetchResponse = await axios.get(`${API_BASE_URL}/api/apiaries`);
      setApiaries(fetchResponse.data);  // ✅ Corrected variable name
      console.log('✅ Apiary updated successfully');
    } catch (err) {
      console.error('❌ Error updating apiary:', err);
    }
  };  

  // Delete an apiary
  const deleteApiary = async (id) => {
    console.log(`🧐 Attempting to delete apiary with ID:`, id);

    try {
      const response = await axios.delete(`${API_BASE_URL}/api/apiaries/${id}`);

      if (response.status === 200 || (response.data && response.data.error === 'Apiary not found')) {
        console.log(`✅ Apiary ${id} deleted successfully or already gone!`);
        alert('Apiary deleted successfully!');
      } else if (response.data && response.data.error) {
        console.error('❌ Unexpected error deleting apiary:', response.data.error);
        alert(`Failed: ${response.data.error}`);
      }

      const fetchResponse = await axios.get(`${API_BASE_URL}/api/apiaries`);
      setApiaries(fetchResponse.data);
    } catch (err) {
      console.error('❌ Error deleting apiary:', err);
      const errorMessage = err.response ? err.response.data.error : err.message;
      if (err.response?.status === 404) {
        console.log(`✅ Apiary ${id} not found, treating as success`);
        alert('Apiary deleted successfully!');
      } else {
        alert(`Failed to delete apiary: ${errorMessage}`);
      }

      try {
        const fetchResponse = await axios.get(`${API_BASE_URL}/api/apiaries`);
        setApiaries(fetchResponse.data);
      } catch (fetchErr) {
        console.error('❌ Error fetching apiaries after deletion attempt:', fetchErr);
      }
    }
  };

  // Delete a hive
  const deleteHive = async (hiveId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this hive?');
    if (!confirmDelete) return;
  
    // First, check if the hive still exists on the server
    try {
      const response = await axios.get(`${API_BASE_URL}/api/hives`);
      const existingHives = response.data;
      if (!existingHives.find((hive) => hive.id === parseInt(hiveId))) {
        alert('Hive not found. It may have been deleted already.');
        return;
      }
    } catch (err) {
      console.error('Error checking if hive exists:', err);
      alert('Failed to check if hive exists.');
      return;
    }
  
    try {
      await axios.delete(`${API_BASE_URL}/api/hives/${hiveId}`);
      const response = await axios.get(`${API_BASE_URL}/api/hives`);
      setHives(response.data);
      if (selectedHive && selectedHive.id === parseInt(hiveId)) {
        setSelectedHive(null);
        setLatestInspection(null);
        setShowInspectionForm(false);
      }
      alert('Hive deleted successfully!');
    } catch (err) {
      console.error('Error deleting hive:', err);
      alert('Failed to delete hive.');
    }
  };

  // Sort hives for display
  const sortedHives = [...hives].sort((a, b) => {
    if (a.apiary_id && !b.apiary_id) return -1;
    if (!a.apiary_id && b.apiary_id) return 1;
    return a.id - b.id;
  });

  // Handle hive selection
  const handleHiveClick = async (hive) => {

    console.log('🖱️ Hive clicked:', hive);
    setSelectedHive(hive);

    try {
      const res = await axios.get(`${API_BASE_URL}/api/hive_inspections`);
      console.log('🧪 Full inspections from API:', res.data);

      setInspections(res.data);

      const latest = res.data
  .filter((i) => i.hive_id === hive.id)
  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

      setLatestInspection(latest || null);
    } catch (err) {
      console.error('❌ Error fetching inspections for hive:', err);
    }

    setShowInspectionForm(true);
  };

  // Generate chart data for hive distribution
  const getHiveChartData = () => {
    const hiveCounts = apiaries.map((apiary) => ({
      name: apiary.name,
      count: hives.filter((hive) => hive.apiary_id === apiary.id).length,
    }));
    return {
      labels: ['Hives'],
      datasets: hiveCounts.map((apiary, index) => ({
        label: apiary.name,
        data: [apiary.count],
        backgroundColor: ['#FBBF24', '#F59E0B', '#D97706', '#B45309', '#92400E'][index % 5],
      })),
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Hive Distribution Across Apiaries', font: { size: 18 } },
    },
    scales: {
      x: { stacked: true },
      y: { stacked: true, title: { display: true, text: 'Number of Hives' }, beginAtZero: true },
    },
  };

  // Handle apiary selection change
  const handleApiaryChange = (e) => {
    setSelectedApiary(e.target.value);
    setSelectedHive(null);
    setLatestInspection(null);
    setShowInspectionForm(false);
  };



  const renderLatestInspectionSummary = (inspection) => {
    console.log("🐝 Summary renderer received:", inspection);

    
    if (!inspection) return null;
  
    const labelMap = {
      inspection_date: "Date",
      notes: "Notes",
      // Main
      general_behavior: "General Behavior",
      flight_activity: "Flight Activity",
      population_growth: "Population Growth",
      forager_activity: "Forager Activity",
      status: "Status",
      // Queen
      queen_seen: "Queen Seen",
      queen_marked: "Queen Marked",
      queen_mark_color: "Queen Mark Colour",
      queen_clipped: "Queen Clipped",
      egg_laying: "Egg Laying Pattern",
      queen_cells: "Queen Cells",
      // Brood
      eggs_present: "Eggs Present",
      larvae_present: "Larvae Present",
      larvae_stage: "Larvae Stage",
      sealed_brood: "Sealed Brood",
      brood_pattern: "Brood Pattern",
      drone_brood: "Drone Brood Count",
      // Strength
      bee_coverage: "Bee Coverage",
      brood_frames: "Brood Frames",
      drone_population: "Drone Population",
      queenright_status: "Queenright Status",
    };
  
    const displayValue = (val) => {
      if (typeof val === 'boolean') return val ? 'Yes' : 'No';
      if (val === null || val === undefined || val === '') return null;
      return val;
    };
  
    const renderFields = (section, fields) => (
      Object.entries(fields).map(([key, value]) => {
        const label = labelMap[key];
        const display = displayValue(value);
        if (!label || display === null) return null;
        return (
          <li key={`${section}-${key}`}>
            <strong>{label}:</strong> {display}
          </li>
        );
      })
    );
  
    return (
      <div className="bg-gray-100 p-4 rounded-md shadow-md flex-grow mt-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Latest Inspection for Hive {inspection.hive_id}
        </h3>
        <pre className="text-xs text-gray-500 overflow-x-auto">{JSON.stringify(inspection, null, 2)}</pre>

        <ul className="list-disc ml-5 text-gray-700 space-y-1">
  {renderFields('main', inspection)}
  {Array.isArray(inspection.queen_status) && inspection.queen_status[0] && renderFields('queen', inspection.queen_status[0])}
  {Array.isArray(inspection.brood_presence) && inspection.brood_presence[0] && renderFields('brood', inspection.brood_presence[0])}
  {Array.isArray(inspection.colony_strength) && inspection.colony_strength[0] && renderFields('strength', inspection.colony_strength[0])}
</ul>

      </div>
    );
  };
  

  return (
    
    <div className="min-h-screen bg-gray-100 flex flex-col">
     

      <nav className="bg-white shadow-md p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Apiary Tracker</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('inspection-dashboard')}
              className={`px-4 py-2 rounded ${activeTab === 'inspection-dashboard' ? 'bg-amber-500 text-white' : 'bg-gray-200'}`}
            >
              Inspection Dashboard
            </button>
            <button
              onClick={() => setActiveTab('apiary')}
              className={`px-4 py-2 rounded ${activeTab === 'apiary' ? 'bg-amber-500 text-white' : 'bg-gray-200'}`}
            >
              Apiary
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded ${activeTab === 'overview' ? 'bg-amber-500 text-white' : 'bg-gray-200'}`}
            >
              Overview
            </button>
          </div>
        </div>
      </nav>

      <div className="flex-grow p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6 space-y-6">
          {activeTab === 'inspection-dashboard' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-700">Apiary</h2>
              <select
                value={selectedApiary}
                onChange={handleApiaryChange}
                className="p-2 border rounded"
              >
                {apiaries.map((apiary) => (
                  <option key={apiary.id} value={apiary.name}>
                    {apiary.name}
                  </option>
                ))}
              </select>
              <div className="bg-gray-100 p-4 rounded">
                <h3 className="text-lg font-medium">Hives in {selectedApiary}</h3>
                <div className="flex flex-wrap gap-4 mt-2">
                  {apiaryHives.map((hive) => {
                    console.log('🐝 Rendering Hive:', hive);

                    const actionsForHive = actionsForHives[hive.id] || []; // ✅ Show only this Hive's actions
                    const actions = actionsForHive.length > 0
                      ? actionsForHive.map((action) => action.action_text)
                      : ['None'];
                    

                    return (
                      <div
                        key={hive.id}
                        className={`bg-white p-3 rounded shadow w-48 cursor-pointer hover:bg-amber-100 ${
                          selectedHive?.id === hive.id ? 'border-2 border-amber-500' : ''
                        }`}
                        onClick={() => handleHiveClick(hive)}
                      >
                        <p className="font-semibold">
                          Hive {hive.id} "{hive.name || 'Unnamed'}"
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Actions:</strong>
                          {actions.map((action, index) => (
                            <span key={index} className="block">{action}</span>
                          ))}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Display latest inspection for selected hive */}
                {selectedHive && latestInspection && (
  <div className="mt-4">
    {renderLatestInspectionSummary(latestInspection)}
    {latestInspection.completed_actions && (
      <div className="bg-green-100 p-4 rounded-md shadow-md mt-4">
        <h4 className="text-md font-semibold text-gray-800">Completed Actions</h4>
        <ul className="list-disc ml-6">
          {JSON.parse(latestInspection.completed_actions).map((action, index) => (
            <li key={index}>
              {action.text} (Completed at: {new Date(action.completed_at).toLocaleString()})
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
)}

              </div>

              <button
                onClick={() => setShowInspectionForm(!showInspectionForm)}
                className="w-full p-3 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors duration-200 font-medium"
              >
                {showInspectionForm ? 'Hide Add New Inspection' : 'Add New Inspection'}
              </button>
              {showInspectionForm && (
             <InspectionForm
             onInspectionSaved={handleInspectionSaved}
             selectedApiary={selectedApiary}
             selectedHive={selectedHive}
             setSelectedHive={setSelectedHive}
             hives={hives}
             fetchHiveActions={fetchHiveActions} // Pass fetch function
           />
              )}
            </div>
          )}

          {activeTab === 'apiary' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-700">Manage Hives and Apiaries</h2>
              <button onClick={addHive} className="bg-green-500 text-white px-4 py-2 rounded">
                Add Hive
              </button>
              <button onClick={addApiary} className="bg-green-500 text-white px-4 py-2 rounded ml-4">
                Add Apiary
              </button>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2">Hive ID</th>
                    <th className="border p-2">Name</th>
                    <th className="border p-2">Type</th>
                    <th className="border p-2">Current Apiary</th>
                    <th className="border p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedHives.map((hive) => (
                    <tr key={hive.id}>
                      <td className="border p-2">{hive.id}</td>
                      <td className="border p-2">
                        <input
                          type="text"
                          defaultValue={hive.name || ''}
                          onBlur={(e) => updateHive(hive.id, e.target.value, undefined, undefined)}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="border p-2">
                        <select
                          defaultValue={hive.hive_type || 'Langstroth'}
                          onChange={(e) => updateHive(hive.id, undefined, undefined, e.target.value)}
                          className="w-full p-1 border rounded"
                        >
                          <option value="Langstroth">Langstroth</option>
                          <option value="Warre">Warre</option>
                          <option value="Top Bar">Top Bar</option>
                        </select>
                      </td>
                      <td className="border p-2">
                        <select
                          value={
                            apiaries.find((a) => a.id === hive.apiary_id)?.name || 'Unassigned'
                          }
                          onChange={(e) => updateHive(hive.id, undefined, e.target.value, undefined)}
                          className="w-full p-1 border rounded"
                        >
                          <option value="Unassigned">Unassigned</option>
                          {apiaries.map((apiary) => (
                            <option key={apiary.id} value={apiary.name}>
                              {apiary.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="border p-2">
                        <button
                          onClick={() => deleteHive(hive.id)}
                          className="bg-red-500 text-white px-2 py-1 rounded"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h2 className="text-xl font-semibold text-gray-700 mt-6">Apiaries</h2>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2">Apiary ID</th>
                    <th className="border p-2">Name</th>
                    <th className="border p-2">Postcode</th>
                    <th className="border p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {apiaries.map((apiary) => (
                    <tr key={apiary.id}>
                      <td className="border p-2">{apiary.id}</td>
                      <td className="border p-2">
                        <input
                          type="text"
                          defaultValue={apiary.name || ''}
                          onBlur={(e) => updateApiary(apiary.id, e.target.value, undefined)}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          type="text"
                          defaultValue={apiary.postcode || ''}
                          onBlur={(e) => updateApiary(apiary.id, undefined, e.target.value)}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="border p-2">
                        <button
                          onClick={() => deleteApiary(apiary.id)}
                          className="bg-red-500 text-white px-2 py-1 rounded"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-700">Overview</h2>
              <div className="bg-gray-100 p-4 rounded">
                <Bar data={getHiveChartData()} options={chartOptions} />
              </div>
              <div className="space-y-4">
                {apiaries.map((apiary) => (
                  <div key={apiary.id} className="bg-gray-50 p-4 rounded shadow">
                    <h3 className="text-lg font-medium">{apiary.name}</h3>
                    <p><strong>Postcode:</strong> {apiary.postcode || 'N/A'}</p>
                    <p><strong>Hives:</strong> {hives.filter((hive) => hive.apiary_id === apiary.id).length}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;