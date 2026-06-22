import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, UserCheck, CheckCircle, XCircle, Clock, AlertCircle, Database } from 'lucide-react';
import Sidebar from '../Sidebar';
import { seedTrainingData } from '../../utils/seedTrainingData';

const ParticipantEnrollment = () => {
  const [ltContent, setLtContent] = useState([]); // L&T content (quizzes, videos, training items)
  const [participants, setParticipants] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState('by-content'); // 'by-content', 'by-participant'
  const [selectedContent, setSelectedContent] = useState(null);
  const [formData, setFormData] = useState({
    contentId: '',
    contentType: '', // quiz, video, training
    participantIds: [],
    enrollmentType: 'self', // self, manager, bulk, department
    nominator: '',
    justification: '',
    status: 'pending', // pending, approved, rejected, enrolled, completed
    enrollmentDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Load L&T content from Quiz, Video, and Training libraries
    const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
    const videos = JSON.parse(localStorage.getItem('videos') || '[]');
    const trainingSchedules = JSON.parse(localStorage.getItem('trainingSchedules') || '[]');
    
    // Ensure all data are arrays
    const quizzesArray = Array.isArray(quizzes) ? quizzes : [];
    const videosArray = Array.isArray(videos) ? videos : [];
    const trainingSchedulesArray = Array.isArray(trainingSchedules) ? trainingSchedules : [];
    
    // Show all trainings regardless of status for now (for debugging)
    const allTrainings = trainingSchedulesArray;
    
    // Combine all L&T content into a single array with type labels
    const allLtContent = [
      ...quizzesArray.map(q => ({ ...q, contentType: 'quiz', libraryName: 'Quiz Library' })),
      ...videosArray.map(v => ({ ...v, contentType: 'video', libraryName: 'Video Library' })),
      ...allTrainings.map(t => ({ ...t, contentType: 'training', libraryName: 'Training Calendar' }))
    ];
    
    const storedParticipants = JSON.parse(localStorage.getItem('users') || '[]');
    const storedEnrollments = JSON.parse(localStorage.getItem('enrollments') || '[]');
    
    const participantsArray = Array.isArray(storedParticipants) ? storedParticipants : [];
    const enrollmentsArray = Array.isArray(storedEnrollments) ? storedEnrollments : [];
    
    setLtContent(allLtContent);
    setParticipants(participantsArray);
    setEnrollments(enrollmentsArray);
  };

  const handleSeedData = () => {
    if (window.confirm('This will add sample training calendar data. Continue?')) {
      const result = seedTrainingData();
      loadData();
      alert(`Sample data seeded successfully:\n${result.categories} categories\n${result.trainingTypes} training types\n${result.trainings} trainings\n${result.enrollments} enrollments\n${result.users} users`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check for duplicate enrollments
    const existingEnrollments = enrollments.filter(e => 
      e.contentId === formData.contentId && 
      formData.participantIds.includes(e.participantId)
    );
    
    if (existingEnrollments.length > 0) {
      const duplicateUsers = existingEnrollments.map(e => getParticipantName(e.participantId)).join(', ');
      alert(`The following users are already enrolled in this content: ${duplicateUsers}`);
      return;
    }
    
    const enrollmentData = {
      ...formData,
      id: `enrollment-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    // Create individual enrollment records for each participant
    const newEnrollments = formData.participantIds.map(participantId => ({
      ...enrollmentData,
      id: `enrollment-${Date.now()}-${participantId}`,
      participantId
    }));

    const updatedEnrollments = [...enrollments, ...newEnrollments];
    localStorage.setItem('enrollments', JSON.stringify(updatedEnrollments));
    setEnrollments(updatedEnrollments);
    
    // Auto-assign L&T content to enrolled participants (now using the selected content)
    const content = ltContent.find(c => c.id === formData.contentId);
    if (content) {
      const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
      const videos = JSON.parse(localStorage.getItem('videos') || '[]');
      const trainingItems = JSON.parse(localStorage.getItem('trainingItems') || '[]');
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      
      const newNotifications = [];
      
      formData.participantIds.forEach(participantId => {
        const participant = participants.find(p => p.id === participantId);
        const contentTitle = content.title;
        const contentType = content.contentType;
        
        if (contentType === 'quiz') {
          // Assign quiz to user
          const updatedQuiz = {
            ...content,
            selectedUsers: [...(content.selectedUsers || []), participantId]
          };
          const updatedQuizzes = quizzes.map(q => q.id === content.id ? updatedQuiz : q);
          localStorage.setItem('quizzes', JSON.stringify(updatedQuizzes));
          
          // Create notification
          newNotifications.push({
            id: `notif-${Date.now()}-${participantId}-${content.id}`,
            title: 'Quiz Assigned',
            message: `You have been assigned to the quiz: ${contentTitle}`,
            type: 'lt-content',
            trigger: 'immediate',
            channels: ['email'],
            recipientId: participantId,
            recipientEmail: participant?.email,
            contentId: content.id,
            contentType: contentType,
            status: 'sent',
            createdAt: new Date().toISOString()
          });
        }
        
        if (contentType === 'video') {
          // Assign video to user
          const updatedVideo = {
            ...content,
            selectedUsers: [...(content.selectedUsers || []), participantId]
          };
          const updatedVideos = videos.map(v => v.id === content.id ? updatedVideo : v);
          localStorage.setItem('videos', JSON.stringify(updatedVideos));
          
          // Create notification
          newNotifications.push({
            id: `notif-${Date.now()}-${participantId}-${content.id}`,
            title: 'Video Training Assigned',
            message: `You have been assigned to the video training: ${contentTitle}`,
            type: 'lt-content',
            trigger: 'immediate',
            channels: ['email'],
            recipientId: participantId,
            recipientEmail: participant?.email,
            contentId: content.id,
            contentType: contentType,
            status: 'sent',
            createdAt: new Date().toISOString()
          });
        }
        
        if (contentType === 'training') {
          // Assign training item to user
          const updatedTraining = {
            ...content,
            selectedUsers: [...(content.selectedUsers || []), participantId]
          };
          const updatedTrainingItems = trainingItems.map(t => t.id === content.id ? updatedTraining : t);
          localStorage.setItem('trainingItems', JSON.stringify(updatedTrainingItems));
          
          // Create notification
          newNotifications.push({
            id: `notif-${Date.now()}-${participantId}-${content.id}`,
            title: 'Training Material Assigned',
            message: `You have been assigned the training material: ${contentTitle}`,
            type: 'lt-content',
            trigger: 'immediate',
            channels: ['email'],
            recipientId: participantId,
            recipientEmail: participant?.email,
            contentId: content.id,
            contentType: contentType,
            status: 'sent',
            createdAt: new Date().toISOString()
          });
        }
      });
      
      // Save all notifications
      if (newNotifications.length > 0) {
        const updatedNotifications = [...notifications, ...newNotifications];
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      }
    }

    handleCloseModal();
  };

  const handleDelete = (enrollmentId) => {
    if (window.confirm('Are you sure you want to delete this enrollment?')) {
      const updatedEnrollments = enrollments.filter(e => e.id !== enrollmentId);
      localStorage.setItem('enrollments', JSON.stringify(updatedEnrollments));
      setEnrollments(updatedEnrollments);
    }
  };

  const handleApprove = (enrollmentId) => {
    const updatedEnrollments = enrollments.map(e => {
      if (e.id === enrollmentId) {
        return { ...e, status: 'approved', approvedAt: new Date().toISOString() };
      }
      return e;
    });
    localStorage.setItem('enrollments', JSON.stringify(updatedEnrollments));
    setEnrollments(updatedEnrollments);
  };

  const handleReject = (enrollmentId) => {
    if (window.confirm('Are you sure you want to reject this enrollment?')) {
      const updatedEnrollments = enrollments.map(e => {
        if (e.id === enrollmentId) {
          return { ...e, status: 'rejected', rejectedAt: new Date().toISOString() };
        }
        return e;
      });
      localStorage.setItem('enrollments', JSON.stringify(updatedEnrollments));
      setEnrollments(updatedEnrollments);
    }
  };

  const handleOpenModal = (contentId = null) => {
    setSelectedContent(contentId);
    const content = contentId ? ltContent.find(c => c.id === contentId) : null;
    setFormData({
      contentId: contentId || '',
      contentType: content?.contentType || '',
      participantIds: [],
      enrollmentType: 'self',
      nominator: '',
      justification: '',
      status: 'pending',
      enrollmentDate: new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedContent(null);
  };

  const toggleParticipant = (participantId) => {
    setFormData(prev => ({
      ...prev,
      participantIds: prev.participantIds.includes(participantId)
        ? prev.participantIds.filter(id => id !== participantId)
        : [...prev.participantIds, participantId]
    }));
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'enrolled': 'bg-blue-100 text-blue-800',
      'completed': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getParticipantName = (participantId) => {
    const participant = participants.find(p => p.id === participantId);
    return participant ? participant.name || participant.email : 'Unknown';
  };

  const getContentTitle = (contentId) => {
    const content = ltContent.find(c => c.id === contentId);
    return content ? `${content.libraryName} - ${content.title}` : 'Unknown Content';
  };

  const filteredParticipants = participants.filter(p => p.role === 'user');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-0 md:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">Participant Enrollment</h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSeedData}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  <Database className="w-4 h-4" />
                  Seed Data
                </button>
                <button
                  onClick={() => handleOpenModal()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  New Enrollment
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
                  <p className="text-sm text-gray-600">Total Enrollments</p>
                  <p className="text-2xl font-bold text-gray-900">{enrollments.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {enrollments.filter(e => e.status === 'pending').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {enrollments.filter(e => e.status === 'approved').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {enrollments.filter(e => e.status === 'rejected').length}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>

          {/* View Toggle */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setViewMode('by-content')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  viewMode === 'by-content' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                By Content
              </button>
              <button
                onClick={() => setViewMode('by-participant')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  viewMode === 'by-participant' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                By Participant
              </button>
            </div>
          </div>

          {/* Enrollments List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {viewMode === 'by-content' ? 'Enrollments by Content' : 'Enrollments by Participant'}
              </h2>
            </div>
            
            {viewMode === 'by-content' ? (
              // By Content View
              <div className="divide-y divide-gray-200">
                {ltContent.length > 0 ? (
                  ltContent.map((content) => {
                    const contentEnrollments = enrollments.filter(e => e.contentId === content.id);
                    if (contentEnrollments.length === 0) return null;
                    
                    return (
                      <div key={content.id} className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{content.title}</h3>
                            <p className="text-sm text-gray-600">
                              {content.libraryName} - {content.contentType}
                            </p>
                          </div>
                          <button
                            onClick={() => handleOpenModal(content.id)}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                          >
                            <Plus className="w-4 h-4" />
                            Add Participants
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {contentEnrollments.map((enrollment) => (
                            <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{getParticipantName(enrollment.participantId)}</p>
                                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(enrollment.status)}`}>
                                    {enrollment.status}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-3">
                                {enrollment.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => handleApprove(enrollment.id)}
                                      className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition"
                                    >
                                      <CheckCircle className="w-3 h-3" />
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleReject(enrollment.id)}
                                      className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition"
                                    >
                                      <XCircle className="w-3 h-3" />
                                      Reject
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleDelete(enrollment.id)}
                                  className="flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 transition"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-12 text-center text-gray-500">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>No training schedules found</p>
                  </div>
                )}
              </div>
            ) : (
              // By Participant View
              <div className="divide-y divide-gray-200">
                {filteredParticipants.length > 0 ? (
                  filteredParticipants.map((participant) => {
                    const participantEnrollments = enrollments.filter(e => e.participantId === participant.id);
                    if (participantEnrollments.length === 0) return null;
                    
                    return (
                      <div key={participant.id} className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <UserCheck className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{participant.name || participant.email}</h3>
                            <p className="text-sm text-gray-600">{participant.email}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {participantEnrollments.map((enrollment) => (
                            <div key={enrollment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{getContentTitle(enrollment.contentId)}</p>
                                <p className="text-sm text-gray-600">
                                  Enrolled: {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(enrollment.status)}`}>
                                  {enrollment.status}
                                </span>
                                {enrollment.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => handleApprove(enrollment.id)}
                                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleReject(enrollment.id)}
                                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleDelete(enrollment.id)}
                                  className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-12 text-center text-gray-500">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>No participants found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Enrollment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full my-8">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-lg">
              <h2 className="text-xl font-semibold text-gray-900">New Enrollment</h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
              {/* Content Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">L&T Content</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Content *</label>
                  <select
                    value={formData.contentId}
                    onChange={(e) => {
                      const selected = ltContent.find(c => c.id === e.target.value);
                      setFormData({...formData, contentId: e.target.value, contentType: selected?.contentType || ''});
                    }}
                    required
                    disabled={!!selectedContent}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select content</option>
                    {ltContent.map(content => (
                      <option key={content.id} value={content.id}>
                        {content.libraryName} - {content.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Participants Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Select Participants
                </h3>
                {formData.contentId && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">
                      Unlimited capacity for L&T content
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                  {filteredParticipants.map(participant => (
                    <label key={participant.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                      <input
                        type="checkbox"
                        checked={formData.participantIds.includes(participant.id)}
                        onChange={() => toggleParticipant(participant.id)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{participant.name || participant.email}</p>
                        <p className="text-sm text-gray-600">{participant.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Enrollment Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Enrollment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Type</label>
                    <select
                      value={formData.enrollmentType}
                      onChange={(e) => setFormData({...formData, enrollmentType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="self">Self Enrollment</option>
                      <option value="manager">Manager Nomination</option>
                      <option value="bulk">Bulk Enrollment</option>
                      <option value="department">Department-wise</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nominator</label>
                    <input
                      type="text"
                      value={formData.nominator}
                      onChange={(e) => setFormData({...formData, nominator: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter nominator name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Justification</label>
                  <textarea
                    value={formData.justification}
                    onChange={(e) => setFormData({...formData, justification: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter justification for enrollment"
                  />
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
                  disabled={formData.participantIds.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Enroll Participants ({formData.participantIds.length})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantEnrollment;
