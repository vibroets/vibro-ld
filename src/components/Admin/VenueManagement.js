import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit, Trash2, Building, Wifi, Monitor, Users } from 'lucide-react';
import Sidebar from '../Sidebar';

const VenueManagement = () => {
  const [venues, setVenues] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'training-room', // training-room, meeting-hall, conference-room, virtual
    location: '',
    building: '',
    floor: '',
    capacity: 20,
    equipment: [],
    amenities: [],
    hourlyRate: 0,
    available: true,
    description: ''
  });
  const equipmentList = [ // eslint-disable-line no-unused-vars
    'Projector', 'Laptop', 'Whiteboard', 'Internet', 'Lab Equipment', 'Safety Equipment',
    'Video Conferencing', 'Sound System', 'Microphone', 'Printer', 'TV Screen', 'AC'
  ];

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = () => {
    const storedVenues = JSON.parse(localStorage.getItem('venues') || '[]');
    setVenues(storedVenues);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const venueData = {
      ...formData,
      id: editingVenue ? editingVenue.id : `venue-${Date.now()}`,
      createdAt: editingVenue ? editingVenue.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let updatedVenues;
    if (editingVenue) {
      updatedVenues = venues.map(v => v.id === editingVenue.id ? venueData : v);
    } else {
      updatedVenues = [...venues, venueData];
    }

    localStorage.setItem('venues', JSON.stringify(updatedVenues));
    setVenues(updatedVenues);
    handleCloseModal();
  };

  const handleDelete = (venueId) => {
    if (window.confirm('Are you sure you want to delete this venue?')) {
      const updatedVenues = venues.filter(v => v.id !== venueId);
      localStorage.setItem('venues', JSON.stringify(updatedVenues));
      setVenues(updatedVenues);
    }
  };

  const handleEdit = (venue) => {
    setEditingVenue(venue);
    setFormData({
      name: venue.name,
      type: venue.type,
      location: venue.location,
      building: venue.building,
      floor: venue.floor,
      capacity: venue.capacity,
      equipment: venue.equipment || [],
      amenities: venue.amenities || [],
      hourlyRate: venue.hourlyRate,
      available: venue.available,
      description: venue.description
    });
    setShowModal(true);
  };

  const handleOpenModal = () => {
    setEditingVenue(null);
    setFormData({
      name: '',
      type: 'training-room',
      location: '',
      building: '',
      floor: '',
      capacity: 20,
      equipment: [],
      amenities: [],
      hourlyRate: 0,
      available: true,
      description: ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingVenue(null);
  };

  const checkVenueAvailability = (venueId, startDate, startTime, duration) => { // eslint-disable-line no-unused-vars
    const trainingSchedules = JSON.parse(localStorage.getItem('trainingSchedules') || '[]');
    const venueTrainings = trainingSchedules.filter(t => t.venueId === venueId);
    
    const hasConflict = venueTrainings.some(training => {
      const trainingStart = new Date(`${training.startDate}T${training.startTime}`);
      const trainingEnd = new Date(trainingStart.getTime() + training.duration * 60 * 60 * 1000);
      const newStart = new Date(`${startDate}T${startTime}`);
      const newEnd = new Date(newStart.getTime() + duration * 60 * 60 * 1000);
      
      return (newStart < trainingEnd && newEnd > trainingStart);
    });

    return !hasConflict;
  };

  const toggleEquipment = (equipment) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.includes(equipment)
        ? prev.equipment.filter(e => e !== equipment)
        : [...prev.equipment, equipment]
    }));
  };

  const getVenueTypeColor = (type) => {
    const colors = {
      'training-room': 'bg-blue-100 text-blue-800',
      'meeting-hall': 'bg-green-100 text-green-800',
      'conference-room': 'bg-purple-100 text-purple-800',
      'virtual': 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-0 md:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">Venue Management</h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenModal}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Venue
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Venues</p>
                  <p className="text-2xl font-bold text-gray-900">{venues.length}</p>
                </div>
                <Building className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Training Rooms</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {venues.filter(v => v.type === 'training-room').length}
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Conference Rooms</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {venues.filter(v => v.type === 'conference-room').length}
                  </p>
                </div>
                <Monitor className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Virtual</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {venues.filter(v => v.type === 'virtual').length}
                  </p>
                </div>
                <Wifi className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Venues List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">All Venues</h2>
            </div>
            {venues.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {venues.map((venue) => (
                  <div key={venue.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{venue.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVenueTypeColor(venue.type)}`}>
                            {venue.type.replace('-', ' ')}
                          </span>
                          {!venue.available && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Unavailable
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{venue.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            <span>{venue.building} {venue.floor && `- Floor ${venue.floor}`}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>Capacity: {venue.capacity}</span>
                          </div>
                        </div>
                        {venue.equipment && venue.equipment.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {venue.equipment.slice(0, 4).map((equip, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                                {equip}
                              </span>
                            ))}
                            {venue.equipment.length > 4 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                +{venue.equipment.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                        {venue.hourlyRate > 0 && (
                          <div className="text-sm text-gray-600">
                            <strong>Hourly Rate:</strong> ${venue.hourlyRate}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(venue)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(venue.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">
                <Building className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No venues added yet</p>
                <p className="text-sm mt-2">Click "Add Venue" to create your first venue</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add/Edit Venue Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full my-8">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-lg">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingVenue ? 'Edit Venue' : 'Add Venue'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter venue name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="training-room">Training Room</option>
                      <option value="meeting-hall">Meeting Hall</option>
                      <option value="conference-room">Conference Room</option>
                      <option value="virtual">Virtual Meeting</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter location"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Building</label>
                    <input
                      type="text"
                      value={formData.building}
                      onChange={(e) => setFormData({...formData, building: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter building name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                    <input
                      type="text"
                      value={formData.floor}
                      onChange={(e) => setFormData({...formData, floor: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter floor number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value) || 0})}
                      required
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter capacity"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate</label>
                    <input
                      type="number"
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData({...formData, hourlyRate: parseFloat(e.target.value) || 0})}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="available"
                      checked={formData.available}
                      onChange={(e) => setFormData({...formData, available: e.target.checked})}
                      className="w-4 h-4 text-blue-600"
                    />
                    <label htmlFor="available" className="text-sm font-medium text-gray-700">
                      Available for booking
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter venue description"
                  />
                </div>
              </div>

              {/* Equipment */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Equipment
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {equipmentList.map((equipment) => (
                    <label key={equipment} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                      <input
                        type="checkbox"
                        checked={formData.equipment.includes(equipment)}
                        onChange={() => toggleEquipment(equipment)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">{equipment}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {editingVenue ? 'Update Venue' : 'Add Venue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VenueManagement;
