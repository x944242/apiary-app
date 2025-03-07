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
  const [selectedApiary, setSelectedApiary] = useState('null');
  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const [selectedHive, setSelectedHive] = useState(null);
  const [latestInspection, setLatestInspection] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [inspectionsRes, hivesRes, apiariesRes] = await Promise.all([
          axios.get('http://localhost:3001/hive_inspections'),
          axios.get('http://localhost:3001/hives'),
          axios.get('http://localhost:3001/apiaries'),
        ]);
  
        console.log("Hives fetched:", hivesRes.data); 
        setInspections(inspectionsRes.data);
        setHives(hivesRes.data);
        setApiaries(apiariesRes.data);
  
        // ✅ Set the first apiary in the list as the default, if available
        if (apiariesRes.data.length > 0) {
          setSelectedApiary(apiariesRes.data[0].name);
        } else {
          setSelectedApiary(null);
        }
  
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
  }, []);
  

  const handleInspectionSaved = async () => {
    try {
        const res = await axios.get('http://localhost:3001/hive_inspections');
        setInspections(res.data);

        // ✅ If a hive is selected, update its latest inspection
        if (selectedHive) {
            const latest = res.data
                .filter((i) => i.hive_id === selectedHive.id)
                .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
            setLatestInspection(latest || null);
        }

        console.log("🔄 Inspections updated after save:", res.data);
    } catch (err) {
        console.error('❌ Error fetching inspections after save:', err);
    }
};



  const apiaryHives = hives
  .filter((hive) => {
    const matchingApiary = apiaries.find(apiary => apiary.name === selectedApiary);
    return hive.apiary_id === (matchingApiary ? matchingApiary.id : null);
  })
  .sort((a, b) => {
    if (a.apiary_id && !b.apiary_id) return -1;  // Assigned hives first
    if (!a.apiary_id && b.apiary_id) return 1;   // Unassigned hives last
    return a.hive_number - b.hive_number;        // Sort numerically
  });

