import React, { useState, useEffect } from 'react';
import axios from 'axios';

function InspectionForm({ onInspectionSaved, selectedApiary, selectedHive, hives }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    queenStatus: '',
    foodStores: '',
    temperature: '',
    rain: '',
    broodPattern: '',
    notes: '',
    actions: [],
  });

  const [previousActions, setPreviousActions] = useState([]);
  const [latestInspection, setLatestInspection] = useState(null);

  useEffect(() => {
    const fetchPreviousActions = async () => {
      try {
        const response = await axios.get('http://localhost:3001/hive_inspections');
        const latestInspectionData = response.data
          .filter((i) => i.apiary === selectedApiary && i.hiveNumber === selectedHive?.hiveNumber)
          .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  
        if (latestInspectionData) {
          const actionsArray = latestInspectionData.followUpActions
            ? latestInspectionData.followUpActions
                .split('\n')
                .filter((line) => line.trim())
                .map((text, index) => ({
                  id: index + 1,
                  text,
                  checked: false,
                }))
            : [];
  
          setPreviousActions(actionsArray);
          setFormData((prevForm) => ({
            ...prevForm,
            actions: actionsArray,
          }));
        } else {
          setPreviousActions([]);
          setFormData((prevForm) => ({
            ...prevForm,
            actions: [],
          }));
        }
      } catch (err) {
        console.error('Error fetching previous actions:', err);
      }
    };
  
    if (selectedHive) {
      fetchPreviousActions();
    }
  }, [selectedHive, selectedApiary]);
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

 const handleActionChange = (index, field, value) => {
  const updatedActions = [...formData.actions];
  updatedActions[index] = { ...updatedActions[index], [field]: value };
  setFormData({ ...formData, actions: updatedActions });
};


  const handlePreviousActionChange = (index, checked) => {
    const updatedPreviousActions = [...previousActions];
    updatedPreviousActions[index] = { ...updatedPreviousActions[index], checked };
  
    // ✅ Remove checked actions only when explicitly marked
    setPreviousActions(updatedPreviousActions.filter(action => !action.checked));
  };
  
  const addAction = () => {
    const newActionId = formData.actions.length
      ? Math.max(...formData.actions.map((a) => a.id)) + 1
      : 1;
  
    setFormData((prevForm) => ({
      ...prevForm,
      actions: [
        ...prevForm.actions, // ✅ Preserve existing actions
        { id: newActionId, text: '', checked: false },
      ],
    }));
  };
  

  

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!selectedHive || !selectedHive.hive_number) {
      alert("❌ Error: You must select a hive before submitting an inspection.");
      return;
    }
  
    const hive_id = selectedHive?.id;
    const hiveName = selectedHive?.name || '';
  
    // ✅ Ensure previous unchecked + new unchecked actions persist
    const allActions = [
      ...formData.actions.filter((a) => !a.checked && a.text.trim()), // ✅ Keep unchecked actions
    ];
  
    const followUpActionsText = allActions.length > 0 
      ? allActions.map((a, i) => `${i + 1}. ${a.text}`).join('\n') 
      : null;
  
    console.log("📤 Sending payload:", JSON.stringify({
      apiary: selectedApiary,
      hive_id,
      hiveName,
      date: formData.date,
      queenStatus: formData.queenStatus || null,
      foodStores: formData.foodStores || null,
      temperature: formData.temperature || null,
      rain: formData.rain || null,
      broodPattern: formData.broodPattern || null,
      notes: formData.notes || null,
      followUpActions: followUpActionsText,
    }, null, 2));
  
    try {
      const response = await axios.post('http://localhost:3001/hive_inspections', {
        apiary: selectedApiary,
        hive_id,
        hiveName,
        date: formData.date,
        queenStatus: formData.queenStatus || null,
        foodStores: formData.foodStores || null,
        temperature: formData.temperature || null,
        rain: formData.rain || null,
        broodPattern: formData.broodPattern || null,
        notes: formData.notes || null,
        followUpActions: followUpActionsText,
      });
  
      console.log('✅ Inspection saved successfully:', response.data);
      alert('Inspection saved successfully!');
  
      // ✅ Preserve unchecked actions after submission
      setFormData((prevForm) => ({
        ...prevForm,
        actions: allActions, // ✅ Only unchecked actions persist
      }));
  
      if (onInspectionSaved) onInspectionSaved();
    } catch (err) {
      console.error('❌ Error saving inspection:', err.response ? err.response.data : err);
      alert('Failed to save inspection');
    }
  };
  



  
  console.log("Selected Hive in InspectionForm:", selectedHive);
  console.log("selectedHive in InspectionForm:", selectedHive);


  return (
    <div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Queen Status</label>
          <select
            name="queenStatus"
            value={formData.queenStatus}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="" className="text-gray-400">Select Queen Status</option>
            <option value="Queen seen" className="text-gray-800">Queen seen</option>
            <option value="Brood but not queen seen" className="text-gray-800">Brood but not queen seen</option>
            <option value="Probably requeening" className="text-gray-800">Probably requeening</option>
            <option value="Probably queenless" className="text-gray-800">Probably queenless</option>
            <option value="Laying workers" className="text-gray-800">Laying workers</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Food Stores</label>
          <select
            name="foodStores"
            value={formData.foodStores}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="" className="text-gray-400">Select Food Stores</option>
            <option value="Dangerously low" className="text-gray-800">Dangerously low</option>
            <option value="Low" className="text-gray-800">Low</option>
            <option value="Medium" className="text-gray-800">Medium</option>
            <option value="High" className="text-gray-800">High</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Temperature</label>
          <select
            name="temperature"
            value={formData.temperature}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="" className="text-gray-400">Select Temperature</option>
            <option value="hot" className="text-gray-800">Hot</option>
            <option value="warm" className="text-gray-800">Warm</option>
            <option value="cool" className="text-gray-800">Cool</option>
            <option value="cold" className="text-gray-800">Cold</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Rain</label>
          <select
            name="rain"
            value={formData.rain}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="" className="text-gray-400">Select Rain Condition</option>
            <option value="normal" className="text-gray-800">Normal</option>
            <option value="wet" className="text-gray-800">Wet</option>
            <option value="drought" className="text-gray-800">Drought</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Brood Pattern</label>
          <select
            name="broodPattern"
            value={formData.broodPattern}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="" className="text-gray-400">Select Brood Pattern</option>
            <option value="Solid" className="text-gray-800">Solid</option>
            <option value="Spotty" className="text-gray-800">Spotty</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-600 mb-1">Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Additional observations"
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400 min-h-[100px] placeholder-gray-400"
          />
        </div>
  
        <div className="md:col-span-2">
  <label className="block text-sm font-medium text-gray-600 mb-1">Actions</label>
  <div className="space-y-2">
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
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
          placeholder="Enter action"
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
</div>



        <button
          type="submit"
          className="md:col-span-2 w-full p-3 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors duration-200 font-medium"
        >
          Save Inspection
        </button>
      </form>
    </div>
  );
}

export default InspectionForm;