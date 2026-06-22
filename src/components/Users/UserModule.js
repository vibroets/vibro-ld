import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Edit2, Trash2, ArrowLeft, Mail, Phone, Upload, Download, FileSpreadsheet, Search, Shield, ShieldOff, XCircle } from 'lucide-react';
import Sidebar from '../Sidebar';

const UserModule = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    employeeId: '',
    designation: '', // designation: manager, hr, management, employee
    isAdmin: false,
    isSuperAdmin: false,
    moduleAccess: {
      userModule: true,
      trainingSchedule: true,
      trainingCalendar: true,
      participantEnrollment: true,
      assessmentManagement: true,
      attendanceManagement: true,
      venueManagement: true,
      trainerManagement: true,
      approvalWorkflow: true,
      ltModule: true,
      trainingAnalytics: true,
      reports: true
    }
  });
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [showDesignationModal, setShowDesignationModal] = useState(false);
  const [designationForm, setDesignationForm] = useState({ name: '', editingIndex: -1 });
  const [selectedDesignations, setSelectedDesignations] = useState([]);
  const [designationModalMode, setDesignationModalMode] = useState('manage'); // 'manage' or 'create' or 'edit'
  const [currentAdmin, setCurrentAdmin] = useState(null);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (!isAuthenticated) {
      navigate('/login');
    }
    loadUsers();
    loadCurrentAdmin();
  }, [navigate]);

  const loadCurrentAdmin = () => {
    const admin = JSON.parse(localStorage.getItem('currentAdmin') || 'null');
    setCurrentAdmin(admin);
  };

  const loadUsers = () => {
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    setUsers(storedUsers);
    setFilteredUsers(storedUsers);
  };

  const loadDesignations = () => {
    const storedDesignations = JSON.parse(localStorage.getItem('designations') || '[]');
    if (storedDesignations.length === 0) {
      // Initialize with default designations if none exist
      const defaultDesignations = ['manager', 'hr', 'management', 'employee'];
      localStorage.setItem('designations', JSON.stringify(defaultDesignations));
      setDesignations(defaultDesignations);
    } else {
      setDesignations(storedDesignations);
    }
  };

  useEffect(() => {
    loadDesignations();
  }, []);

  useEffect(() => {
    // Filter users based on search query
    const filtered = users.filter(user => {
      const query = searchQuery.toLowerCase();
      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.phone && user.phone.toLowerCase().includes(query)) ||
        (user.department && user.department.toLowerCase().includes(query)) ||
        (user.employeeId && user.employeeId.toLowerCase().includes(query))
      );
    });
    setFilteredUsers(filtered);
  }, [users, searchQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingUser) {
      // Update existing user
      const updatedUsers = users.map(user => 
        user.id === editingUser.id 
          ? { ...user, ...formData, updatedAt: new Date().toISOString() }
          : user
      );
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
    } else {
      // Add new user
      const newUser = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const updatedUsers = [...users, newUser];
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      department: '',
      employeeId: '',
      designation: '',
      isAdmin: false,
      isSuperAdmin: false,
      moduleAccess: {
        userModule: true,
        trainingSchedule: true,
        trainingCalendar: true,
        participantEnrollment: true,
        assessmentManagement: true,
        attendanceManagement: true,
        venueManagement: true,
        trainerManagement: true,
        approvalWorkflow: true,
        ltModule: true,
        trainingAnalytics: true,
        reports: true
      }
    });
    setShowForm(false);
    setEditingUser(null);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      department: user.department,
      employeeId: user.employeeId,
      designation: user.designation || '',
      isAdmin: user.isAdmin || false,
      isSuperAdmin: user.isSuperAdmin || false,
      moduleAccess: user.moduleAccess || {
        userModule: true,
        trainingSchedule: true,
        trainingCalendar: true,
        participantEnrollment: true,
        assessmentManagement: true,
        attendanceManagement: true,
        venueManagement: true,
        trainerManagement: true,
        approvalWorkflow: true,
        ltModule: true,
        trainingAnalytics: true,
        reports: true
      }
    });
    setShowForm(true);
  };

  const deleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const updatedUsers = users.filter(user => user.id !== userId);
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
    }
  };

  const toggleAdminStatus = (userId) => {
    const currentAdmin = JSON.parse(localStorage.getItem('currentAdmin') || 'null');
    if (!currentAdmin || !currentAdmin.isSuperAdmin) {
      alert('Only Super Admin can promote or remove admin privileges.');
      return;
    }

    const user = users.find(u => u.id === userId);
    if (!user) return;

    const confirmMessage = user.isAdmin 
      ? 'Remove admin privileges from this user?' 
      : 'Promote this user to admin with full system access?';
    
    if (window.confirm(confirmMessage)) {
      const updatedUsers = users.map(u => 
        u.id === userId 
          ? { ...u, isAdmin: !u.isAdmin, updatedAt: new Date().toISOString() }
          : u
      );
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
    }
  };

  const downloadTemplate = () => {
    // Create CSV template for user data
    const template = [
      ['Name', 'Email', 'Phone', 'Department', 'Employee ID'],
      ['John Doe', 'john.doe@example.com', '123-456-7890', 'IT', 'EMP001'],
      ['Jane Smith', 'jane.smith@example.com', '098-765-4321', 'HR', 'EMP002']
    ];

    const csvContent = template.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleBulkUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n');
        const newUsers = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          if (values.length >= 5 && values[0].trim()) {
            const newUser = {
              id: Date.now().toString() + i,
              name: values[0].trim(),
              email: values[1].trim(),
              phone: values[2].trim(),
              department: values[3].trim(),
              employeeId: values[4].trim(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            newUsers.push(newUser);
          }
        }

        const updatedUsers = [...users, ...newUsers];
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        setUsers(updatedUsers);
        setShowBulkUpload(false);
        setUploadedFile(null);
        alert(`Successfully imported ${newUsers.length} users!`);
      } catch (error) {
        alert('Error parsing CSV file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      <Sidebar currentUser={currentUser} />
      
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="mr-4 p-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200 group"
                  title="Back to Dashboard"
                >
                  <ArrowLeft className="w-5 h-5 group-hover:transform group-hover:-translate-x-1 transition-transform duration-200" />
                </button>
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors duration-200">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
                    <p className="text-sm text-slate-500">Manage system users and permissions</p>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </button>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                  title="Download Template"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Template
                </button>
                <button
                  onClick={() => setShowBulkUpload(true)}
                  className="flex items-center px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                  title="Bulk Upload"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Upload
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-8">
        {/* Bulk Upload Form */}
        {showBulkUpload && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mb-8">
            <div className="flex items-center mb-8">
              <div className="p-3 bg-purple-50 rounded-xl mr-4">
                <Upload className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Bulk Upload Users</h2>
                <p className="text-sm text-slate-500 mt-1">Import multiple users from a CSV file</p>
              </div>
            </div>
            <div className="space-y-8">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-emerald-100 rounded-lg mt-1">
                    <Download className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-2">Step 1: Download Template</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Download the CSV template and fill it with user information
                    </p>
                    <button
                      onClick={downloadTemplate}
                      className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download CSV Template
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-blue-100 rounded-lg mt-1">
                    <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-2">Step 2: Upload CSV File</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Select the filled CSV template to upload user data
                    </p>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleBulkUpload}
                        className="w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {uploadedFile && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg mr-3">
                      <FileSpreadsheet className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-900">File Selected</p>
                      <p className="text-sm text-green-700">{uploadedFile.name}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkUpload(false);
                    setUploadedFile(null);
                  }}
                  className="px-6 py-2.5 bg-slate-600 text-white rounded-xl hover:bg-slate-700 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {/* User Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mb-8">
            <div className="flex items-center mb-8">
              <div className="p-3 bg-blue-50 rounded-xl mr-4">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {editingUser ? 'Update user information and permissions' : 'Create a new user account'}
                </p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="e.g., IT, HR, Finance"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Designation
                </label>
                <div className="flex gap-2">
                  <select
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Select Designation</option>
                    {designations.map(d => (
                      <option key={d} value={d}>
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setDesignationForm({ name: '', editingIndex: -1 });
                      setDesignationModalMode('manage');
                      setSelectedDesignations([]);
                      setShowDesignationModal(true);
                    }}
                    className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Employee ID
                </label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="e.g., EMP001"
                />
              </div>

              <div className="flex items-end space-x-3 md:col-span-2">
                <div className="flex items-center space-x-3 flex-1">
                  <input
                    type="checkbox"
                    id="isAdmin"
                    name="isAdmin"
                    checked={formData.isAdmin}
                    onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                    className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="isAdmin" className="text-sm font-medium text-slate-700 cursor-pointer">
                    Promote as Admin - Full system access with ability to manage users and content
                  </label>
                </div>
              </div>

              {formData.isAdmin && currentAdmin?.isSuperAdmin && (
                <>
                  <div className="flex items-end space-x-3 md:col-span-2">
                    <div className="flex items-center space-x-3 flex-1">
                      <input
                        type="checkbox"
                        id="isSuperAdmin"
                        name="isSuperAdmin"
                        checked={formData.isSuperAdmin}
                        onChange={(e) => setFormData({ ...formData, isSuperAdmin: e.target.checked })}
                        className="w-5 h-5 text-red-600 border-slate-300 rounded focus:ring-2 focus:ring-red-500 cursor-pointer"
                      />
                      <label htmlFor="isSuperAdmin" className="text-sm font-medium text-red-700 cursor-pointer">
                        Super Admin - Can manage other admins and control module access
                      </label>
                    </div>
                  </div>

                  {!formData.isSuperAdmin && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Module Access
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.keys(formData.moduleAccess).map(module => (
                          <div key={module} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`module-${module}`}
                              checked={formData.moduleAccess[module]}
                              onChange={(e) => setFormData({
                                ...formData,
                                moduleAccess: {
                                  ...formData.moduleAccess,
                                  [module]: e.target.checked
                                }
                              })}
                              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            />
                            <label htmlFor={`module-${module}`} className="text-xs text-slate-600 cursor-pointer">
                              {module.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex items-end space-x-3 md:col-span-2">
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  {editingUser ? 'Update User' : 'Add User'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-slate-600 text-white rounded-xl hover:bg-slate-700 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users List */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200">
          <div className="px-8 py-6 border-b border-slate-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Registered Users ({filteredUsers.length})
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Manage and search user accounts</p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-96 bg-slate-50 transition-all duration-200"
                />
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              </div>
            </div>
          </div>
          
          {filteredUsers.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 bg-slate-100 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Search className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {searchQuery ? 'No Users Found' : 'No Users Registered'}
              </h3>
              <p className="text-slate-600 mb-4">
                {searchQuery ? 'Try adjusting your search terms or filters' : 'Get started by adding your first user account'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Add Your First User
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Designation
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Employee ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Admin Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                              <span className="text-white font-bold text-lg">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-slate-900">{user.name}</div>
                            <div className="text-xs text-slate-500">
                              Joined {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center text-sm text-slate-900">
                            <Mail className="w-4 h-4 mr-2 text-slate-400" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center text-sm text-slate-600">
                              <Phone className="w-4 h-4 mr-2 text-slate-400" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
                          {user.department || 'Not Assigned'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          user.designation === 'manager' ? 'bg-blue-100 text-blue-700' :
                          user.designation === 'hr' ? 'bg-green-100 text-green-700' :
                          user.designation === 'management' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {user.designation ? user.designation.charAt(0).toUpperCase() + user.designation.slice(1) : 'Not Assigned'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                          {user.employeeId || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.isAdmin ? (
                          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700 flex items-center fit-content w-fit">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </span>
                        ) : (
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                            User
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => toggleAdminStatus(user.id)}
                            className={`p-2 rounded-lg transition-all duration-200 group ${
                              user.isAdmin
                                ? 'text-purple-600 hover:bg-purple-50'
                                : 'text-slate-400 hover:bg-slate-100'
                            }`}
                            title={user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                          >
                            {user.isAdmin ? (
                              <ShieldOff className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                            ) : (
                              <Shield className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                            )}
                          </button>
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                            title="Edit User"
                          >
                            <Edit2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                          </button>
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Designation Management Modal */}
      {showDesignationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {designationModalMode === 'manage' ? 'Manage Designations' : 
                 designationModalMode === 'create' ? 'Create Designation' : 'Edit Designation'}
              </h2>
              <button
                onClick={() => {
                  setShowDesignationModal(false);
                  setDesignationForm({ name: '', editingIndex: -1 });
                  setSelectedDesignations([]);
                  setDesignationModalMode('manage');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            {designationModalMode === 'manage' ? (
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    id="select-all-designations"
                    checked={selectedDesignations.length === designations.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDesignations(designations);
                      } else {
                        setSelectedDesignations([]);
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <label htmlFor="select-all-designations" className="text-sm font-medium text-gray-700">
                    Select All
                  </label>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {designations.map((d) => (
                    <div key={d} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={selectedDesignations.includes(d)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDesignations([...selectedDesignations, d]);
                          } else {
                            setSelectedDesignations(selectedDesignations.filter(item => item !== d));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">{d.charAt(0).toUpperCase() + d.slice(1)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setDesignationModalMode('create');
                      setDesignationForm({ name: '', editingIndex: -1 });
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      if (selectedDesignations.length === 0) {
                        alert('Please select at least one designation to edit');
                        return;
                      }
                      if (selectedDesignations.length > 1) {
                        alert('Please select only one designation to edit');
                        return;
                      }
                      const index = designations.indexOf(selectedDesignations[0]);
                      setDesignationModalMode('edit');
                      setDesignationForm({ name: designations[index], editingIndex: index });
                    }}
                    className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                    disabled={selectedDesignations.length !== 1}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (selectedDesignations.length === 0) {
                        alert('Please select at least one designation to delete');
                        return;
                      }
                      if (window.confirm(`Are you sure you want to delete ${selectedDesignations.length} designation(s)?`)) {
                        const updatedDesignations = designations.filter(d => !selectedDesignations.includes(d));
                        localStorage.setItem('designations', JSON.stringify(updatedDesignations));
                        setDesignations(updatedDesignations);
                        setSelectedDesignations([]);
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    disabled={selectedDesignations.length === 0}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : designationModalMode === 'create' ? (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation Name</label>
                  <input
                    type="text"
                    value={designationForm.name}
                    onChange={(e) => setDesignationForm({ ...designationForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Manager, HR, Developer"
                  />
                </div>
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setDesignationModalMode('manage');
                      setDesignationForm({ name: '', editingIndex: -1 });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      const name = designationForm.name.trim().toLowerCase();
                      if (!name) {
                        alert('Please enter a designation name');
                        return;
                      }
                      if (designations.includes(name)) {
                        alert('This designation already exists');
                        return;
                      }
                      const updatedDesignations = [...designations, name];
                      localStorage.setItem('designations', JSON.stringify(updatedDesignations));
                      setDesignations(updatedDesignations);
                      setDesignationForm({ name: '', editingIndex: -1 });
                      setDesignationModalMode('manage');
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Edit Designation</label>
                  <input
                    type="text"
                    value={designationForm.name}
                    onChange={(e) => setDesignationForm({ ...designationForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Manager, HR, Developer"
                  />
                </div>
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setDesignationModalMode('manage');
                      setDesignationForm({ name: '', editingIndex: -1 });
                      setSelectedDesignations([]);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      const name = designationForm.name.trim().toLowerCase();
                      if (!name) {
                        alert('Please enter a designation name');
                        return;
                      }
                      if (designations.includes(name) && designations.indexOf(name) !== designationForm.editingIndex) {
                        alert('This designation already exists');
                        return;
                      }
                      const updatedDesignations = [...designations];
                      updatedDesignations[designationForm.editingIndex] = name;
                      localStorage.setItem('designations', JSON.stringify(updatedDesignations));
                      setDesignations(updatedDesignations);
                      setDesignationForm({ name: '', editingIndex: -1 });
                      setSelectedDesignations([]);
                      setDesignationModalMode('manage');
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  </div>
  );
};

export default UserModule;
