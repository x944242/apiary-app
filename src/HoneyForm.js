// src/HoneyForm.js
import React, { useState } from 'react';
import axios from 'axios';

function HoneyForm({ onHoneySaved }) {
  const [formData, setFormData] = useState({
    apiary: 'ratho',
    hiveNumber: '',
    honeyYield: '',
    date: new Date().toISOString().split('T')[0], // Default to today
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Find the most recent inspection for this apiary and hiveNumber before this date
      const response = await axios.get('http://localhost:3001/inspections');
      const inspections = response.data;
      const targetInspection = inspections
        .filter(i => i.apiary === formData.apiary && i.hiveNumber === Number(formData.hiveNumber) && new Date(i.date) <= new Date(formData.date))
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

      if (!targetInspection) {
        alert('No matching inspection found for this apiary, hive, and date.');
        return;
      }

      // Update the inspection with honeyYield
      const updatedInspection = { ...targetInspection, honeyYield: formData.honeyYield };
      await axios.put(`http://localhost:3001/inspections/${targetInspection.id}`, updatedInspection);
      alert('Honey yield saved successfully!');
      setFormData({
        apiary: 'ratho',
        hiveNumber: '',
        honeyYield: '',
        date: new Date().toISOString().split('T')[0],
      });
      if (onHoneySaved) onHoneySaved();
    } catch (err) {
      console.error('Error saving honey yield:', err);
      alert('Failed to save honey yield');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Add Honey Yield</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Apiary</label>
          <select name="apiary" value={formData.apiary} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400">
            <option value="ratho">Ratho</option>
            <option value="balerno">Balerno</option>
            <option value="fort kinnaird">Fort Kinnaird</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Hive Number</label>
          <input type="number" name="hiveNumber" value={formData.hiveNumber} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
          <input type="date" name="date" value={formData.date} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Honey Yield</label>
          <input type="number" step="0.1" name="honeyYield" value={formData.honeyYield} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </div>
        <button type="submit" className="md:col-span-2 w-full p-3 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors duration-200 font-medium">Save Honey Yield</button>
      </form>
    </div>
  );
}

export default HoneyForm;