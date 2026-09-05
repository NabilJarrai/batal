'use client';

import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Calendar, 
  User, 
  CheckCircle, 
  Clock, 
  Search, 
  Filter, 
  MoreVertical,
  FileText,
  Send,
  AlertTriangle
} from 'lucide-react';
import { 
  Assessment, 
  AssessmentFilters, 
  AssessmentPeriod,
  ASSESSMENT_PERIODS,
  calculateAverageScore,
  getScoreColor,
  getScoreLabel
} from '@/types/assessments';
import { assessmentsAPI } from '@/lib/api/assessments';

interface AssessmentListProps {
  assessments?: Assessment[];
  onView: (assessment: Assessment) => void;
  onEdit: (assessment: Assessment) => void;
  onDelete: (assessmentId: number) => void;
  loading?: boolean;
  showPlayerInfo?: boolean;
  showActions?: boolean;
  compact?: boolean;
  /**
   * Whether the viewer may edit or delete an assessment that is already
   * finalized. Admins and managers can; the coach who wrote it cannot, so for
   * them those controls are hidden rather than shown and then refused.
   */
  canManageFinalized?: boolean;
  /**
   * Break the list into a section per group. A manager looking across the whole
   * academy navigates by group; a coach with one or two groups does not.
   */
  groupByGroup?: boolean;
}

