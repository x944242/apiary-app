import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InspectionForm from './InspectionForm';
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

function App() {
  const [inspections, setInspections] = useState([]);
  const [hives, setHives] = useState([]);
  const [apiaries, setApiaries] = useState([]);
  const [activeTab, setActiveTab] = useState('inspection-dashboard');
  const [selectedApiary, setSelectedApiary] = useState('Ratho');
  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const [selectedHive, setSelectedHive] = useState(null);
  const [latestInspection, setLatestInspection] = useState(null);

  useEffect(() => {
    const fetchApiaries = async () => {
      try {
        const response = await axios.get('http://localhost:3001/apiaries');
        console.log('✅ Fetched latest apiary data:', response.data);
        setApiaries(response.data);
      } catch (err) {
        console.error('❌ Error fetching apiaries:', err);
      }
    };

    fetchApiaries();
  }, []);

  useEffect(() => {
    const fetchHives = async () => {
      try {
        const response = await axios.get('http://localhost:3001/hives');
        setHives(response.data);
      } catch (err) {
        console.error('Error fetching hives:', err);
      }
    };
    fetchHives();
  }, []);

  const handleInspectionSaved = async () => {
    try {
      const res = await axios.get('http://localhost:3001/hive_inspections');
      setInspections(res.data);

      if (selectedHive) {
        const latest = res.data
          .filter((i) => i.hive_id === selectedHive.id)
          .sort((a, b) => new Date(b.inspection_date) - new Date(a.inspection_date))[0];
        setLatestInspection(latest || null);
      }

      console.log('🔄 Inspections updated after save:', res.data);
    } catch (err) {
      console.error('❌ Error fetching inspections after save:', err);
    }
  };

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

      await axios.put(`http://localhost:3001/hives/${hiveId}`, {
        name: updatedName,
        apiary_id,
        hive_type: updatedHiveType,
      });

      const response = await axios.get('http://localhost:3001/hives');
      setHives(response.data);
      console.log('✅ Hive updated successfully');
    } catch (err) {
      console.error('❌ Error updating hive:', err);
    }
  };

  const addHive = async () => {
    const name = prompt('Enter hive name (optional):');
    const type = prompt('Enter hive type (Langstroth, Warre, Top Bar):') || 'Langstroth';
    try {
      const response = await axios.post('http://localhost:3001/hives', { name, type, currentApiary: null });
      setHives([...hives, response.data]);
    } catch (err) {
      console.error('Error adding hive:', err);
    }
  };

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
      const response = await axios.post('http://localhost:3001/apiaries', { name, postcode });
      console.log('✅ Apiary added:', response.data);
      setApiaries([...apiaries, response.data]);
    } catch (err) {
      console.error('❌ Error adding apiary:', err.response ? err.response.data : err.message);
    }
  };

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

      await axios.put(`http://localhost:3001/apiaries/${apiaryId}`, {
        name: updatedName,
        postcode: updatedPostcode,
      });

      const response = await axios.get('http://localhost:3001/apiaries');
      setApiaries(response.data);
      console.log('✅ Apiary updated successfully');
    } catch (err) {
      console.error('❌ Error updating apiary:', err);
    }
  };

  const deleteApiary = async (id) => {
    console.log(`🧐 Attempting to delete apiary with ID:`, id);

    try {
      const response = await axios.delete(`http://localhost:3001/apiaries/${id}`);

      if (response.status === 200 || (response.data && response.data.error === 'Apiary not found')) {
        console.log(`✅ Apiary ${id} deleted successfully or already gone!`);
        alert('Apiary deleted successfully!');
      } else if (response.data && response.data.error) {
        console.error('❌ Unexpected error deleting apiary:', response.data.error);
        alert(`Failed: ${response.data.error}`);
      }

      const fetchResponse = await axios.get('http://localhost:3001/apiaries');
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
        const fetchResponse = await axios.get('http://localhost:3001/apiaries');
        setApiaries(fetchResponse.data);
      } catch (fetchErr) {
        console.error('❌ Error fetching apiaries after deletion attempt:', fetchErr);
      }
    }
  };

  const deleteHive = async (hiveId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this hive?');
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:3001/hives/${hiveId}`);
      const response = await axios.get('http://localhost:3001/hives');
      setHives(response.data);

      if (selectedHive && selectedHive.id === hiveId) {
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

  const sortedHives = [...hives].sort((a, b) => {
    if (a.apiary_id && !b.apiary_id) return -1;
    if (!a.apiary_id && b.apiary_id) return 1;
    return a.id - b.id;
  });

  const handleHiveClick = async (hive) => {
    console.log('🖱️ Hive clicked:', hive);
    setSelectedHive(hive);

    try {
      const res = await axios.get('http://localhost:3001/hive_inspections');
      setInspections(res.data);

      const latest = res.data
        .filter((i) => i.hive_id === hive.id)
        .sort((a, b) => new Date(b.inspection_date) - new Date(a.inspection_date))[0];
      setLatestInspection(latest || null);
    } catch (err) {
      console.error('❌ Error fetching inspections for hive:', err);
    }

    setShowInspectionForm(true);
  };

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

  const handleApiaryChange = (e) => {
    setSelectedApiary(e.target.value);
    setSelectedHive(null);
    setLatestInspection(null);
    setShowInspectionForm(false);
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

                    const latestInspectionForHive = inspections
                      .filter((i) => i.hive_id === hive.id)
                      .sort((a, b) => new Date(b.inspection_date) - new Date(a.inspection_date))[0];

                    const actions = latestInspectionForHive?.next_inspection_needs
                      ? latestInspectionForHive.next_inspection_needs.split('\n')
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

                {/* Conditional rendering for selectedHive and latestInspection */}
                {selectedHive && latestInspection && (
                  <div className="mt-4">
                    <div className="md:flex md:items-start gap-4">
                      <div className="bg-gray-100 p-4 rounded-md shadow-md flex-grow">
                        <h3 className="text-lg font-semibold text-gray-800">
                          Latest Inspection for Hive {selectedHive.id}
                        </h3>
                        <p><strong>Date:</strong> {latestInspection.inspection_date}</p>
                        <p><strong>Queen Seen:</strong> {latestInspection.queen_status?.queen_seen ? 'Yes' : 'No'}</p>
                        <p><strong>Egg Laying:</strong> {latestInspection.queen_status?.egg_laying || 'N/A'}</p>
                        <p><strong>Eggs Present:</strong> {latestInspection.brood_presence?.eggs_present ? 'Yes' : 'No'}</p>
                        <p><strong>Brood Pattern:</strong> {latestInspection.brood_presence?.brood_pattern || 'N/A'}</p>
                        <p><strong>Bee Coverage:</strong> {latestInspection.colony_strength?.bee_coverage || 'N/A'}</p>
                        <p><strong>Queenright Status:</strong> {latestInspection.colony_strength?.queenright_status || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-100 p-4 rounded-md shadow-md flex-grow">
                        <p><strong>Queen Notes:</strong> {latestInspection.queen_status?.notes || 'None'}</p>
                        <p><strong>Brood Notes:</strong> {latestInspection.brood_presence?.notes || 'None'}</p>
                        <p><strong>Colony Notes:</strong> {latestInspection.colony_strength?.notes || 'None'}</p>
                        <p><strong>Follow-Up Actions:</strong></p>
                        <ul className="list-disc ml-6">
                          {latestInspection.next_inspection_needs
                            ? latestInspection.next_inspection_needs.split('\n').map((action, index) => (
                              <li key={index}>{action}</li>
                            ))
                            : <li>No actions</li>
                          }
                        </ul>
                      </div>
                    </div>
                    {latestInspection.completed_actions && (
                      <div className="bg-green-100 p-4 rounded-md shadow-md mt-4">
                        <h4 className="text-md font-semibold text-gray-800">Completed Actions</h4>
                        <ul className="list-disc ml-6">
                          {JSON.parse(latestInspection.completed_actions).map((action, index) => (
                            <li key={index}>{action.text} (Completed at: {new Date(action.completed_at).toLocaleString()})</li>
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
                  apiaryHives={apiaryHives}
                  selectedHive={selectedHive}
                  hives={hives}
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