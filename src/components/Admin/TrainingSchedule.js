import React, { useState, useEffect } from 'react';
import { X, Save, Users, Calendar, FileText, Target, AlertTriangle } from 'lucide-react';

const TrainingSchedule = ({ isOpen, onClose, mode, trainingData, onSave }) => {
  const [trainers, setTrainers] = useState([]);
  const [venues, setVenues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [trainingTypes, setTrainingTypes] = useState([]);
  const [ltContent, setLtContent] = useState([]); // L&T content (quizzes, videos, training items)
  const [conflictWarning, setConflictWarning] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    category: '',
    trainingType: 'classroom',
    description: '',
    objectives: '',
    learningOutcomes: '',
    duration: '',
    sessions: 1,
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '17:00',
    timeZone: 'UTC',
    graceTime: 15, // Grace time in minutes for check-in
    recurring: false,
    repeatPattern: 'none',
    trainerId: '',
    trainer: '',
    trainerType: 'internal',
    venueId: '',
    venue: '',
    venueType: 'training-room',
    capacity: 20,
    department: '',
    location: '',
    participants: [], // Optional - participants can be assigned later via Participant Enrollment
    ltContentIds: [] // IDs of linked L&T content (quizzes, videos, training items)
  });

  useEffect(() => {
    loadResources();
  }, []);

  useEffect(() => {
    if (mode === 'edit' && trainingData) {
      setFormData(trainingData);
    } else if (mode === 'create') {
      // Reset form to empty when creating new training
      setFormData({
        title: '',
        code: '',
        category: '',
        trainingType: 'classroom',
        description: '',
        objectives: '',
        learningOutcomes: '',
        duration: '',
        sessions: 1,
        startDate: '',
        endDate: '',
        startTime: '09:00',
        endTime: '17:00',
        timeZone: 'UTC',
        graceTime: 15,
        recurring: false,
        repeatPattern: 'none',
        trainerId: '',
        trainer: '',
        trainerType: 'internal',
        venueId: '',
        venue: '',
        venueType: 'training-room',
        capacity: 20,
        department: '',
        location: '',
        participants: [],
        ltContentIds: []
      });
    }
  }, [mode, trainingData]);

  const loadResources = () => {
    const storedTrainers = JSON.parse(localStorage.getItem('trainers') || '[]');
    const storedVenues = JSON.parse(localStorage.getItem('venues') || '[]');
    const storedCategories = JSON.parse(localStorage.getItem('trainingCategories') || '[]');
    const storedTrainingTypes = JSON.parse(localStorage.getItem('trainingTypes') || '[]');

    // Load L&T content with array guards
    const quizzesData = JSON.parse(localStorage.getItem('quizzes') || '[]');
    const videosData = JSON.parse(localStorage.getItem('videos') || '[]');
    const trainingItemsData = JSON.parse(localStorage.getItem('trainingItems') || '[]');

    const quizzes = Array.isArray(quizzesData) ? quizzesData : [];
    const videos = Array.isArray(videosData) ? videosData : [];
    const trainingItems = Array.isArray(trainingItemsData) ? trainingItemsData : [];

    // Combine all L&T content into a single array
    const allLtContent = [
      ...quizzes.map(q => ({ ...q, contentType: 'quiz' })),
      ...videos.map(v => ({ ...v, contentType: 'video' })),
      ...trainingItems.map(t => ({ ...t, contentType: 'training' }))
    ];
    
    setTrainers(storedTrainers);
    setVenues(storedVenues);
    setCategories(storedCategories);
    setTrainingTypes(storedTrainingTypes);
    setLtContent(allLtContent);
  };

  const addCategory = (category) => {
    const newCategory = { id: `cat-${Date.now()}`, name: category, createdAt: new Date().toISOString() };
    const updatedCategories = [...categories, newCategory];
    localStorage.setItem('trainingCategories', JSON.stringify(updatedCategories));
    setCategories(updatedCategories);
  };

  const addTrainingType = (type) => {
    const newType = { id: `type-${Date.now()}`, name: type, createdAt: new Date().toISOString() };
    const updatedTypes = [...trainingTypes, newType];
    localStorage.setItem('trainingTypes', JSON.stringify(updatedTypes));
    setTrainingTypes(updatedTypes);
  };

  const checkConflicts = (field, value) => {
    if (!formData.startDate || !formData.startTime || !formData.duration) return;
    
    const trainingSchedules = JSON.parse(localStorage.getItem('trainingSchedules') || '[]');
    // Ensure trainingSchedules is an array
    const trainingSchedulesArray = Array.isArray(trainingSchedules) ? trainingSchedules : [];
    let conflicts = [];

    if (field === 'trainerId' && value) {
      const trainerTrainings = trainingSchedulesArray.filter(t => 
        t.trainerId === value && 
        t.id !== trainingData?.id &&
        t.startDate === formData.startDate
      );
      if (trainerTrainings.length > 0) {
        conflicts.push('Trainer has another training scheduled on this date');
      }
    }

    if (field === 'venueId' && value) {
      const venueTrainings = trainingSchedulesArray.filter(t => 
        t.venueId === value && 
        t.id !== trainingData?.id &&
        t.startDate === formData.startDate
      );
      if (venueTrainings.length > 0) {
        conflicts.push('Venue is already booked on this date');
      }
    }

    setConflictWarning(conflicts.length > 0 ? conflicts.join('. ') : '');
  };

  const handleTrainerChange = (e) => {
    const trainerId = e.target.value;
    const selectedTrainer = trainers.find(t => t.id === trainerId);
    setFormData(prev => ({
      ...prev,
      trainerId,
      trainer: selectedTrainer?.name || '',
      trainerType: selectedTrainer?.type || 'internal'
    }));
    checkConflicts('trainerId', trainerId);
  };

  const handleVenueChange = (e) => {
    const venueId = e.target.value;
    const selectedVenue = venues.find(v => v.id === venueId);
    setFormData(prev => ({
      ...prev,
      venueId,
      venue: selectedVenue?.name || '',
      venueType: selectedVenue?.type || 'training-room',
      capacity: selectedVenue?.capacity || 20,
      location: selectedVenue?.location || ''
    }));
    checkConflicts('venueId', venueId);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Find category name and training type name
    const category = categories.find(c => c.id === formData.category);
    const trainingType = trainingTypes.find(t => t.id === formData.trainingType);
    
    const dataToSave = {
      ...formData,
      categoryName: category?.name || '',
      trainingTypeName: trainingType?.name || ''
    };
    
    onSave(dataToSave);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-lg">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'edit' ? 'Edit Training' : 'Create Training'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Training Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter training title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Training Code</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., TRN-001"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <button
                    type="button"
                    onClick={() => {
                      const newCategory = prompt('Enter new category name:');
                      if (newCategory && newCategory.trim()) {
                        addCategory(newCategory.trim());
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    + Add
                  </button>
                </div>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Training Type *</label>
                  <button
                    type="button"
                    onClick={() => {
                      const newType = prompt('Enter new training type:');
                      if (newType && newType.trim()) {
                        addTrainingType(newType.trim());
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    + Add
                  </button>
                </div>
                <select
                  name="trainingType"
                  value={formData.trainingType}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Type</option>
                  {trainingTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter training description"
              />
            </div>
          </div>

          {/* Objectives & Outcomes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Objectives & Outcomes
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Learning Objectives</label>
              <textarea
                name="objectives"
                value={formData.objectives}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter learning objectives"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Learning Outcomes</label>
              <textarea
                name="learningOutcomes"
                value={formData.learningOutcomes}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter expected learning outcomes"
              />
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Schedule Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (hours)</label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 8"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Sessions</label>
                <input
                  type="number"
                  name="sessions"
                  value={formData.sessions}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Zone</label>
                <select
                  name="timeZone"
                  value={formData.timeZone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="UTC">UTC</option>
                  <option value="IST">IST</option>
                  <option value="EST">EST</option>
                  <option value="PST">PST</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grace Time (minutes)</label>
                <input
                  type="number"
                  name="graceTime"
                  value={formData.graceTime}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Time allowed for check-in after training starts</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="recurring"
                id="recurring"
                checked={formData.recurring}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="recurring" className="text-sm font-medium text-gray-700">
                Recurring Training
              </label>
            </div>
            {formData.recurring && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Repeat Pattern</label>
                <select
                  name="repeatPattern"
                  value={formData.repeatPattern}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="none">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            )}
          </div>

          {/* Resource Allocation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Resource Allocation
            </h3>
            {conflictWarning && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="text-sm text-yellow-800">{conflictWarning}</span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trainer</label>
                <select
                  value={formData.trainerId}
                  onChange={handleTrainerChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a trainer</option>
                  {trainers.map(trainer => (
                    <option key={trainer.id} value={trainer.id}>
                      {trainer.name} ({trainer.type})
                    </option>
                  ))}
                </select>
                <input
                  type="hidden"
                  name="trainer"
                  value={formData.trainer}
                />
                <input
                  type="hidden"
                  name="trainerType"
                  value={formData.trainerType}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                <select
                  value={formData.venueId}
                  onChange={handleVenueChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a venue</option>
                  {venues.map(venue => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name} (Capacity: {venue.capacity})
                    </option>
                  ))}
                </select>
                <input
                  type="hidden"
                  name="venue"
                  value={formData.venue}
                />
                <input
                  type="hidden"
                  name="venueType"
                  value={formData.venueType}
                />
                <input
                  type="hidden"
                  name="location"
                  value={formData.location}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter department"
                />
              </div>
            </div>
          </div>

          {/* L&T Content Integration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              L&T Content Integration
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link L&T Content (Optional)</label>
              <p className="text-xs text-gray-500 mb-2">Select quizzes, videos, or training items to automatically assign to participants</p>
              <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                {ltContent.length === 0 ? (
                  <p className="text-sm text-gray-500">No L&T content available. Go to L&T Module to create content.</p>
                ) : (
                  ltContent.map(content => (
                    <label key={content.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.ltContentIds?.includes(content.id)}
                        onChange={(e) => {
                          const newIds = e.target.checked
                            ? [...(formData.ltContentIds || []), content.id]
                            : formData.ltContentIds?.filter(id => id !== content.id);
                          setFormData(prev => ({ ...prev, ltContentIds: newIds }));
                        }}
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm">
                        <span className="font-medium">{content.title}</span>
                        <span className="text-gray-500 ml-2">({content.contentType})</span>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Save className="w-4 h-4" />
              Save Training
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TrainingSchedule;
