import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, BookOpen, Video, FileText, Trash2, Edit2, Clock, AlertCircle } from 'lucide-react';
import Sidebar from '../Sidebar';

const DRAFT_KEY = 'ltDrafts';

const DraftsModule = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [drafts, setDrafts] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
      const list = [];
      Object.entries(stored).forEach(([type, items]) => {
        Object.entries(items).forEach(([id, draft]) => {
          if (!draft) return;
          // New format: { payload, savedAt }. Old format: { title, description, ..., savedAt }.
          const savedAt = draft.savedAt || draft.payload?.savedAt;
          let payload;
          if (draft.payload && typeof draft.payload === 'object') {
            payload = draft.payload;
          } else if (draft.title || draft.description || draft.questions) {
            payload = draft;
          }
          if (payload) {
            list.push({
              type,
              id,
              title: payload.title || '(Untitled)',
              description: payload.description || '',
              savedAt,
              payload
            });
          }
        });
      });
      list.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
      setDrafts(list);
    } catch (err) {
      setDrafts([]);
    }
  };

  const deleteDraft = (type, id) => {
    if (!window.confirm('Are you sure you want to delete this draft?')) return;
    try {
      const stored = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
      if (stored[type]) {
        delete stored[type][id];
      }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(stored));
      loadDrafts();
    } catch (err) {
    }
  };

  const continueDraft = (type, id) => {
    navigate('/lt-module', { state: { draftType: type, draftId: id } });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'quiz': return BookOpen;
      case 'video': return Video;
      case 'training': return FileText;
      default: return Save;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'quiz': return 'Quiz';
      case 'video': return 'Video Training';
      case 'training': return 'Training Asset';
      default: return type;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString();
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar currentUser={currentUser} />
      <div className="md:ml-64 min-h-screen">
        <div className="p-6 md:p-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="mr-4 p-2 bg-white rounded-lg shadow-sm hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Drafts</h1>
                  <p className="text-sm text-gray-500">Saved quiz, video, and training drafts</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/lt-module')}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                L&T Module
              </button>
            </div>

            {drafts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No drafts found</h3>
                <p className="text-sm text-gray-500 mb-4">Save a quiz, video, or training as a draft from the L&T Module to see it here.</p>
                <button
                  onClick={() => navigate('/lt-module')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Go to L&T Module
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {drafts.map((draft) => {
                  const Icon = getTypeIcon(draft.type);
                  return (
                    <div key={`${draft.type}-${draft.id}`} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start">
                          <div className={`p-3 rounded-lg mr-4 ${
                            draft.type === 'quiz' ? 'bg-blue-50 text-blue-600' :
                            draft.type === 'video' ? 'bg-green-50 text-green-600' :
                            'bg-amber-50 text-amber-600'
                          }`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                {getTypeLabel(draft.type)}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDate(draft.savedAt)}
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mt-1">{draft.title}</h3>
                            {draft.description && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{draft.description}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-2">
                              {draft.payload.questions?.length || 0} question(s)
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => continueDraft(draft.type, draft.id)}
                            className="flex items-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                          >
                            <Edit2 className="w-4 h-4 mr-1.5" />
                            Continue
                          </button>
                          <button
                            onClick={() => deleteDraft(draft.type, draft.id)}
                            className="flex items-center px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm"
                          >
                            <Trash2 className="w-4 h-4 mr-1.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DraftsModule;
