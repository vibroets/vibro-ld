import React, { useState, useEffect } from 'react';
import { Calendar, Link as LinkIcon, Plus, Trash2, CheckCircle, XCircle, Settings, RefreshCw, Database } from 'lucide-react';
import Sidebar from '../Sidebar';
import { seedTrainingData } from '../../utils/seedTrainingData';

const CalendarIntegrations = () => {
  const [integrations, setIntegrations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'google', // google, outlook, teams, zoom
    apiKey: '',
    calendarId: '',
    enabled: true,
    autoSync: true,
    syncInterval: 15 // minutes
  });

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = () => {
    const storedIntegrations = JSON.parse(localStorage.getItem('calendarIntegrations') || '[]');
    setIntegrations(storedIntegrations);
  };

  const handleSeedData = () => {
    if (window.confirm('This will add sample training calendar data. Continue?')) {
      const result = seedTrainingData();
      loadIntegrations();
      alert(`Sample data seeded successfully:\n${result.categories} categories\n${result.trainingTypes} training types\n${result.trainings} trainings\n${result.users} users`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const integrationData = {
      ...formData,
      id: editingIntegration ? editingIntegration.id : `integration-${Date.now()}`,
      lastSync: null,
      createdAt: editingIntegration ? editingIntegration.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let updatedIntegrations;
    if (editingIntegration) {
      updatedIntegrations = integrations.map(i => i.id === editingIntegration.id ? integrationData : i);
    } else {
      updatedIntegrations = [...integrations, integrationData];
    }

    localStorage.setItem('calendarIntegrations', JSON.stringify(updatedIntegrations));
    setIntegrations(updatedIntegrations);
    handleCloseModal();
  };

  const handleDelete = (integrationId) => {
    if (window.confirm('Are you sure you want to delete this integration?')) {
      const updatedIntegrations = integrations.filter(i => i.id !== integrationId);
      localStorage.setItem('calendarIntegrations', JSON.stringify(updatedIntegrations));
      setIntegrations(updatedIntegrations);
    }
  };

  const handleEdit = (integration) => {
    setEditingIntegration(integration);
    setFormData({
      name: integration.name,
      type: integration.type,
      apiKey: integration.apiKey,
      calendarId: integration.calendarId,
      enabled: integration.enabled,
      autoSync: integration.autoSync,
      syncInterval: integration.syncInterval
    });
    setShowModal(true);
  };

  const handleOpenModal = () => {
    setEditingIntegration(null);
    setFormData({
      name: '',
      type: 'google',
      apiKey: '',
      calendarId: '',
      enabled: true,
      autoSync: true,
      syncInterval: 15
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingIntegration(null);
  };

  const toggleEnabled = (integrationId) => {
    const updatedIntegrations = integrations.map(i => {
      if (i.id === integrationId) {
        return { ...i, enabled: !i.enabled };
      }
      return i;
    });
    localStorage.setItem('calendarIntegrations', JSON.stringify(updatedIntegrations));
    setIntegrations(updatedIntegrations);
  };

  const handleSync = (integrationId) => {
    const updatedIntegrations = integrations.map(i => {
      if (i.id === integrationId) {
        return { ...i, lastSync: new Date().toISOString() };
      }
      return i;
    });
    localStorage.setItem('calendarIntegrations', JSON.stringify(updatedIntegrations));
    setIntegrations(updatedIntegrations);
  };

  const getTypeColor = (type) => {
    const colors = {
      'google': 'bg-blue-100 text-blue-800',
      'outlook': 'bg-purple-100 text-purple-800',
      'teams': 'bg-indigo-100 text-indigo-800',
      'zoom': 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type) => {
    const icons = {
      'google': Calendar,
      'outlook': Calendar,
      'teams': LinkIcon,
      'zoom': LinkIcon
    };
    return icons[type] || Calendar;
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
                <h1 className="text-2xl font-bold text-gray-900">Calendar Integrations</h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenModal}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Integration
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
                  <p className="text-sm text-gray-600">Total Integrations</p>
                  <p className="text-2xl font-bold text-gray-900">{integrations.length}</p>
                </div>
                <LinkIcon className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {integrations.filter(i => i.enabled).length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Auto Sync</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {integrations.filter(i => i.autoSync).length}
                  </p>
                </div>
                <RefreshCw className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Last Sync</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {integrations.filter(i => i.lastSync).length}
                  </p>
                </div>
                <Settings className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Integrations List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Connected Calendars</h2>
            </div>
            
            {integrations.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {integrations.map((integration) => {
                  const Icon = getTypeIcon(integration.type);
                  return (
                    <div key={integration.id} className="p-6 hover:bg-gray-50 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Icon className="w-5 h-5 text-gray-600" />
                            <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(integration.type)}`}>
                              {integration.type}
                            </span>
                            {!integration.enabled && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                Disabled
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                            <div>
                              <p className="font-medium text-gray-900">Calendar ID</p>
                              <p className="font-mono">{integration.calendarId || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Sync Interval</p>
                              <p>Every {integration.syncInterval} minutes</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Last Sync</p>
                              <p>{integration.lastSync ? new Date(integration.lastSync).toLocaleString() : 'Never'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Auto Sync:</span>
                              {integration.autoSync ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-600" />
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleSync(integration.id)}
                            className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                            title="Sync Now"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Sync
                          </button>
                          <button
                            onClick={() => toggleEnabled(integration.id)}
                            className={`p-2 rounded-lg transition ${
                              integration.enabled ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'
                            }`}
                            title={integration.enabled ? 'Disable' : 'Enable'}
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleEdit(integration)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Settings className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(integration.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">
                <LinkIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No calendar integrations configured</p>
                <p className="text-sm mt-2">Click "Add Integration" to connect your calendar</p>
              </div>
            )}
          </div>

          {/* Supported Integrations Info */}
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Supported Integrations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: 'Google Calendar', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
                { name: 'Microsoft Outlook', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
                { name: 'Microsoft Teams', icon: LinkIcon, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { name: 'Zoom', icon: LinkIcon, color: 'text-red-600', bg: 'bg-red-50' }
              ].map((item) => (
                <div key={item.name} className={`p-4 rounded-lg ${item.bg}`}>
                  <item.icon className={`w-8 h-8 ${item.color} mb-2`} />
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">Two-way sync supported</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Add/Edit Integration Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-lg">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingIntegration ? 'Edit Integration' : 'New Integration'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Integration Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Work Calendar"
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
                    <option value="google">Google Calendar</option>
                    <option value="outlook">Microsoft Outlook</option>
                    <option value="teams">Microsoft Teams</option>
                    <option value="zoom">Zoom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <input
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter API key"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Calendar ID</label>
                  <input
                    type="text"
                    value={formData.calendarId}
                    onChange={(e) => setFormData({...formData, calendarId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter calendar ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sync Interval (minutes)</label>
                  <input
                    type="number"
                    value={formData.syncInterval}
                    onChange={(e) => setFormData({...formData, syncInterval: parseInt(e.target.value) || 15})}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-4">
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
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="autoSync"
                      checked={formData.autoSync}
                      onChange={(e) => setFormData({...formData, autoSync: e.target.checked})}
                      className="w-4 h-4 text-blue-600"
                    />
                    <label htmlFor="autoSync" className="text-sm font-medium text-gray-700">
                      Auto Sync
                    </label>
                  </div>
                </div>
              </div>

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
                  {editingIntegration ? 'Update Integration' : 'Add Integration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarIntegrations;
