import React, { useState, useEffect } from 'react';
import { Bell, Plus, Edit, Trash2, Mail, MessageSquare, Smartphone, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import Sidebar from '../Sidebar';

const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'training-created', // training-created, training-modified, training-cancelled, venue-changed, trainer-changed, reminder
    trigger: 'immediate', // immediate, 30-days, 15-days, 7-days, 1-day, 1-hour
    channels: ['email'], // email, sms, whatsapp, push, teams, slack
    template: '',
    enabled: true
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    const storedNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    setNotifications(storedNotifications);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const notificationData = {
      ...formData,
      id: editingNotification ? editingNotification.id : `notification-${Date.now()}`,
      createdAt: editingNotification ? editingNotification.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let updatedNotifications;
    if (editingNotification) {
      updatedNotifications = notifications.map(n => n.id === editingNotification.id ? notificationData : n);
    } else {
      updatedNotifications = [...notifications, notificationData];
    }

    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    setNotifications(updatedNotifications);
    handleCloseModal();
  };

  const handleDelete = (notificationId) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      const updatedNotifications = notifications.filter(n => n.id !== notificationId);
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      setNotifications(updatedNotifications);
    }
  };

  const handleEdit = (notification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      type: notification.type,
      trigger: notification.trigger,
      channels: notification.channels || ['email'],
      template: notification.template,
      enabled: notification.enabled
    });
    setShowModal(true);
  };

  const handleOpenModal = () => {
    setEditingNotification(null);
    setFormData({
      title: '',
      type: 'training-created',
      trigger: 'immediate',
      channels: ['email'],
      template: '',
      enabled: true
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingNotification(null);
  };

  const toggleChannel = (channel) => {
    setFormData(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
  };

  const toggleEnabled = (notificationId) => {
    const updatedNotifications = notifications.map(n => {
      if (n.id === notificationId) {
        return { ...n, enabled: !n.enabled };
      }
      return n;
    });
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    setNotifications(updatedNotifications);
  };

  const getTypeColor = (type) => {
    const colors = {
      'training-created': 'bg-blue-100 text-blue-800',
      'training-modified': 'bg-yellow-100 text-yellow-800',
      'training-cancelled': 'bg-red-100 text-red-800',
      'venue-changed': 'bg-purple-100 text-purple-800',
      'trainer-changed': 'bg-orange-100 text-orange-800',
      'reminder': 'bg-green-100 text-green-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getTriggerLabel = (trigger) => {
    const labels = {
      'immediate': 'Immediate',
      '30-days': '30 Days Before',
      '15-days': '15 Days Before',
      '7-days': '7 Days Before',
      '1-day': '1 Day Before',
      '1-hour': '1 Hour Before'
    };
    return labels[trigger] || trigger;
  };

  const getChannelIcon = (channel) => {
    const icons = {
      'email': Mail,
      'sms': MessageSquare,
      'whatsapp': MessageSquare,
      'push': Smartphone,
      'teams': MessageSquare,
      'slack': MessageSquare
    };
    return icons[channel] || Bell;
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
                <h1 className="text-2xl font-bold text-gray-900">Notification System</h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenModal}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  New Notification
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
                  <p className="text-sm text-gray-600">Total Notifications</p>
                  <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
                </div>
                <Bell className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Enabled</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {notifications.filter(n => n.enabled).length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Disabled</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {notifications.filter(n => !n.enabled).length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Reminders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {notifications.filter(n => n.type === 'reminder').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Notification Rules</h2>
            </div>
            
            {notifications.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div key={notification.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{notification.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                            {notification.type.replace('-', ' ')}
                          </span>
                          {!notification.enabled && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              Disabled
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Trigger: {getTriggerLabel(notification.trigger)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4" />
                            <span>Channels: {notification.channels?.join(', ') || 'None'}</span>
                          </div>
                        </div>

                        {notification.template && (
                          <div className="text-sm text-gray-600 mb-2">
                            <span className="font-medium text-gray-900">Template:</span> {notification.template}
                          </div>
                        )}

                        {/* Channel Icons */}
                        <div className="flex items-center gap-2">
                          {notification.channels?.map(channel => {
                            const Icon = getChannelIcon(channel);
                            return (
                              <div key={channel} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                                <Icon className="w-3 h-3" />
                                {channel}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => toggleEnabled(notification.id)}
                          className={`p-2 rounded-lg transition ${
                            notification.enabled ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'
                          }`}
                          title={notification.enabled ? 'Disable' : 'Enable'}
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(notification)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(notification.id)}
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
                <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No notification rules configured</p>
                <p className="text-sm mt-2">Click "New Notification" to create your first notification rule</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add/Edit Notification Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-lg">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingNotification ? 'Edit Notification' : 'New Notification'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Notification Details</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter notification title"
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
                      <option value="training-created">Training Created</option>
                      <option value="training-modified">Training Modified</option>
                      <option value="training-cancelled">Training Cancelled</option>
                      <option value="venue-changed">Venue Changed</option>
                      <option value="trainer-changed">Trainer Changed</option>
                      <option value="reminder">Reminder</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trigger *</label>
                    <select
                      value={formData.trigger}
                      onChange={(e) => setFormData({...formData, trigger: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="immediate">Immediate</option>
                      <option value="30-days">30 Days Before</option>
                      <option value="15-days">15 Days Before</option>
                      <option value="7-days">7 Days Before</option>
                      <option value="1-day">1 Day Before</option>
                      <option value="1-hour">1 Hour Before</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Channels */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Channels
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['email', 'sms', 'whatsapp', 'push', 'teams', 'slack'].map(channel => {
                    const Icon = getChannelIcon(channel);
                    return (
                      <label key={channel} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                        <input
                          type="checkbox"
                          checked={formData.channels.includes(channel)}
                          onChange={() => toggleChannel(channel)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <Icon className="w-4 h-4 text-gray-600" />
                        <span className="text-sm">{channel}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Template */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Message Template</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                  <textarea
                    value={formData.template}
                    onChange={(e) => setFormData({...formData, template: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter message template. Use {training_title}, {date}, {time} as placeholders"
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
                  {editingNotification ? 'Update Notification' : 'Create Notification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;
