import React, { useState, useEffect } from 'react';
import { FileText, Plus, Edit, Trash2, CheckCircle, AlertCircle, Award, Target } from 'lucide-react';
import Sidebar from '../Sidebar';

const AssessmentManagement = () => {
  const [assessments, setAssessments] = useState([]);
  const [ltContent, setLtContent] = useState([]); // L&T content (quizzes, videos, training items)
  const [showModal, setShowModal] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pre-assessment, post-assessment
  const [formData, setFormData] = useState({
    title: '',
    type: 'pre-assessment', // pre-assessment, post-assessment
    contentId: '',
    contentType: '', // quiz, video, training
    questions: [],
    passingScore: 70,
    duration: 30,
    instructions: '',
    enabled: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const storedAssessmentsRaw = JSON.parse(localStorage.getItem('assessments') || '[]');
    const storedAssessments = Array.isArray(storedAssessmentsRaw) ? storedAssessmentsRaw : [];

    // Load L&T content from Quiz, Video, and Training libraries with array guards
    const quizzesRaw = JSON.parse(localStorage.getItem('quizzes') || '[]');
    const videosRaw = JSON.parse(localStorage.getItem('videos') || '[]');
    const trainingItemsRaw = JSON.parse(localStorage.getItem('trainingItems') || '[]');

    const quizzes = Array.isArray(quizzesRaw) ? quizzesRaw : [];
    const videos = Array.isArray(videosRaw) ? videosRaw : [];
    const trainingItems = Array.isArray(trainingItemsRaw) ? trainingItemsRaw : [];

    // Combine all L&T content into a single array with type labels
    const allLtContent = [
      ...quizzes.map(q => ({ ...q, contentType: 'quiz', libraryName: 'Quiz Library' })),
      ...videos.map(v => ({ ...v, contentType: 'video', libraryName: 'Video Library' })),
      ...trainingItems.map(t => ({ ...t, contentType: 'training', libraryName: 'Training Library' }))
    ];
    
    setAssessments(storedAssessments);
    setLtContent(allLtContent);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const assessmentData = {
      ...formData,
      id: editingAssessment ? editingAssessment.id : `assessment-${Date.now()}`,
      createdAt: editingAssessment ? editingAssessment.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let updatedAssessments;
    if (editingAssessment) {
      updatedAssessments = assessments.map(a => a.id === editingAssessment.id ? assessmentData : a);
    } else {
      updatedAssessments = [...assessments, assessmentData];
    }

    localStorage.setItem('assessments', JSON.stringify(updatedAssessments));
    setAssessments(updatedAssessments);
    handleCloseModal();
  };

  const handleDelete = (assessmentId) => {
    if (window.confirm('Are you sure you want to delete this assessment?')) {
      const updatedAssessments = assessments.filter(a => a.id !== assessmentId);
      localStorage.setItem('assessments', JSON.stringify(updatedAssessments));
      setAssessments(updatedAssessments);
    }
  };

  const handleEdit = (assessment) => {
    setEditingAssessment(assessment);
    setFormData({
      title: assessment.title,
      type: assessment.type,
      contentId: assessment.contentId,
      contentType: assessment.contentType,
      questions: assessment.questions || [],
      passingScore: assessment.passingScore,
      duration: assessment.duration,
      instructions: assessment.instructions,
      enabled: assessment.enabled
    });
    setShowModal(true);
  };

  const handleOpenModal = () => {
    setEditingAssessment(null);
    setFormData({
      title: '',
      type: 'pre-assessment',
      contentId: '',
      contentType: '',
      questions: [],
      passingScore: 70,
      duration: 30,
      instructions: '',
      enabled: true
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAssessment(null);
  };

  const toggleEnabled = (assessmentId) => {
    const updatedAssessments = assessments.map(a => {
      if (a.id === assessmentId) {
        return { ...a, enabled: !a.enabled };
      }
      return a;
    });
    localStorage.setItem('assessments', JSON.stringify(updatedAssessments));
    setAssessments(updatedAssessments);
  };

  const getTypeColor = (type) => {
    const colors = {
      'pre-assessment': 'bg-blue-100 text-blue-800',
      'post-assessment': 'bg-green-100 text-green-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getContentTitle = (contentId) => {
    const content = ltContent.find(c => c.id === contentId);
    return content ? `${content.libraryName} - ${content.title}` : 'Not assigned';
  };

  const filteredAssessments = assessments.filter(assessment => {
    if (filter !== 'all' && assessment.type !== filter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-0 md:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">Assessment Management</h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenModal}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  New Assessment
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
                  <p className="text-sm text-gray-600">Total Assessments</p>
                  <p className="text-2xl font-bold text-gray-900">{assessments.length}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pre-Assessments</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {assessments.filter(a => a.type === 'pre-assessment').length}
                  </p>
                </div>
                <Target className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Post-Assessments</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {assessments.filter(a => a.type === 'post-assessment').length}
                  </p>
                </div>
                <Award className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Enabled</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {assessments.filter(a => a.enabled).length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Type:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="pre-assessment">Pre-Assessment</option>
                <option value="post-assessment">Post-Assessment</option>
              </select>
            </div>
          </div>

          {/* Assessments List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Assessments</h2>
            </div>
            
            {filteredAssessments.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredAssessments.map((assessment) => (
                  <div key={assessment.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{assessment.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(assessment.type)}`}>
                            {assessment.type.replace('-', ' ')}
                          </span>
                          {!assessment.enabled && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              Disabled
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                          <div>
                            <p className="font-medium text-gray-900">L&T Content</p>
                            <p>{getContentTitle(assessment.contentId)}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Duration</p>
                            <p>{assessment.duration} minutes</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Passing Score</p>
                            <p>{assessment.passingScore}%</p>
                          </div>
                        </div>

                        <div className="text-sm text-gray-600">
                          <span className="font-medium text-gray-900">Questions: </span>
                          {assessment.questions?.length || 0}
                        </div>

                        {assessment.instructions && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium text-gray-900">Instructions: </span>
                            {assessment.instructions}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => toggleEnabled(assessment.id)}
                          className={`p-2 rounded-lg transition ${
                            assessment.enabled ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'
                          }`}
                          title={assessment.enabled ? 'Disable' : 'Enable'}
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(assessment)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(assessment.id)}
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
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No assessments configured</p>
                <p className="text-sm mt-2">Click "New Assessment" to create your first assessment</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add/Edit Assessment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-lg">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingAssessment ? 'Edit Assessment' : 'New Assessment'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Assessment Details</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter assessment title"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pre-assessment">Pre-Assessment</option>
                      <option value="post-assessment">Post-Assessment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">L&T Content</label>
                    <select
                      value={formData.contentId}
                      onChange={(e) => {
                        const selected = ltContent.find(c => c.id === e.target.value);
                        setFormData({...formData, contentId: e.target.value, contentType: selected?.contentType || ''});
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Content (Optional)</option>
                      {ltContent.map(content => (
                        <option key={content.id} value={content.id}>
                          {content.libraryName} - {content.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes) *</label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 30})}
                      required
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Passing Score (%) *</label>
                    <input
                      type="number"
                      value={formData.passingScore}
                      onChange={(e) => setFormData({...formData, passingScore: parseInt(e.target.value) || 70})}
                      required
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="70"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                  <textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter assessment instructions"
                  />
                </div>
              </div>

              {/* Enabled */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({...formData, enabled: e.target.checked})}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
                  Enabled
                </label>
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
                  {editingAssessment ? 'Update Assessment' : 'Create Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentManagement;
