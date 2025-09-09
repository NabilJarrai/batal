"use client";

import { useState, useEffect } from 'react';
import GroupCard from '@/components/GroupCard';
import PlayerCard from '@/components/PlayerCard';
import ProtectedRoute from '@/components/ProtectedRoute';
import LogoutButton from '@/components/LogoutButton';
import { AssessmentManagement } from '@/components/assessments/AssessmentManagement';
import { useAuth } from '@/store/hooks';
import { groupsAPI, playersAPI, usersAPI } from '@/lib/api';
import { GroupResponse, PlayerDTO, UserResponse } from '@/types';

export default function CoachDashboard() {
  const { user } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'groups' | 'players' | 'assessments'>('groups');
  
  // Data
  const [currentCoach, setCurrentCoach] = useState<UserResponse | null>(null);
  const [assignedGroups, setAssignedGroups] = useState<GroupResponse[]>([]);
  const [allPlayers, setAllPlayers] = useState<PlayerDTO[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupResponse | null>(null);

  // Computed values
  const groupPlayers = selectedGroup 
    ? allPlayers.filter(player => player.groupId === selectedGroup.id)
    : [];

  const stats = {
    totalGroups: assignedGroups.length,
    totalPlayers: allPlayers.length,
    averageGroupSize: assignedGroups.length > 0 
      ? Math.round(assignedGroups.reduce((acc, g) => acc + g.currentPlayerCount, 0) / assignedGroups.length)
      : 0,
    developmentPlayers: allPlayers.filter(p => p.level === 'DEVELOPMENT').length,
    advancedPlayers: allPlayers.filter(p => p.level === 'ADVANCED').length,
  };

  // Load initial data
  useEffect(() => {
    loadCoachData();
  }, []);

  const loadCoachData = async () => {
    setLoading(true);
    try {
      // Get current coach info (in a real app, this would come from auth context)
      const currentUserResponse = await usersAPI.getCurrentUser();
      setCurrentCoach(currentUserResponse);

      // Get groups assigned to this coach
      const coachGroups = await groupsAPI.getCoachGroups(currentUserResponse.id);
      setAssignedGroups(coachGroups);
      
      if (coachGroups.length > 0) {
        setSelectedGroup(coachGroups[0]);
        
        // Get all players from coach's groups
        const allGroupPlayers: PlayerDTO[] = [];
        for (const group of coachGroups) {
          const groupPlayers = await playersAPI.getByGroup(group.id);
          allGroupPlayers.push(...groupPlayers);
        }
        setAllPlayers(allGroupPlayers);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coach data');
    }
    setLoading(false);
  };

  const handleGroupSelect = (groupId: number) => {
    const group = assignedGroups.find(g => g.id === groupId);
    if (group) {
      setSelectedGroup(group);
    }
  };

  const handleViewPlayerDetails = (playerId: number) => {
    // TODO: Implement player details view
    console.log('View player details:', playerId);
  };

  const handleCreateAssessment = () => {
    setActiveTab('assessments');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-white/20 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/10 rounded-xl p-6">
                  <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-white/20 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700 flex items-center justify-center p-6">
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 max-w-md w-full">
          <h2 className="text-xl font-semibold text-white mb-2">Error Loading Dashboard</h2>
          <p className="text-red-200 mb-4">{error}</p>
          <button
            onClick={loadCoachData}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['COACH', 'ADMIN']}>
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Coach Dashboard</h1>
              <p className="text-blue-200">
                Welcome back, {currentCoach?.firstName} {currentCoach?.lastName}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-blue-200">Logged in as</p>
                <p className="text-white font-semibold">{user?.email || 'Coach'}</p>
              </div>
              <LogoutButton />
            </div>
          </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm font-medium">My Groups</p>
                <p className="text-2xl font-bold text-white">{stats.totalGroups}</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-full">
                <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm font-medium">Total Players</p>
                <p className="text-2xl font-bold text-white">{stats.totalPlayers}</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-full">
                <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm font-medium">Avg Group Size</p>
                <p className="text-2xl font-bold text-white">{stats.averageGroupSize}</p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-full">
                <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm font-medium">Development</p>
                <p className="text-2xl font-bold text-white">{stats.developmentPlayers}</p>
              </div>
              <div className="p-3 bg-cyan-500/20 rounded-full">
                <svg className="w-6 h-6 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm font-medium">Advanced</p>
                <p className="text-2xl font-bold text-white">{stats.advancedPlayers}</p>
              </div>
              <div className="p-3 bg-yellow-500/20 rounded-full">
                <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-1 mb-8">
          <div className="flex space-x-1">
            {[
              { key: 'groups', label: 'My Groups', icon: '👥' },
              { key: 'players', label: 'My Players', icon: '⚽' },
              { key: 'assessments', label: 'Assessments', icon: '📊' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200
                  ${activeTab === tab.key
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-blue-200 hover:text-white hover:bg-white/10'
                  }
                `}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          {activeTab === 'groups' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">My Assigned Groups</h2>
              
              {assignedGroups.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-300">No groups assigned</h3>
                  <p className="mt-1 text-sm text-gray-400">
                    You haven't been assigned to any groups yet. Please contact your administrator.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {assignedGroups.map((group) => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      onViewDetails={() => handleGroupSelect(group.id)}
                      showActions={false}
                      isSelected={selectedGroup?.id === group.id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'players' && (
            <div>
              {/* Group Selector */}
              {assignedGroups.length > 1 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-blue-200 mb-2">
                    Select Group
                  </label>
                  <select
                    value={selectedGroup?.id || ''}
                    onChange={(e) => handleGroupSelect(Number(e.target.value))}
                    className="w-full md:w-64 px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    {assignedGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name} ({group.currentPlayerCount} players)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <h2 className="text-xl font-semibold text-white mb-4">
                {selectedGroup ? `Players in ${selectedGroup.name}` : 'All My Players'}
              </h2>

              {groupPlayers.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-300">No players in this group</h3>
                  <p className="mt-1 text-sm text-gray-400">
                    Players will appear here once they are assigned to this group.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupPlayers.map((player) => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      onViewDetails={handleViewPlayerDetails}
                      showActions={false}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'assessments' && (
            <AssessmentManagement />
          )}
        </div>

        {/* Quick Actions */}
        {selectedGroup && (
          <div className="mt-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="flex items-center gap-3 p-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition-colors duration-200">
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <div className="text-left">
                  <p className="text-sm font-medium text-white">Schedule Practice</p>
                  <p className="text-xs text-blue-200">Set up training sessions</p>
                </div>
              </button>

              <button className="flex items-center gap-3 p-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg transition-colors duration-200">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <div className="text-left">
                  <p className="text-sm font-medium text-white">Send Message</p>
                  <p className="text-xs text-green-200">Contact parents</p>
                </div>
              </button>

              <button className="flex items-center gap-3 p-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg transition-colors duration-200">
                <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 100 4h2a2 2 0 100-4h-.5a1 1 0 000-2H8a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2h-2.5a1 1 0 000 2H14v11H8V5z" clipRule="evenodd" />
                </svg>
                <div className="text-left">
                  <p className="text-sm font-medium text-white">View Reports</p>
                  <p className="text-xs text-purple-200">Group progress reports</p>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </ProtectedRoute>
  );
}