export const AssessmentList: React.FC<AssessmentListProps> = ({
  assessments: propAssessments,
  onView,
  onEdit,
  onDelete,
  loading = false,
  showPlayerInfo = true,
  showActions = true,
  compact = false,
  canManageFinalized = false,
  groupByGroup = false
}) => {
  const [assessments, setAssessments] = useState<Assessment[]>(propAssessments || []);
  const [filteredAssessments, setFilteredAssessments] = useState<Assessment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<AssessmentFilters>({});
  const [groupFilter, setGroupFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<number | null>(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoading = loading || internalLoading;

  // Load assessments if not provided as props
  useEffect(() => {
    if (!propAssessments) {
      loadAssessments();
    }
  }, [propAssessments]);

  // Update local state when props change
  useEffect(() => {
    if (propAssessments) {
      setAssessments(propAssessments);
    }
  }, [propAssessments]);

  // Apply filters and search
  useEffect(() => {
    let filtered = assessments;

    // Apply search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(assessment => 
        assessment.playerName.toLowerCase().includes(term) ||
        assessment.assessorName.toLowerCase().includes(term) ||
        assessment.comments?.toLowerCase().includes(term)
      );
    }

    // Apply filters
    if (filters.period) {
      filtered = filtered.filter(assessment => assessment.period === filters.period);
    }
    
    if (filters.isFinalized !== undefined) {
      filtered = filtered.filter(assessment => assessment.isFinalized === filters.isFinalized);
    }
    
    if (filters.dateFrom) {
      filtered = filtered.filter(assessment => assessment.assessmentDate >= filters.dateFrom!);
    }
    
    if (filters.dateTo) {
      filtered = filtered.filter(assessment => assessment.assessmentDate <= filters.dateTo!);
    }

    if (groupFilter) {
      filtered = filtered.filter(assessment => groupNameOf(assessment) === groupFilter);
    }

    // Sort by date (most recent first)
    filtered = filtered.sort((a, b) => 
      new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime()
    );

    setFilteredAssessments(filtered);
  }, [assessments, searchTerm, filters, groupFilter]);

  const loadAssessments = async () => {
    setInternalLoading(true);
    setError(null);
    
    try {
      const data = await assessmentsAPI.getCoachAssessments();
      setAssessments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assessments');
    } finally {
      setInternalLoading(false);
    }
  };

  const handleFinalize = async (assessment: Assessment) => {
    try {
      const updated = await assessmentsAPI.finalize(assessment.id);
      setAssessments(prev => 
        prev.map(a => a.id === assessment.id ? updated : a)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to finalize assessment');
    }
  };

  /** Players who are not in a group still have assessments; they need a home. */
  const groupNameOf = (assessment: Assessment) =>
    assessment.playerGroupName || 'No group';

  /** Every group present in the data, for the filter dropdown. */
  const availableGroups = Array.from(
    new Set(assessments.map(groupNameOf))
  ).sort((a, b) => a.localeCompare(b));

  /**
   * The filtered list broken into [group, assessments] sections, ordered by
   * group name so the manager finds a group in the same place every time.
   */
  const sections = (): [string, Assessment[]][] => {
    const byGroup = new Map<string, Assessment[]>();
    filteredAssessments.forEach(assessment => {
      const name = groupNameOf(assessment);
      byGroup.set(name, [...(byGroup.get(name) || []), assessment]);
    });
    return Array.from(byGroup.entries()).sort(([a], [b]) => a.localeCompare(b));
  };

  /**
   * Editing and deleting stop at the moment a coach finalizes an assessment.
   * Past that point only an admin or manager can touch it, which is what the
   * backend enforces too.
   */
  const canModify = (assessment: Assessment) =>
    !assessment.isFinalized || canManageFinalized;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (assessment: Assessment) => {
    if (assessment.isFinalized) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
          <CheckCircle size={12} />
          Completed
        </span>
      );
    } else {
      const hasScores = assessment.skillScores && assessment.skillScores.length > 0;
      if (hasScores) {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
            <Clock size={12} />
            Draft
          </span>
        );
      } else {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
            <AlertTriangle size={12} />
            Not Started
          </span>
        );
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-40"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
        <AlertTriangle className="text-red-600" size={20} />
        <span className="text-red-700">{error}</span>
        <button
          onClick={() => window.location.reload()}
          className="ml-auto text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (filteredAssessments.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText size={48} className="mx-auto text-text-secondary mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No assessments found</h3>
        <p className="text-text-secondary">
          {searchTerm || groupFilter || Object.keys(filters).length > 0 
            ? 'Try adjusting your search or filters'
            : 'Create your first assessment to get started'
          }
        </p>
      </div>
    );
  }

  /** One assessment row, shared by the flat and grouped layouts. */
  const renderAssessment = (assessment: Assessment) => {
    const averageScore = calculateAverageScore(assessment.skillScores || []);
    const scoreColor = getScoreColor(averageScore);
    const scoreLabel = getScoreLabel(averageScore);

    return (
      <div
        key={assessment.id}
        className={`bg-white border rounded-lg hover:shadow-md transition-shadow ${
          compact ? 'p-3' : 'p-4'
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 min-w-0 space-y-2">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-3">
                {showPlayerInfo && (
                  <div>
                    <h3 className="font-medium text-gray-900">{assessment.playerName}</h3>
                    <p className="text-sm text-text-secondary">{assessment.assessorName}</p>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  {getStatusBadge(assessment)}
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {ASSESSMENT_PERIODS.find(p => p.key === assessment.period)?.label}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className={`font-bold ${scoreColor}`}>
                  {averageScore > 0 ? `${averageScore}/10` : 'No scores'}
                </div>
                <div className="text-xs text-text-secondary">
                  {averageScore > 0 ? scoreLabel : ''}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                {formatDate(assessment.assessmentDate)}
              </div>
              
              {assessment.skillScores && assessment.skillScores.length > 0 && (
                <div className="flex items-center gap-1">
                  <CheckCircle size={14} />
                  {assessment.skillScores.length} skills rated
                </div>
              )}
              
              {assessment.comments && (
                <div className="flex items-center gap-1">
                  <FileText size={14} />
                  Has comments
                </div>
              )}
            </div>

            {/* Comments Preview */}
            {assessment.comments && !compact && (
              <div className="text-sm text-gray-600 bg-gray-50 rounded p-2 max-w-md">
                {assessment.comments.length > 100 
                  ? `${assessment.comments.substring(0, 100)}...`
                  : assessment.comments
                }
              </div>
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center gap-1 sm:ml-4 shrink-0">
              <button
                onClick={() => onView(assessment)}
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-blue-50 rounded transition-colors"
                title="View assessment"
              >
                <Eye size={16} />
              </button>

              {canModify(assessment) && (
                <button
                  onClick={() => onEdit(assessment)}
                  className="p-2 text-text-secondary hover:text-accent-teal hover:bg-green-50 rounded transition-colors"
                  title={assessment.isFinalized ? 'Edit finalized assessment' : 'Edit assessment'}
                >
                  <Edit size={16} />
                </button>
              )}

              {!assessment.isFinalized && (
                <button
                  onClick={() => handleFinalize(assessment)}
                  className="p-2 text-text-secondary hover:text-text-primary hover:bg-purple-50 rounded transition-colors"
                  title="Finalize assessment"
                >
                  <Send size={16} />
                </button>
              )}

              {canModify(assessment) && (
                <div className="relative">
                  <button
                    onClick={() => setSelectedAssessment(
                      selectedAssessment === assessment.id ? null : assessment.id
                    )}
                    className="p-2 text-text-secondary hover:text-text-primary hover:bg-gray-50 rounded transition-colors"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {selectedAssessment === assessment.id && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 min-w-32">
                      <button
                        onClick={() => {
                          onDelete(assessment.id);
                          setSelectedAssessment(null);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={16} />
          <input
            type="text"
            placeholder="Search assessments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-lg transition-colors shrink-0 ${
            showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'hover:bg-gray-50'
          }`}
        >
          <Filter size={16} />
          Filters
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-gray-50 border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {availableGroups.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
                <select
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  className="select-base"
                >
                  <option value="">All groups</option>
                  {availableGroups.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
              <select
                value={filters.period || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value as AssessmentPeriod || undefined }))}
                className="select-base"
              >
                <option value="">All periods</option>
                {ASSESSMENT_PERIODS.map(period => (
                  <option key={period.key} value={period.key}>{period.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.isFinalized === undefined ? '' : filters.isFinalized.toString()}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  isFinalized: e.target.value === '' ? undefined : e.target.value === 'true'
                }))}
                className="select-base"
              >
                <option value="">All statuses</option>
                <option value="false">Draft</option>
                <option value="true">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value || undefined }))}
                className="select-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value || undefined }))}
                className="select-base"
              />
            </div>
          </div>

          <button
            onClick={() => {
              setFilters({});
              setGroupFilter('');
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-text-secondary">
        Showing {filteredAssessments.length} of {assessments.length} assessments
      </div>

      {/* Assessment List */}
      {groupByGroup ? (
        <div className="space-y-6">
          {sections().map(([groupName, groupAssessments]) => {
            const done = groupAssessments.filter(a => a.isFinalized).length;

            return (
              <div key={groupName}>
                <div className="flex items-center justify-between gap-4 mb-3 pb-2 border-b border-border">
                  <h3 className="font-semibold text-text-primary">{groupName}</h3>
                  <span className="text-xs text-text-secondary whitespace-nowrap">
                    {done} done
                    {groupAssessments.length - done > 0 &&
                      ` • ${groupAssessments.length - done} in progress`}
                  </span>
                </div>
                <div className={`space-y-${compact ? '2' : '4'}`}>
                  {groupAssessments.map(renderAssessment)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={`space-y-${compact ? '2' : '4'}`}>
          {filteredAssessments.map(renderAssessment)}
        </div>
      )}
    </div>
  );
};