console.log("🔥 Updated apiaryHives:", apiaryHives);

  
  
  const updateHive = async (hiveNumber, newName, newApiaryName, newType) => {
    try {
        // Find the existing hive by hive number
        const hive = hives.find(h => h.hive_number === hiveNumber);
        if (!hive) {
            console.error("❌ Hive not found:", hiveNumber);
            return;
        }

        // ✅ Preserve the existing apiary_id unless explicitly changed
        let apiary_id = hive.apiary_id; 
        if (newApiaryName !== undefined) {
            const apiary = apiaries.find(a => a.name === newApiaryName);
            apiary_id = apiary ? apiary.id : null;  // Assign new apiary ID if changed
        }

        // ✅ Preserve existing name and type if not explicitly changed
        const updatedName = newName !== undefined ? newName : hive.name;
        const updatedType = newType !== undefined ? newType : hive.type;

        console.log("📤 Updating hive:", { hiveNumber, updatedName, apiary_id, updatedType });

        // ✅ Send the update request to the backend
        await axios.put(`http://localhost:3001/hives/${hiveNumber}`, {
            name: updatedName,
            apiary_id, // ✅ Ensures it remains unchanged if not modified
            type: updatedType,
        });

        // ✅ Fetch the latest list of hives from the backend
        const response = await axios.get('http://localhost:3001/hives');
        setHives(response.data); // Update state with fresh hive data
        console.log("✅ Hive updated successfully");
    } catch (err) {
        console.error('❌ Error updating hive:', err);
    }
};


  
  

  const addHive = async () => {
    const hiveNumbers = hives.map((h) => h.hiveNumber).filter((num) => Number.isInteger(num));
    const hiveNumber = hiveNumbers.length > 0 ? Math.max(...hiveNumbers) + 1 : 1;
    const name = prompt('Enter hive name (optional):');
    const type = prompt('Enter hive type (Full size, Nuc, Mating nuc):') || 'Full size';
    try {
      const response = await axios.post('http://localhost:3001/hives', { hiveNumber, name, type, currentApiary: null });
      setHives([...hives, response.data]);
    } catch (err) {
      console.error('Error adding hive:', err);
    }
  };

  const addApiary = async () => {
    const name = prompt('Enter apiary name:');
    const postcode = prompt('Enter postcode (optional):');
    if (name) {
      try {
        const response = await axios.post('http://localhost:3001/apiaries', { name, postcode });
        setApiaries([...apiaries, response.data]);
      } catch (err) {
        console.error('Error adding apiary:', err);
      }
    }
  };

  const deleteApiary = async (name) => {
    const password = prompt('Enter the security password to confirm deletion:');
    if (password === 'confirm') {
      try {
        await axios.delete(`http://localhost:3001/apiaries/${name}`);
        setApiaries(apiaries.filter((apiary) => apiary.name !== name));
        setHives(hives.map((hive) => (hive.currentApiary === name ? { ...hive, currentApiary: null } : hive)));
      } catch (err) {
        console.error('Error deleting apiary:', err);
      }
    } else {
      alert('Incorrect password. Deletion canceled.');
    }
  };

  const deleteHive = async (hiveNumber) => {
  const confirmDelete = window.confirm(`Are you sure you want to delete Hive ${hiveNumber}?`);
  if (!confirmDelete) return;

  try {
    console.log("🗑️ Deleting Hive:", hiveNumber); // Debugging log

    const response = await axios.delete(`http://localhost:3001/hives/${hiveNumber}`);
    
    if (response.status === 200) {
      console.log("✅ Hive deleted:", response.data);
      setHives((prevHives) => prevHives.filter((hive) => hive.hive_number !== hiveNumber));
      alert("Hive deleted successfully!");
    } else {
      console.warn("⚠️ Unexpected response status:", response.status);
      alert("Something went wrong. Hive may not have been deleted.");
    }
  } catch (err) {
    console.error("❌ Error deleting hive:", err);
    alert("Failed to delete hive.");
  }
};

  
  

  const sortedHives = [...hives].sort((a, b) => {
    if (a.currentApiary && !b.currentApiary) return -1;
    if (!a.currentApiary && b.currentApiary) return 1;
    return a.hiveNumber - b.hiveNumber;
  });

  const handleHiveClick = (hive) => {
    console.log("🖱️ Hive clicked:", hive);
    setSelectedHive(hive);

    // ✅ Find the latest inspection for this hive
    const latest = inspections
        .filter((i) => i.hive_id === hive.id)  // Ensure it matches the hive_id
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];  // Sort descending

    setLatestInspection(latest || null);  // ✅ Store latest inspection or null
    setShowInspectionForm(false);
};

  const getHiveChartData = () => {
    const hiveCounts = apiaries.map((apiary) => ({
      name: apiary.name,
      count: hives.filter((hive) => hive.currentApiary === apiary.name).length,
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
    const newApiary = e.target.value;
    setSelectedApiary(newApiary || null); // ✅ Ensure it can be null
    setSelectedHive(null);
    setLatestInspection(null);
  };
  
  

  console.log("selectedApiary:", selectedApiary);
console.log("apiaryHives:", apiaryHives);

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
  value={selectedApiary || ''}  // ✅ Ensure it starts empty
  onChange={handleApiaryChange}
  className="p-2 border rounded"
>
  <option value="" disabled>Select an Apiary</option> {/* ✅ Placeholder */}
  {apiaries.map((apiary) => (
    <option key={apiary.name} value={apiary.name}>
      {apiary.name}
    </option>
  ))}
</select>


{selectedApiary && (
  <div className="bg-gray-100 p-4 rounded">
    <h3 className="text-lg font-medium">Hives in {selectedApiary}</h3>
    <div className="flex flex-wrap gap-4 mt-2">
    {apiaryHives.map((hive) => {
  console.log("🐝 Rendering Hive:", hive);

  // ✅ Find the latest inspection for this hive
  const latestInspection = inspections
    .filter((i) => i.hive_id === hive.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  const actions = latestInspection?.follow_up_actions
    ? latestInspection.follow_up_actions.split('\n')
    : ['None'];

  return (
    <div 
      key={hive.hive_number}
      className={`bg-white p-3 rounded shadow w-48 cursor-pointer hover:bg-amber-100 ${
        selectedHive?.hive_number === hive.hive_number ? 'border-2 border-amber-500' : ''
      }`}
      onClick={() => handleHiveClick(hive)} // ✅ Ensure this properly updates selectedHive
    >
      <p className="font-semibold">
        Hive {hive.hive_number} "{hive.name || 'Unnamed'}"
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

    {/* ✅ Wrap the following inside a div */}
    {selectedHive && latestInspection && (
      <div className="bg-gray-100 p-4 rounded-md shadow-md mt-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Latest Inspection for Hive {selectedHive.hive_number}
        </h3>
        <p><strong>Date:</strong> {latestInspection.date}</p>
        <p><strong>Queen Status:</strong> {latestInspection.queen_status || 'N/A'}</p>
        <p><strong>Food Stores:</strong> {latestInspection.food_stores || 'N/A'}</p>
        <p><strong>Temperature:</strong> {latestInspection.temperature || 'N/A'}</p>
        <p><strong>Rain:</strong> {latestInspection.rain || 'N/A'}</p>
        <p><strong>Brood Pattern:</strong> {latestInspection.brood_pattern || 'N/A'}</p>
        <p><strong>Notes:</strong> {latestInspection.notes || 'None'}</p>
        <p><strong>Follow-Up Actions:</strong></p>
        <ul className="list-disc ml-6">
          {latestInspection.follow_up_actions
            ? latestInspection.follow_up_actions.split('\n').map((action, index) => (
                <li key={index}>{action}</li>
              ))
            : <li>No actions</li>}
        </ul>
      </div>
    )}
  </div> // ✅ Closes the main div wrapper
)}
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
                  hives={hives}  // ✅ Add this line
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
      <th className="border p-2">Hive Number</th>
      <th className="border p-2">Name</th>
      <th className="border p-2">Type</th>
      <th className="border p-2">Current Apiary</th>
      <th className="border p-2">Actions</th> {/* New column for delete button */}
    </tr>
  </thead>
  <tbody>
    {sortedHives.map((hive) => (
      <tr key={hive.hive_number}>
        <td className="border p-2">{hive.hive_number}</td>
        <td className="border p-2">
        <input
  type="text"
  value={hive.name}
  onChange={(e) => updateHive(hive.hive_number, e.target.value, selectedApiary, hive.type)}
  className="border rounded p-2 w-full"
/>
        </td>
        <td className="border p-2">
        <select
    value={hive.type || ''}  // Ensure it's never undefined
    onChange={(e) => {
      console.log("🔄 Changing hive type:", e.target.value, "for hive:", hive);
      updateHive(hive.hive_number, hive.name, selectedApiary, e.target.value);
    }}
    className="border rounded p-2"
  >
    <option value="Full size">Full Size</option>
    <option value="Nuc">Nuc</option>
    <option value="Queen Rearing">Queen Rearing</option>
    <option value="Observation">Observation</option>
  </select>
        </td>
        <td className="border p-2">
          <select
            value={hive.apiary_id ? (apiaries.find(a => a.id === hive.apiary_id)?.name || '') : ''}
            onChange={(e) => updateHive(hive.hive_number, hive.name, e.target.value, hive.type)}
            className="w-full p-1 border rounded"
          >
            <option value="">Unassigned</option>
            {apiaries.map((apiary) => (
              <option key={apiary.id} value={apiary.name}>
                {apiary.name}
              </option>
            ))}
          </select>
        </td>
        <td className="border p-2">
  <button
    onClick={() => deleteHive(hive.hive_number)}  // ✅ Ensure correct parameter
    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors"
  >
    Delete
  </button>
</td>

      </tr>
    ))}
  </tbody>
</table>

              <h3 className="text-lg font-medium">Apiaries</h3>
              {apiaries.map((apiary) => (
                <div key={apiary.name} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                  <span>{apiary.name} - Postcode: {apiary.postcode || 'Not set'}</span>
                  <button onClick={() => deleteApiary(apiary.name)} className="bg-red-500 text-white px-2 py-1 rounded">
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-700">Overview</h2>
              <div className="bg-white p-4 rounded-md shadow-sm">
                <Bar data={getHiveChartData()} options={chartOptions} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;