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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [inspectionsRes, hivesRes, apiariesRes] = await Promise.all([
          axios.get('http://localhost:3001/inspections'),
          axios.get('http://localhost:3001/hives'),
          axios.get('http://localhost:3001/apiaries'),
        ]);
        setInspections(inspectionsRes.data);
        setHives(hivesRes.data);
        setApiaries(apiariesRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
  }, []);

  const handleInspectionSaved = () => {
    axios.get('http://localhost:3001/inspections').then((res) => setInspections(res.data));
  };

  const apiaryHives = hives.filter((hive) => hive.currentApiary === selectedApiary);

  const updateHive = async (hiveNumber, name, currentApiary, type) => {
    try {
      const hive = hives.find((h) => h.hiveNumber === hiveNumber);
      const response = await axios.put(`http://localhost:3001/hives/${hiveNumber}`, {
        name: name !== undefined ? name : hive.name,
        currentApiary: currentApiary !== undefined ? currentApiary : hive.currentApiary,
        type: type !== undefined ? type : hive.type,
      });
      setHives(hives.map((h) => (h.hiveNumber === hiveNumber ? response.data : h)));
    } catch (err) {
      console.error('Error updating hive:', err);
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

  const sortedHives = [...hives].sort((a, b) => {
    if (a.currentApiary && !b.currentApiary) return -1;
    if (!a.currentApiary && b.currentApiary) return 1;
    return a.hiveNumber - b.hiveNumber;
  });

  const handleHiveClick = (hive) => {
    setSelectedHive(hive);
    setShowInspectionForm(true);
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
                onChange={(e) => setSelectedApiary(e.target.value)}
                className="p-2 border rounded"
              >
                {apiaries.map((apiary) => (
                  <option key={apiary.name} value={apiary.name}>
                    {apiary.name}
                  </option>
                ))}
              </select>
              <div className="bg-gray-100 p-4 rounded">
                <h3 className="text-lg font-medium">Hives in {selectedApiary}</h3>
                <div className="flex flex-wrap gap-4 mt-2">
                  {apiaryHives.map((hive) => {
                    const latestInspection = inspections
                      .filter((i) => i.hiveNumber === hive.hiveNumber && i.apiary === selectedApiary)
                      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                    const actions = latestInspection?.followUpActions
                      ? latestInspection.followUpActions.split('\n')
                      : ['None'];
                    return (
                      <div
                        key={hive.hiveNumber}
                        className={`bg-white p-3 rounded shadow w-48 cursor-pointer hover:bg-amber-100 ${
                          selectedHive?.hiveNumber === hive.hiveNumber ? 'border-2 border-amber-500' : ''
                        }`}
                        onClick={() => handleHiveClick(hive)}
                      >
                        <p className="font-semibold">
                          Hive {hive.hiveNumber} "{hive.name || 'Unnamed'}"
                        </p>
                        <p className="text-sm text-gray-600">
                          Actions:
                          {actions.map((action, index) => (
                            <span key={index} className="block">{action}</span>
                          ))}
                        </p>
                      </div>
                    );
                  })}
                </div>
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
                  </tr>
                </thead>
                <tbody>
                  {sortedHives.map((hive) => (
                    <tr key={hive.hiveNumber}>
                      <td className="border p-2">{hive.hiveNumber}</td>
                      <td className="border p-2">
                        <input
                          type="text"
                          value={hive.name || ''}
                          onChange={(e) => updateHive(hive.hiveNumber, e.target.value, hive.currentApiary, hive.type)}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="border p-2">
                        <select
                          value={hive.type || 'Full size'}
                          onChange={(e) => updateHive(hive.hiveNumber, hive.name, hive.currentApiary, e.target.value)}
                          className="w-full p-1 border rounded"
                        >
                          <option value="Full size">Full size</option>
                          <option value="Nuc">Nuc</option>
                          <option value="Mating nuc">Mating nuc</option>
                        </select>
                      </td>
                      <td className="border p-2">
                        <select
                          value={hive.currentApiary || ''}
                          onChange={(e) => updateHive(hive.hiveNumber, hive.name, e.target.value || null, hive.type)}
                          className="w-full p-1 border rounded"
                        >
                          <option value="">Unassigned</option>
                          {apiaries.map((apiary) => (
                            <option key={apiary.name} value={apiary.name}>
                              {apiary.name}
                            </option>
                          ))}
                        </select>
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