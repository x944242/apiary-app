// In InspectionForm.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';

function InspectionForm({ onInspectionSaved, selectedApiary, selectedHive, hives }) {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        queenStatus: '',
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
                    .filter((i) => i.hive_id === selectedHive?.id) // Use hive_id instead of hiveNumber
                    .sort((a, b) => new Date(b.inspection_date) - new Date(a.inspection_date))[0];

                if (latestInspectionData) {
                    setLatestInspection(latestInspectionData);
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
                }
            } catch (err) {
                console.error('Error fetching previous actions:', err);
            }
        };

        if (selectedHive) {
            fetchPreviousActions();
        }
    }, [selectedHive]); // Depend only on selectedHive since apiary is implicit

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
            .map((a) => ({ text: a.text, completed_at: new Date().toISOString() })); // Add timestamp

        const followUpActions = [
            ...previousActions.filter((a) => !a.checked),
            ...formData.actions.filter((a) => a.text.trim()),
        ];

        const followUpActionsText = followUpActions.length > 0
            ? followUpActions.map((a, i) => `${i + 1}. ${a.text}`).join('\n')
            : null;

        const payload = {
            hive_id,
            date: formData.date,
            queenStatus: formData.queenStatus || null,
            broodPattern: formData.broodPattern || null,
            notes: formData.notes || null,
            followUpActions: followUpActionsText,
            completedActions: completedActions, // Send completed actions
        };

        console.log('📤 Sending payload:', JSON.stringify(payload, null, 2));

        try {
            const response = await axios.post('http://localhost:3001/hive_inspections', payload);
            console.log('✅ Inspection saved successfully:', response.data);
            alert('Inspection saved successfully!');

            setFormData({
                date: new Date().toISOString().split('T')[0],
                queenStatus: '',
                broodPattern: '',
                notes: '',
                actions: [],
            });

            if (onInspectionSaved) onInspectionSaved();
        } catch (err) {
            console.error('❌ Error saving inspection:', err.response ? err.response.data : err);
            alert('Failed to save inspection');
        }
    };

    console.log('Selected Hive in InspectionForm:', selectedHive);

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
                        <option value="">Select Queen Status</option>
                        <option value="Queen seen">Queen seen</option>
                        <option value="Brood but not queen seen">Brood but not queen seen</option>
                        <option value="Probably requeening">Probably requeening</option>
                        <option value="Probably queenless">Probably queenless</option>
                        <option value="Laying workers">Laying workers</option>
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
                        <option value="">Select Brood Pattern</option>
                        <option value="uniform">Uniform</option>
                        <option value="patchy">Patchy</option>
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
                        {previousActions.map((action, index) => (
                            <div key={action.id} className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={action.checked}
                                    onChange={(e) => {
                                        const updatedPreviousActions = [...previousActions];
                                        updatedPreviousActions[index].checked = e.target.checked;
                                        setPreviousActions(updatedPreviousActions);
                                    }}
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
                                    onChange={(e) => {
                                        const updatedActions = [...formData.actions];
                                        updatedActions[index].checked = e.target.checked;
                                        setFormData({ ...formData, actions: updatedActions });
                                    }}
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