"use client";

import { useState, useMemo } from 'react';
import GroupCard from './GroupCard';
import { GroupResponse, GroupFilters, Level, AgeGroup } from '@/types/groups';

interface GroupListProps {
  groups: GroupResponse[];
  loading?: boolean;
  onAssignCoach?: (groupId: number) => void;
  onAssignPlayer?: (groupId: number) => void;
  onViewDetails?: (groupId: number) => void;
  onEdit?: (groupId: number) => void;
  onCreateGroup?: () => void;
  showActions?: boolean;
  isSelectable?: boolean;
  selectedGroups?: number[];
  onSelectionChange?: (groupIds: number[]) => void;
  filters?: GroupFilters;
  onFiltersChange?: (filters: GroupFilters) => void;
}

export default function GroupList({
  groups,
  loading = false,
  onAssignCoach,
  onAssignPlayer,
  onViewDetails,
  onEdit,
  onCreateGroup,
  showActions = true,
  isSelectable = false,
  selectedGroups = [],
  onSelectionChange,
  filters = {},
  onFiltersChange
}: GroupListProps) {
  const [searchTerm, setSearchTerm] = useState(filters.searchTerm || '');
  const [selectedLevel, setSelectedLevel] = useState<Level | 'ALL'>(filters.level || 'ALL');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeGroup | 'ALL'>(filters.ageGroup || 'ALL');
  const [showInactive, setShowInactive] = useState(filters.isActive === false);
  const [showFullGroups, setShowFullGroups] = useState(true);

  // Filter and search groups
  const filteredGroups = useMemo(() => {
    return groups.filter(group => {
      // Search term filter
      if (searchTerm && !group.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Level filter
      if (selectedLevel !== 'ALL' && group.level !== selectedLevel) {
        return false;
      }
      
      // Age group filter  
      if (selectedAgeGroup !== 'ALL' && group.ageGroup !== selectedAgeGroup) {
        return false;
      }
      
      // Active/inactive filter
      if (!showInactive && !group.isActive) {
        return false;
      }
      
      // Full groups filter
      if (!showFullGroups && group.isFull) {
        return false;
      }
      
      return true;
    });
  }, [groups, searchTerm, selectedLevel, selectedAgeGroup, showInactive, showFullGroups]);

  // Group by level for display
  const groupsByLevel = useMemo(() => {
    const grouped: { [key in Level]: GroupResponse[] } = {
      [Level.DEVELOPMENT]: [],
      [Level.ADVANCED]: []
    };
    
    filteredGroups.forEach(group => {
      grouped[group.level].push(group);
    });
    
    return grouped;
  }, [filteredGroups]);

  const handleFilterChange = () => {
    if (onFiltersChange) {
      onFiltersChange({
        searchTerm: searchTerm || undefined,
        level: selectedLevel === 'ALL' ? undefined : selectedLevel,
        ageGroup: selectedAgeGroup === 'ALL' ? undefined : selectedAgeGroup,
        isActive: showInactive ? undefined : true
      });
    }
  };

  const handleGroupSelect = (groupId: number) => {
    if (!isSelectable || !onSelectionChange) return;
    
    const newSelection = selectedGroups.includes(groupId)
      ? selectedGroups.filter(id => id !== groupId)
      : [...selectedGroups, groupId];
    
    onSelectionChange(newSelection);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedLevel('ALL');
    setSelectedAgeGroup('ALL');
    setShowInactive(false);
    setShowFullGroups(true);
    if (onFiltersChange) {
      onFiltersChange({});
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-white/20 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-white/20 rounded"></div>
              <div className="h-3 bg-white/20 rounded w-5/6"></div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-white/20 rounded w-3/4"></div>
                <div className="h-3 bg-white/20 rounded w-1/2"></div>
                <div className="h-2 bg-white/20 rounded"></div>
                <div className="h-8 bg-white/20 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Groups</h2>
          <p className="text-blue-200">
            {filteredGroups.length} of {groups.length} groups
          </p>
        </div>
        
        {onCreateGroup && (
          <button
            onClick={onCreateGroup}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Group
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 placeholder-blue-300 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
            />
          </div>

          {/* Level Filter */}
          <div>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as Level | 'ALL')}
              className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <option value="ALL">All Levels</option>
              <option value={Level.DEVELOPMENT}>Development</option>
              <option value={Level.ADVANCED}>Advanced</option>
            </select>
          </div>

          {/* Age Group Filter */}
          <div>
            <select
              value={selectedAgeGroup}
              onChange={(e) => setSelectedAgeGroup(e.target.value as AgeGroup | 'ALL')}
              className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <option value="ALL">All Ages</option>
              <option value={AgeGroup.COOKIES}>Cookies (4-6)</option>
              <option value={AgeGroup.DOLPHINS}>Dolphins (7-10)</option>
              <option value={AgeGroup.TIGERS}>Tigers (11-13)</option>
              <option value={AgeGroup.LIONS}>Lions (14-16)</option>
            </select>
          </div>

          {/* Show Inactive Toggle */}
          <div className="flex items-center">
            <label className="flex items-center text-blue-200 text-sm">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="mr-2 h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-white/30 rounded bg-white/10"
              />
              Show Inactive
            </label>
          </div>

          {/* Clear Filters */}
          <div>
            <button
              onClick={clearFilters}
              className="w-full px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm transition-colors duration-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Groups Display */}
      {filteredGroups.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-300">No groups found</h3>
          <p className="mt-1 text-sm text-gray-400">
            {groups.length === 0 
              ? 'No groups have been created yet.' 
              : 'Try adjusting your search criteria.'}
          </p>
          {onCreateGroup && groups.length === 0 && (
            <div className="mt-6">
              <button
                onClick={onCreateGroup}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl text-white font-medium transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create First Group
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Development Groups */}
          {groupsByLevel[Level.DEVELOPMENT].length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mr-3"></div>
                Development Level ({groupsByLevel[Level.DEVELOPMENT].length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupsByLevel[Level.DEVELOPMENT].map(group => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    onAssignCoach={onAssignCoach}
                    onAssignPlayer={onAssignPlayer}
                    onViewDetails={onViewDetails}
                    onEdit={onEdit}
                    showActions={showActions}
                    isSelectable={isSelectable}
                    isSelected={selectedGroups.includes(group.id)}
                    onSelect={handleGroupSelect}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Advanced Groups */}
          {groupsByLevel[Level.ADVANCED].length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full mr-3"></div>
                Advanced Level ({groupsByLevel[Level.ADVANCED].length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupsByLevel[Level.ADVANCED].map(group => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    onAssignCoach={onAssignCoach}
                    onAssignPlayer={onAssignPlayer}
                    onViewDetails={onViewDetails}
                    onEdit={onEdit}
                    showActions={showActions}
                    isSelectable={isSelectable}
                    isSelected={selectedGroups.includes(group.id)}
                    onSelect={handleGroupSelect}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selection Summary */}
      {isSelectable && selectedGroups.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          {selectedGroups.length} group{selectedGroups.length > 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
}