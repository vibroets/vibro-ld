import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Calendar, Mail, Phone, CheckCircle, Clock } from 'lucide-react';
import Sidebar from '../Sidebar';

const TrainerManagement = () => {
  const [trainers, setTrainers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'internal', // internal, external, co-trainer, guest-speaker
    department: '',
    expertise: '',
    hourlyRate: 0,
    availability: [],
    bio: ''
  });
  const [availabilitySchedule, setAvailabilitySchedule] = useState({
    monday: { available: true, startTime: '09:00', endTime: '17:00' },
    tuesday: { available: true, startTime: '09:00', endTime: '17:00' },
    wednesday: { available: true, startTime: '09:00', endTime: '17:00' },
    thursday: { available: true, startTime: '09:00', endTime: '17:00' },
    friday: { available: true, startTime: '09:00', endTime: '17:00' },
    saturday: { available: false, startTime: '', endTime: '' },
    sunday: { available: false, startTime: '', endTime: '' }
  });

  useEffect(() => {
    loadTrainers();
  }, []);

  const loadTrainers = () => {
    const storedTrainers = JSON.parse(localStorage.getItem('trainers') || '[]');
    setTrainers(storedTrainers);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trainerData = {
      ...formData,
      id: editingTrainer ? editingTrainer.id : `trainer-${Date.now()}`,
      availability: availabilitySchedule,
      createdAt: editingTrainer ? editingTrainer.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let updatedTrainers;
    if (editingTrainer) {
      updatedTrainers = trainers.map(t => t.id === editingTrainer.id ? trainerData : t);
    } else {
      updatedTrainers = [...trainers, trainerData];
    }

    localStorage.setItem('trainers', JSON.stringify(updatedTrainers));
    setTrainers(updatedTrainers);
    handleCloseModal();
  };

  const handleDelete = (trainerId) => {
    if (window.confirm('Are you sure you want to delete this trainer?')) {
      const updatedTrainers = trainers.filter(t => t.id !== trainerId);
      localStorage.setItem('trainers', JSON.stringify(updatedTrainers));
      setTrainers(updatedTrainers);
    }
  };

  const handleEdit = (trainer) => {
    setEditingTrainer(trainer);
    setFormData({
      name: trainer.name,
      email: trainer.email,
      phone: trainer.phone,
      type: trainer.type,
      department: trainer.department,
      expertise: trainer.expertise,
      hourlyRate: trainer.hourlyRate,
      bio: trainer.bio
    });
    setAvailabilitySchedule(trainer.availability || availabilitySchedule);
    setShowModal(true);
  };

  const handleOpenModal = () => {
    setEditingTrainer(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      type: 'internal',
      department: '',
      expertise: '',
      hourlyRate: 0,
      bio: ''
    });
    setAvailabilitySchedule({
      monday: { available: true, startTime: '09:00', endTime: '17:00' },
      tuesday: { available: true, startTime: '09:00', endTime: '17:00' },
      wednesday: { available: true, startTime: '09:00', endTime: '17:00' },
      thursday: { available: true, startTime: '09:00', endTime: '17:00' },
      friday: { available: true, startTime: '09:00', endTime: '17:00' },
      saturday: { available: false, startTime: '', endTime: '' },
      sunday: { available: false, startTime: '', endTime: '' }
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTrainer(null);
  };

  const checkTrainerAvailability = (trainerId, startDate, startTime, duration) => { // eslint-disable-line no-unused-vars
    const trainingSchedules = JSON.parse(localStorage.getItem('trainingSchedules') || '[]');
    const trainerTrainings = trainingSchedules.filter(t => t.trainerId === trainerId);
    
    // Check for conflicts
    const hasConflict = trainerTrainings.some(training => {
      const trainingStart = new Date(`${training.startDate}T${training.startTime}`);
      const trainingEnd = new Date(trainingStart.getTime() + training.duration * 60 * 60 * 1000);
      const newStart = new Date(`${startDate}T${startTime}`);
      const newEnd = new Date(newStart.getTime() + duration * 60 * 60 * 1000);
      
      return (newStart < trainingEnd && newEnd > trainingStart);
    });

    return !hasConflict;
  };

  const getTrainerTypeColor = (type) => {
    const colors = {
      'internal': 'bg-blue-100 text-blue-800',
      'external': 'bg-green-100 text-green-800',
      'co-trainer': 'bg-purple-100 text-purple-800',
      'guest-speaker': 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-0 md:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">Trainer Management</h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenModal}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Trainer
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
                  <p className="text-sm text-gray-600">Total Trainers</p>
                  <p className="text-2xl font-bold text-gray-900">{trainers.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Internal</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {trainers.filter(t => t.type === 'internal').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">External</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {trainers.filter(t => t.type === 'external').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Guest Speakers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {trainers.filter(t => t.type === 'guest-speaker').length}
                  </p>
                </div>
                <Mail className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Trainers List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">All Trainers</h2>
            </div>
            {trainers.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {trainers.map((trainer) => (
                  <div key={trainer.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{trainer.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTrainerTypeColor(trainer.type)}`}>
                            {trainer.type.replace('-', ' ')}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span>{trainer.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span>{trainer.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{trainer.department}</span>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          <strong>Expertise:</strong> {trainer.expertise}
                        </div>
                        {trainer.hourlyRate > 0 && (
                          <div className="mt-1 text-sm text-gray-600">
                            <strong>Hourly Rate:</strong> ${trainer.hourlyRate}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(trainer)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(trainer.id)}
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
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No trainers added yet</p>
                <p className="text-sm mt-2">Click "Add Trainer" to create your first trainer</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add/Edit Trainer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full my-8">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-lg">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingTrainer ? 'Edit Trainer' : 'Add Trainer'}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter trainer name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter phone number"
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
                      <option value="internal">Internal Trainer</option>
                      <option value="external">External Trainer</option>
                      <option value="co-trainer">Co-Trainer</option>
                      <option value="guest-speaker">Guest Speaker</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter department"
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
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expertise</label>
                  <input
                    type="text"
                    value={formData.expertise}
                    onChange={(e) => setFormData({...formData, expertise: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Safety Training, Technical Skills, Leadership"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter trainer bio"
                  />
                </div>
              </div>

              {/* Availability Schedule */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Availability Schedule
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {days.map((day) => (
                    <div key={day} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={availabilitySchedule[day].available}
                          onChange={(e) => setAvailabilitySchedule({
                            ...availabilitySchedule,
                            [day]: { ...availabilitySchedule[day], available: e.target.checked }
                          })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="font-medium capitalize">{day}</span>
                      </label>
                      {availabilitySchedule[day].available && (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={availabilitySchedule[day].startTime}
                            onChange={(e) => setAvailabilitySchedule({
                              ...availabilitySchedule,
                              [day]: { ...availabilitySchedule[day], startTime: e.target.value }
                            })}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <span>-</span>
                          <input
                            type="time"
                            value={availabilitySchedule[day].endTime}
                            onChange={(e) => setAvailabilitySchedule({
                              ...availabilitySchedule,
                              [day]: { ...availabilitySchedule[day], endTime: e.target.value }
                            })}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      )}
                    </div>
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
                  {editingTrainer ? 'Update Trainer' : 'Add Trainer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerManagement;
