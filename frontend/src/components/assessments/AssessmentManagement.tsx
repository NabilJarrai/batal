'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  BarChart3, 
  Users, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  RefreshCw,
  FileText,
  CheckCircle,
  Clock
} from 'lucide-react';
import { 
  Assessment, 
  AssessmentSummary,
  AssessmentFilters,
  calculateAverageScore,
  calculateCategoryAverage 
} from '@/types/assessments';
import { SkillCategory, SKILL_CATEGORIES } from '@/types/skills';
import { AssessmentForm } from './AssessmentForm';
import { AssessmentList } from './AssessmentList';
import { assessmentsAPI } from '@/lib/api/assessments';

type ViewMode = 'list' | 'create' | 'edit' | 'view' | 'analytics';

interface AssessmentManagementProps {
  initialMode?: ViewMode;
  playerId?: number;
}

export const AssessmentManagement: React.FC<AssessmentManagementProps> = ({
  initialMode = 'list',
  playerId
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>(initialMode);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [summary, setSummary] = useState<AssessmentSummary | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [playerId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [assessmentsData, summaryData] = await Promise.all([
        playerId 
          ? assessmentsAPI.getByPlayer(playerId)
          : assessmentsAPI.getCoachAssessments(),
        assessmentsAPI.getSummary(playerId ? { playerId } : undefined)
      ]);

      setAssessments(assessmentsData);
      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assessment data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedAssessment(null);
    setViewMode('create');
  };

  const handleView = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setViewMode('view');
  };

  const handleEdit = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setViewMode('edit');
  };

  const handleDelete = async (assessmentId: number) => {
    if (!confirm('Are you sure you want to delete this assessment?')) {
      return;
    }

    try {
      await assessmentsAPI.delete(assessmentId);
      setAssessments(prev => prev.filter(a => a.id !== assessmentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete assessment');
    }
  };

  const handleSave = (assessment: Assessment) => {
    setAssessments(prev => {
      const existing = prev.find(a => a.id === assessment.id);
      if (existing) {
        return prev.map(a => a.id === assessment.id ? assessment : a);
      } else {
        return [assessment, ...prev];
      }
    });
    
    setViewMode('list');
    loadData(); // Refresh summary
  };

  const handleCancel = () => {
    setSelectedAssessment(null);
    setViewMode('list');
  };

  const getQuickStats = () => {
    const pending = assessments.filter(a => !a.isFinalized).length;
    const completed = assessments.filter(a => a.isFinalized).length;
    const thisMonth = assessments.filter(a => {
      const assessmentDate = new Date(a.assessmentDate);
      const now = new Date();
      return assessmentDate.getMonth() === now.getMonth() && 
             assessmentDate.getFullYear() === now.getFullYear();
    }).length;

    return { pending, completed, thisMonth };
  };

  const stats = getQuickStats();

  if (loading && viewMode === 'list') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {viewMode === 'list' && (
        <>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Assessment Management</h1>
                <p className="text-text-secondary mt-1">
                  {playerId ? 'Player assessment history and progress' : 'Manage player assessments and track progress'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={loadData}
                  disabled={loading}
                  className="p-2 text-text-secondary hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                  title="Refresh"
                >
                  <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>

                <button
                  onClick={() => setViewMode('analytics')}
                  className="flex items-center gap-2 px-4 py-2 border border-white/30 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  <BarChart3 size={16} />
                  Analytics
                </button>

                <button
                  onClick={handleCreateNew}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus size={16} />
                  New Assessment
                </button>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle className="text-red-600" size={20} />
              <span className="text-red-700">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Assessments</p>
                  <p className="text-2xl font-bold text-gray-900">{assessments.length}</p>
                </div>
                <FileText className="text-text-secondary" size={24} />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <CheckCircle className="text-accent-teal" size={24} />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="text-accent-yellow" size={24} />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.thisMonth}</p>
                </div>
                <Calendar className="text-text-primary" size={24} />
              </div>
            </div>
          </div>

          {/* Category Performance Overview */}
          {summary && (
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {SKILL_CATEGORIES.map(category => {
                  const avgScore = summary.averageScoreByCategory[category.key] || 0;
                  const percentage = (avgScore / 10) * 100;

                  return (
                    <div key={category.key} className="text-center">
                      <div className={`w-12 h-12 rounded-full ${category.color} flex items-center justify-center text-white text-xl mx-auto mb-2`}>
                        {category.icon}
                      </div>
                      <p className="font-medium text-gray-900">{category.label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${category.color}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          {avgScore.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Content Area */}
      <div>
        {viewMode === 'list' && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl">
            <div className="p-6">
              <AssessmentList
                assessments={assessments}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                loading={loading}
                showPlayerInfo={!playerId}
              />
            </div>
          </div>
        )}

        {(viewMode === 'create' || viewMode === 'edit' || viewMode === 'view') && (
          <AssessmentForm
            assessment={selectedAssessment || undefined}
            playerId={playerId}
            onSave={handleSave}
            onCancel={handleCancel}
            mode={viewMode === 'view' ? 'view' : viewMode === 'edit' ? 'edit' : 'create'}
          />
        )}

        {viewMode === 'analytics' && (
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Assessment Analytics</h2>
              <button
                onClick={() => setViewMode('list')}
                className="text-gray-600 hover:text-gray-800"
              >
                Back to List
              </button>
            </div>

            {/* Analytics Content */}
            <div className="space-y-6">
              {/* Trends Chart Placeholder */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <TrendingUp className="mx-auto text-text-secondary mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Performance Trends</h3>
                <p className="text-text-secondary">
                  Detailed analytics and progress charts will be implemented here
                </p>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <AssessmentList
                  assessments={assessments.slice(0, 5)}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  showPlayerInfo={!playerId}
                  compact={true}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};