import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, FileText, AlertCircle } from 'lucide-react';
import Sidebar from '../Sidebar';

const ApprovalWorkflow = () => {
  const [approvals, setApprovals] = useState([]);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [typeFilter, setTypeFilter] = useState('all'); // all, training-request, budget-request, participant-request
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('pending'); // pending, approved
  const [formData, setFormData] = useState({
    title: '',
    type: 'training-request',
    requestedBy: '',
    department: '',
    description: '',
    approvalChain: [] // Array of { level, approverId, approverName }
  });
  const [users, setUsers] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingApproval, setEditingApproval] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    type: 'training-request',
    requestedBy: '',
    department: '',
    description: '',
    approvalLevels: ['manager', 'hr', 'management'],
    currentLevel: '',
    status: 'pending'
  });

  useEffect(() => {
    loadApprovals();
    loadCurrentUser();
    loadUsers();
    loadDesignations();
  }, []);

  const loadDesignations = () => {
    const storedDesignations = JSON.parse(localStorage.getItem('designations') || '[]');
    if (storedDesignations.length === 0) {
      const defaultDesignations = ['manager', 'hr', 'management', 'employee'];
      setDesignations(defaultDesignations);
    } else {
      setDesignations(storedDesignations);
    }
  };

  const loadCurrentUser = () => {
    const currentAdmin = JSON.parse(localStorage.getItem('currentAdmin') || 'null');
    setCurrentUser(currentAdmin);
  };

  const loadUsers = () => {
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    setUsers(storedUsers);
  };

  const loadApprovals = () => {
    const storedApprovals = JSON.parse(localStorage.getItem('approvals') || '[]');
    setApprovals(storedApprovals);
  };

  const handleApprove = (approvalId, level) => {
    const updatedApprovals = approvals.map(approval => {
      if (approvalId === approval.id) {
        const approvalLevels = approval.approvalChain || [];
        const currentLevelIndex = approvalLevels.findIndex(chain => chain.level === level);
        
        if (currentLevelIndex === -1) {
          // Fallback to old logic for backward compatibility
          const oldLevels = approval.approvalLevels || ['manager', 'hr', 'management'];
          const oldCurrentIndex = oldLevels.indexOf(level);
          
          if (oldCurrentIndex === oldLevels.length - 1) {
            // Final approval - update training status
            updateTrainingStatus(approval, 'approved');
            return {
              ...approval,
              status: 'approved',
              approvedAt: new Date().toISOString(),
              approvedBy: currentUser?.name || 'Admin'
            };
          } else {
            return {
              ...approval,
              currentLevel: oldLevels[oldCurrentIndex + 1],
              approvals: [
                ...(approval.approvals || []),
                { level, approvedBy: currentUser?.name || 'Admin', approvedAt: new Date().toISOString() }
              ]
            };
          }
        }
        
        if (currentLevelIndex === approvalLevels.length - 1) {
          // Final approval - update training status
          updateTrainingStatus(approval, 'approved');
          return {
            ...approval,
            status: 'approved',
            approvedAt: new Date().toISOString(),
            approvedBy: currentUser?.name || 'Admin'
          };
        } else {
          // Move to next level in chain
          const nextLevel = approvalLevels[currentLevelIndex + 1];
          return {
            ...approval,
            currentLevel: nextLevel.level,
            approvals: [
              ...(approval.approvals || []),
              { level, approverId: currentUser?.id, approverName: currentUser?.name, approvedAt: new Date().toISOString() }
            ]
          };
        }
      }
      return approval;
    });
    
    localStorage.setItem('approvals', JSON.stringify(updatedApprovals));
    setApprovals(updatedApprovals);
  };

  const updateTrainingStatus = (approval, status) => {
    console.log('updateTrainingStatus called with approval:', approval, 'status:', status);
    if (approval.type === 'training-request' && approval.trainingId) {
      const trainingSchedules = JSON.parse(localStorage.getItem('trainingSchedules') || '[]');
      console.log('Current trainingSchedules before update:', trainingSchedules);
      // Ensure trainingSchedules is an array
      const trainingSchedulesArray = Array.isArray(trainingSchedules) ? trainingSchedules : [];
      const updatedTrainings = trainingSchedulesArray.map(training => {
        if (training.id === approval.trainingId) {
          console.log('Found training to update:', training);
          return {
            ...training,
            status: status
          };
        }
        return training;
      });
      console.log('Updated trainingSchedules:', updatedTrainings);
      localStorage.setItem('trainingSchedules', JSON.stringify(updatedTrainings));
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('trainingUpdated', { detail: { trainingId: approval.trainingId } }));
    }
  };

  const handleReject = (approvalId) => {
    if (window.confirm('Are you sure you want to reject this request?')) {
      const updatedApprovals = approvals.map(approval => {
        if (approvalId === approval.id) {
          // Update training status to cancelled
          updateTrainingStatus(approval, 'cancelled');
          return {
            ...approval,
            status: 'rejected',
            rejectedAt: new Date().toISOString(),
            rejectedBy: 'Admin'
          };
        }
        return approval;
      });
      
      localStorage.setItem('approvals', JSON.stringify(updatedApprovals));
      setApprovals(updatedApprovals);
    }
  };

  const handleEditApproval = (approval) => {
    setEditingApproval(approval);
    const approvalLevels = approval.approvalLevels || approval.approvalChain?.map(c => c.level) || ['manager', 'hr', 'management'];
    const approvedLevels = (approval.approvals || []).map(a => a.level);
    
    // Create a map of level -> approver details
    const levelApprovers = {};
    if (approval.approvalChain) {
      approval.approvalChain.forEach(chain => {
        levelApprovers[chain.level] = {
          approverId: chain.approverId,
          approverName: chain.approverName
        };
      });
    }
    
    setEditFormData({
      title: approval.title,
      type: approval.type,
      requestedBy: approval.requestedBy,
      department: approval.department,
      description: approval.description,
      approvalLevels: approvalLevels,
      currentLevel: approval.currentLevel || approval.approvalLevels?.[0] || '',
      status: approval.status,
      approvedLevels: approvedLevels, // Track which levels are already approved
      levelApprovers: levelApprovers // Track who is the approver for each level
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    const updatedApprovals = approvals.map(approval => {
      if (approval.id === editingApproval.id) {
        return {
          ...approval,
          title: editFormData.title,
          type: editFormData.type,
          requestedBy: editFormData.requestedBy,
          department: editFormData.department,
          description: editFormData.description,
          approvalLevels: editFormData.approvalLevels,
          currentLevel: editFormData.currentLevel,
          status: editFormData.status,
          updatedAt: new Date().toISOString()
        };
      }
      return approval;
    });
    
    localStorage.setItem('approvals', JSON.stringify(updatedApprovals));
    setApprovals(updatedApprovals);
    setShowEditModal(false);
    setEditingApproval(null);
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeColor = (type) => {
    const colors = {
      'training-request': 'bg-blue-100 text-blue-800',
      'budget-request': 'bg-green-100 text-green-800',
      'participant-request': 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getApprovalProgress = (approval) => {
    const levels = approval.approvalLevels || ['manager', 'hr', 'management'];
    const currentLevel = approval.currentLevel || levels[0];
    const currentIndex = levels.indexOf(currentLevel);
    return { current: currentIndex + 1, total: levels.length };
  };

  // Filter approvals based on current admin's role
  const getFilteredApprovals = () => {
    if (!currentUser) return [];
    
    // Super Admin sees all approvals
    if (currentUser.isSuperAdmin) return approvals;
    
    // Regular admins see only approvals where they are the designated approver for current level
    return approvals.filter(approval => {
      if (approval.approvalChain && approval.approvalChain.length > 0) {
        const currentLevel = approval.currentLevel || approval.approvalChain[0].level;
        const currentLevelConfig = approval.approvalChain.find(chain => chain.level === currentLevel);
        if (currentLevelConfig && currentLevelConfig.approverId) {
          return currentUser.id === currentLevelConfig.approverId;
        }
      }
      // If no designated approvers, check designation
      const currentLevel = approval.currentLevel || 'manager';
      return currentUser.designation === currentLevel;
    });
  };

  // Get approvals that current admin has already approved
  const getMyApprovedApprovals = () => {
    if (!currentUser) return [];
    
    return approvals.filter(approval => {
      if (!approval.approvals) return false;
      return approval.approvals.some(a => a.approverId === currentUser.id);
    });
  };

  const canUserApprove = (approval) => {
    if (!currentUser) return false;
    
    // Super Admin has complete control - can approve anything
    if (currentUser.isSuperAdmin) return true;
    
    // If approval has designated approvers for levels, check if current user is the designated approver for current level
    if (approval.approvalChain && approval.approvalChain.length > 0) {
      const currentLevel = approval.currentLevel || approval.approvalChain[0].level;
      const currentLevelConfig = approval.approvalChain.find(chain => chain.level === currentLevel);
      
      if (currentLevelConfig && currentLevelConfig.approverId) {
        return currentUser.id === currentLevelConfig.approverId;
      }
    }
    
    // If no designated approvers, check if user's designation matches current level
    const currentLevel = approval.currentLevel || 'manager';
    return currentUser.designation === currentLevel;
  };

  const addApprovalLevel = (level, approverId, approverName) => {
    setFormData(prev => ({
      ...prev,
      approvalChain: [...prev.approvalChain, { level, approverId, approverName }]
    }));
  };

  const removeApprovalLevel = (index) => {
    setFormData(prev => ({
      ...prev,
      approvalChain: prev.approvalChain.filter((_, i) => i !== index)
    }));
  };

  const handleCreateApproval = (e) => {
    e.preventDefault();
    
    if (formData.approvalChain.length === 0) {
      alert('Please add at least one approval level');
      return;
    }

    const newApproval = {
      id: `approval-${Date.now()}`,
      ...formData,
      status: 'pending',
      currentLevel: formData.approvalChain[0].level,
      approvalLevels: formData.approvalChain.map(chain => chain.level),
      approvals: [],
      createdAt: new Date().toISOString()
    };

    const updatedApprovals = [...approvals, newApproval];
    localStorage.setItem('approvals', JSON.stringify(updatedApprovals));
    setApprovals(updatedApprovals);
    setShowCreateModal(false);
    setFormData({
      title: '',
      type: 'training-request',
      requestedBy: '',
      department: '',
      description: '',
      approvalChain: []
    });
  };

  const filteredApprovals = getFilteredApprovals().filter(approval => approval.status === 'pending');
  const myApprovedApprovals = getMyApprovedApprovals();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-0 md:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">Approval Workflow</h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <CheckCircle className="w-4 h-4" />
                  Create Request
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
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{approvals.length}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {approvals.filter(a => a.status === 'pending').length}
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
                    {approvals.filter(a => a.status === 'approved').length}
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
                    {approvals.filter(a => a.status === 'rejected').length}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Status:</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Type:</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="training-request">Training Request</option>
                  <option value="budget-request">Budget Request</option>
                  <option value="participant-request">Participant Request</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
                  activeTab === 'pending'
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                My Pending Approvals
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
                  activeTab === 'approved'
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                My Approved Approvals
              </button>
            </div>
          </div>

          {/* Approval Requests List */}
          {activeTab === 'pending' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">My Pending Approvals</h2>
              <p className="text-sm text-gray-500 mt-1">Requests awaiting your approval</p>
            </div>
            
            {filteredApprovals.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredApprovals.map((approval) => {
                  const progress = getApprovalProgress(approval);
                  return (
                    <div key={approval.id} className="p-6 hover:bg-gray-50 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{approval.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(approval.type)}`}>
                              {approval.type.replace('-', ' ')}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(approval.status)}`}>
                              {approval.status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                            <div>
                              <p className="font-medium text-gray-900">Requested By</p>
                              <p>{approval.requestedBy}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Department</p>
                              <p>{approval.department}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Requested On</p>
                              <p>{new Date(approval.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>

                          {approval.type === 'budget-request' && (
                            <div className="text-sm text-gray-600 mb-3">
                              <p className="font-medium text-gray-900">Amount: ${approval.amount?.toLocaleString()}</p>
                              <p>Justification: {approval.justification}</p>
                            </div>
                          )}

                          {approval.type === 'training-request' && (
                            <div className="text-sm text-gray-600 mb-3">
                              <p className="font-medium text-gray-900">Training: {approval.trainingTitle}</p>
                              <p>Expected Outcome: {approval.expectedOutcome}</p>
                            </div>
                          )}

                          {/* Approval Progress */}
                          {approval.status === 'pending' && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Approval Progress</span>
                                <span className="text-sm text-gray-600">{progress.current}/{progress.total}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all"
                                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                />
                              </div>
                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                                {(approval.approvalLevels || ['manager', 'hr', 'management']).map((level, idx) => {
                                  const isApproved = (approval.approvals || []).some(a => a.level === level);
                                  const isCurrent = approval.currentLevel === level;
                                  const isPending = idx > (approval.approvalLevels || []).indexOf(approval.currentLevel);
                                  return (
                                    <div
                                      key={level}
                                      className={`flex items-center gap-1 px-2 py-1 rounded ${
                                        isApproved ? 'bg-green-100 text-green-700' :
                                        isCurrent ? 'bg-yellow-100 text-yellow-700' :
                                        isPending ? 'bg-gray-100 text-gray-500' : 'bg-gray-100 text-gray-500'
                                      }`}
                                    >
                                      {isApproved && <CheckCircle className="w-3 h-3" />}
                                      {isCurrent && <Clock className="w-3 h-3" />}
                                      {level}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {approval.status === 'pending' && currentUser?.isSuperAdmin && (
                            <button
                              onClick={() => handleEditApproval(approval)}
                              className="flex items-center gap-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
                              title="Edit Approval"
                            >
                              <FileText className="w-4 h-4" />
                              Edit
                            </button>
                          )}
                          {approval.status === 'pending' && (
                            <>
                              {canUserApprove(approval) ? (
                                <>
                                  <button
                                    onClick={() => handleApprove(approval.id, approval.currentLevel)}
                                    className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleReject(approval.id)}
                                    className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Reject
                                  </button>
                                </>
                              ) : (
                                <div className="text-sm text-gray-500 italic">
                                  Awaiting {approval.currentLevel || 'manager'} approval
                                </div>
                              )}
                            </>
                          )}
                          {approval.status === 'approved' && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-5 h-5" />
                              <span className="text-sm font-medium">Approved</span>
                            </div>
                          )}
                          {approval.status === 'rejected' && (
                            <div className="flex items-center gap-1 text-red-600">
                              <XCircle className="w-5 h-5" />
                              <span className="text-sm font-medium">Rejected</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No pending approval requests found</p>
              </div>
            )}
          </div>
          )}

          {/* My Approved Approvals List */}
          {activeTab === 'approved' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">My Approved Approvals</h2>
              <p className="text-sm text-gray-500 mt-1">Requests you have approved</p>
            </div>
            
            {myApprovedApprovals.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {myApprovedApprovals.map((approval) => {
                  const progress = getApprovalProgress(approval);
                  return (
                    <div key={approval.id} className="p-6 hover:bg-gray-50 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{approval.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(approval.type)}`}>
                              {approval.type.replace('-', ' ')}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(approval.status)}`}>
                              {approval.status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                            <div>
                              <p className="font-medium text-gray-900">Requested By</p>
                              <p>{approval.requestedBy}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Department</p>
                              <p>{approval.department}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Requested On</p>
                              <p>{new Date(approval.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>

                          <p className="text-sm text-gray-600">{approval.description}</p>

                          {/* Approval Progress */}
                          {approval.status === 'pending' && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Approval Progress</span>
                                <span className="text-sm text-gray-600">{progress.current}/{progress.total}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all"
                                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                />
                              </div>
                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                                {(approval.approvalLevels || ['manager', 'hr', 'management']).map((level, idx) => {
                                  const isApproved = (approval.approvals || []).some(a => a.level === level);
                                  const isCurrent = approval.currentLevel === level;
                                  const isPending = idx > (approval.approvalLevels || []).indexOf(approval.currentLevel);
                                  return (
                                    <div
                                      key={level}
                                      className={`flex items-center gap-1 px-2 py-1 rounded ${
                                        isApproved ? 'bg-green-100 text-green-700' :
                                        isCurrent ? 'bg-yellow-100 text-yellow-700' :
                                        isPending ? 'bg-gray-100 text-gray-500' : 'bg-gray-100 text-gray-500'
                                      }`}
                                    >
                                      {isApproved && <CheckCircle className="w-3 h-3" />}
                                      {isCurrent && <Clock className="w-3 h-3" />}
                                      {level}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {approval.status === 'approved' && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-5 h-5" />
                              <span className="text-sm font-medium">Approved</span>
                            </div>
                          )}
                          {approval.status === 'pending' && (
                            <div className="flex items-center gap-1 text-yellow-600">
                              <Clock className="w-5 h-5" />
                              <span className="text-sm font-medium">In Progress</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No approved requests found</p>
              </div>
            )}
          </div>
          )}
        </main>
      </div>

      {/* Create Approval Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Create Approval Request</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateApproval} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="training-request">Training Request</option>
                  <option value="budget-request">Budget Request</option>
                  <option value="participant-request">Participant Request</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requested By</label>
                <input
                  type="text"
                  value={formData.requestedBy}
                  onChange={(e) => setFormData({...formData, requestedBy: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>

              {/* Approval Chain Configuration */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Approval Chain</h3>
                <div className="space-y-3">
                  {formData.approvalChain.map((chain, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{chain.level.charAt(0).toUpperCase() + chain.level.slice(1)}</p>
                        <p className="text-sm text-gray-600">{chain.approverName}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeApprovalLevel(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-3">
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    id="designation-select"
                    onChange={(e) => {
                      const designation = e.target.value;
                      const approverSelect = document.getElementById('approver-select');
                      approverSelect.innerHTML = '<option value="">Select Approver</option>';
                      
                      if (designation) {
                        const filteredUsers = users.filter(user => user.designation === designation);
                        console.log('Designation:', designation);
                        console.log('Filtered users:', filteredUsers);
                        console.log('All users:', users);
                        
                        if (filteredUsers.length === 0) {
                          const option = document.createElement('option');
                          option.value = "";
                          option.textContent = "No users with this designation";
                          approverSelect.appendChild(option);
                        } else {
                          filteredUsers.forEach(user => {
                            const option = document.createElement('option');
                            option.value = user.id;
                            option.textContent = `${user.name} (${user.email})`;
                            approverSelect.appendChild(option);
                          });
                        }
                        approverSelect.disabled = false;
                      } else {
                        approverSelect.disabled = true;
                      }
                    }}
                  >
                    <option value="">Select Designation</option>
                    {designations.map(d => (
                      <option key={d} value={d}>
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </option>
                    ))}
                  </select>
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 flex-1"
                    id="approver-select"
                    disabled
                  >
                    <option value="">Select Approver</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const designation = document.getElementById('designation-select').value;
                      const approverSelect = document.getElementById('approver-select');
                      const approverId = approverSelect.value;
                      const approverName = approverSelect.options[approverSelect.selectedIndex].text;
                      
                      if (designation && approverId) {
                        addApprovalLevel(designation, approverId, approverName);
                        document.getElementById('designation-select').value = '';
                        approverSelect.innerHTML = '<option value="">Select Approver</option>';
                        approverSelect.disabled = true;
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">First select designation, then select approver from that designation</p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Approval Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900">Edit Approval</h2>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={editFormData.type}
                  onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="training-request">Training Request</option>
                  <option value="budget-request">Budget Request</option>
                  <option value="participant-request">Participant Request</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Requested By</label>
                <input
                  type="text"
                  value={editFormData.requestedBy}
                  onChange={(e) => setEditFormData({ ...editFormData, requestedBy: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <input
                  type="text"
                  value={editFormData.department}
                  onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              {/* Approval Levels Management */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Approval Flow (Levels)</label>
                <div className="space-y-2">
                  {editFormData.approvalLevels.map((level, index) => {
                    const isApproved = editFormData.approvedLevels?.includes(level);
                    const approverInfo = editFormData.levelApprovers?.[level];
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 font-medium">{index + 1}.</span>
                        <select
                          value={level}
                          onChange={(e) => {
                            const newLevels = [...editFormData.approvalLevels];
                            newLevels[index] = e.target.value;
                            setEditFormData({ ...editFormData, approvalLevels: newLevels });
                          }}
                          disabled={isApproved}
                          className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm ${
                            isApproved ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                          }`}
                        >
                          <option value="">Select level</option>
                          {designations.map(d => (
                            <option key={d} value={d}>
                              {d.charAt(0).toUpperCase() + d.slice(1)}
                            </option>
                          ))}
                        </select>
                        {approverInfo && (
                          <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                            👤 {approverInfo.approverName}
                          </span>
                        )}
                        {isApproved && (
                          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Approved
                          </span>
                        )}
                        {!isApproved && (
                          <>
                            <button
                              onClick={() => {
                                const newLevels = editFormData.approvalLevels.filter((_, i) => i !== index);
                                setEditFormData({ ...editFormData, approvalLevels: newLevels });
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Remove level"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                            {index > 0 && !editFormData.approvedLevels?.includes(editFormData.approvalLevels[index - 1]) && (
                              <button
                                onClick={() => {
                                  const newLevels = [...editFormData.approvalLevels];
                                  [newLevels[index - 1], newLevels[index]] = [newLevels[index], newLevels[index - 1]];
                                  setEditFormData({ ...editFormData, approvalLevels: newLevels });
                                }}
                                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                                title="Move up"
                              >
                                ↑
                              </button>
                            )}
                            {index < editFormData.approvalLevels.length - 1 && !editFormData.approvedLevels?.includes(editFormData.approvalLevels[index + 1]) && (
                              <button
                                onClick={() => {
                                  const newLevels = [...editFormData.approvalLevels];
                                  [newLevels[index], newLevels[index + 1]] = [newLevels[index + 1], newLevels[index]];
                                  setEditFormData({ ...editFormData, approvalLevels: newLevels });
                                }}
                                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                                title="Move down"
                              >
                                ↓
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                  <button
                    onClick={() => setEditFormData({ ...editFormData, approvalLevels: [...editFormData.approvalLevels, ''] })}
                    className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-500 hover:text-blue-500 transition"
                  >
                    + Add Approval Level
                  </button>
                </div>
                {editFormData.approvedLevels && editFormData.approvedLevels.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    ✓ Already approved stages cannot be modified
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Level</label>
                <select
                  value={editFormData.currentLevel}
                  onChange={(e) => setEditFormData({ ...editFormData, currentLevel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select current level</option>
                  {editFormData.approvalLevels.map((level, idx) => (
                    <option key={idx} value={level}>{level} (Step {idx + 1})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows="3"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingApproval(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalWorkflow;
