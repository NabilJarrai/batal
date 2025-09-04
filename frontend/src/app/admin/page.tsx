"use client";

import { useState, useEffect } from 'react';
import GroupList from '@/components/GroupList';
import UserCard from '@/components/UserCard';
import PlayerCard from '@/components/PlayerCard';
import { PlayerAssignmentModal, CoachAssignmentModal } from '@/components/AssignmentModals';
import AutoAssignmentModal from '@/components/AutoAssignmentModal';
import PromotionModal from '@/components/PromotionModal';
import CreatePlayerModal from '@/components/CreatePlayerModal';
import CreateUserModal from '@/components/CreateUserModal';
import CreateGroupModal from '@/components/CreateGroupModal';
import EditUserModal from '@/components/EditUserModal';
import EditPlayerModal from '@/components/EditPlayerModal';
import EditGroupModal from '@/components/EditGroupModal';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import ReassignPlayerModal from '@/components/ReassignPlayerModal';
import ProtectedRoute from '@/components/ProtectedRoute';
import LogoutButton from '@/components/LogoutButton';
import { useAuth } from '@/store/hooks';
import { useNotification } from '@/contexts/NotificationContext';
import { groupsAPI, usersAPI, playersAPI } from '@/lib/api';
import {
  GroupResponse,
  UserResponse,
  PlayerDTO,
  UserType,
  Level
} from '@/types';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();
  
  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'groups' | 'users' | 'players'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [groups, setGroups] = useState<GroupResponse[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [players, setPlayers] = useState<PlayerDTO[]>([]);
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalCoaches: 0,
    totalPlayers: 0,
    activeGroups: 0,
    unassignedPlayers: 0
  });

  // Modals
  const [playerAssignmentModal, setPlayerAssignmentModal] = useState<{
    isOpen: boolean;
    groupId?: number;
    selectedGroup?: GroupResponse;
  }>({ isOpen: false });
  
  const [coachAssignmentModal, setCoachAssignmentModal] = useState<{
    isOpen: boolean;
    groupId?: number;
    selectedGroup?: GroupResponse;
  }>({ isOpen: false });

  const [autoAssignmentModal, setAutoAssignmentModal] = useState(false);
  const [promotionModal, setPromotionModal] = useState<{
    isOpen: boolean;
    playerId: number | null;
  }>({ isOpen: false, playerId: null });

  const [reassignPlayerModal, setReassignPlayerModal] = useState<{
    isOpen: boolean;
    player: PlayerDTO | null;
    currentGroupId: number | null;
    currentGroupName: string;
  }>({ isOpen: false, player: null, currentGroupId: null, currentGroupName: '' });

  // Creation modals
  const [createPlayerModal, setCreatePlayerModal] = useState(false);
  const [createUserModal, setCreateUserModal] = useState(false);
  const [createGroupModal, setCreateGroupModal] = useState(false);

  // Edit modals
  const [editUserModal, setEditUserModal] = useState<{ isOpen: boolean; userId: number | null }>({ isOpen: false, userId: null });
  const [editPlayerModal, setEditPlayerModal] = useState<{ isOpen: boolean; playerId: number | null }>({ isOpen: false, playerId: null });
  const [editGroupModal, setEditGroupModal] = useState<{ isOpen: boolean; groupId: number | null }>({ isOpen: false, groupId: null });

  // Delete confirmation modal
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'user' | 'player' | 'group' | null;
    id: number | null;
    name: string;
    isDeleting: boolean;
  }>({ isOpen: false, type: null, id: null, name: '', isDeleting: false });

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [groupsResponse, usersResponse, playersResponse, playerStatsResponse] = await Promise.all([
        groupsAPI.getAll(),
        usersAPI.getAll(),
        playersAPI.getAll(),
        playersAPI.getStats()
      ]);

      setGroups(groupsResponse);
      setUsers(usersResponse);
      setPlayers(playersResponse.content || playersResponse); // Handle both paginated and non-paginated responses
      
      // Calculate stats
      const coaches = usersResponse.filter(user => 
        user.userType === UserType.COACH || user.roles.includes('COACH')
      );
      const activeGroups = groupsResponse.filter((group: GroupResponse) => group.isActive);
      const unassignedPlayers = playersResponse.content ? 
        playersResponse.content.filter((player: PlayerDTO) => !player.groupId).length :
        playersResponse.filter((player: PlayerDTO) => !player.groupId).length;

      setStats({
        totalGroups: groupsResponse.length,
        totalCoaches: coaches.length,
        totalPlayers: playerStatsResponse.totalActivePlayers || (playersResponse.content?.length || playersResponse.length),
        activeGroups: activeGroups.length,
        unassignedPlayers
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
      showError(errorMessage, 'Dashboard Error');
      setError(errorMessage);
    }
    setLoading(false);
  };

  // Event handlers
  const handleAssignCoach = (groupId: number) => {
    console.log('handleAssignCoach called with groupId:', groupId);
    const group = groups.find(g => g.id === groupId);
    console.log('Found group for coach assignment:', group);
    setCoachAssignmentModal({ isOpen: true, groupId, selectedGroup: group });
  };

  const handleAssignPlayer = (groupId: number) => {
    console.log('handleAssignPlayer called with groupId:', groupId);
    const group = groups.find(g => g.id === groupId);
    console.log('Found group for player assignment:', group);
    setPlayerAssignmentModal({ isOpen: true, groupId, selectedGroup: group });
  };

  const handleCreateGroup = () => {
    setCreateGroupModal(true);
  };

  const handleCreateUser = () => {
    setCreateUserModal(true);
  };

  const handleCreatePlayer = () => {
    setCreatePlayerModal(true);
  };

  const handleAssignmentComplete = async () => {
    console.log('Assignment completed, refreshing dashboard data...');
    try {
      // Add extra delay to ensure database transaction is committed
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Reload data after successful assignment
      await loadDashboardData();
      console.log('Dashboard data refreshed, closing modals...');
      setPlayerAssignmentModal({ isOpen: false });
      setCoachAssignmentModal({ isOpen: false });
      showSuccess('Assignment completed successfully');
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
      showError('Assignment succeeded but failed to refresh data. Please refresh the page.');
    }
  };

  const handlePromotePlayer = (playerId: number) => {
    setPromotionModal({ isOpen: true, playerId });
  };

  const handleRemoveCoach = async (groupId: number) => {
    try {
      await groupsAPI.removeCoach(groupId);
      loadDashboardData(); // Reload data
      showSuccess('Coach removed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove coach';
      showError(errorMessage, 'Remove Coach Error');
    }
  };

  const handleRemovePlayer = async (groupId: number, playerId: number) => {
    try {
      await groupsAPI.removePlayer(groupId, playerId);
      loadDashboardData(); // Reload data
      showSuccess('Player removed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove player';
      showError(errorMessage, 'Remove Player Error');
    }
  };

  const handleReassignPlayer = async (playerId: number, fromGroupId: number, toGroupId: number) => {
    try {
      // First remove from current group
      await groupsAPI.removePlayer(fromGroupId, playerId);
      
      // Then assign to new group
      await groupsAPI.assignPlayer({ playerId, groupId: toGroupId });
      
      loadDashboardData(); // Reload data
      showSuccess('Player reassigned successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reassign player';
      showError(errorMessage, 'Reassign Player Error');
    }
  };

  const handleOpenReassignModal = (playerId: number) => {
    const player = players.find(p => p.id === playerId);
    const currentGroup = groups.find(g => g.id === player?.groupId);
    
    if (player && currentGroup) {
      setReassignPlayerModal({
        isOpen: true,
        player,
        currentGroupId: currentGroup.id,
        currentGroupName: currentGroup.name
      });
    }
  };

  const handleReassignModalConfirm = async (newGroupId: number) => {
    if (reassignPlayerModal.player && reassignPlayerModal.currentGroupId) {
      await handleReassignPlayer(
        reassignPlayerModal.player.id!,
        reassignPlayerModal.currentGroupId,
        newGroupId
      );
      setReassignPlayerModal({ isOpen: false, player: null, currentGroupId: null, currentGroupName: '' });
    }
  };

  // Edit handlers
  const handleEditUser = (userId: number) => {
    setEditUserModal({ isOpen: true, userId });
  };

  const handleEditPlayer = (playerId: number) => {
    setEditPlayerModal({ isOpen: true, playerId });
  };

  const handleEditGroup = (groupId: number) => {
    setEditGroupModal({ isOpen: true, groupId });
  };

  // Delete handlers
  const handleDeleteUser = (userId: number) => {
    const user = users.find(u => u.id === userId);
    setDeleteModal({
      isOpen: true,
      type: 'user',
      id: userId,
      name: user ? `${user.firstName} ${user.lastName}` : 'User',
      isDeleting: false
    });
  };

  const handleDeletePlayer = (playerId: number) => {
    const player = players.find(p => p.id === playerId);
    setDeleteModal({
      isOpen: true,
      type: 'player',
      id: playerId,
      name: player ? `${player.firstName} ${player.lastName}` : 'Player',
      isDeleting: false
    });
  };

  const handleDeleteGroup = (groupId: number) => {
    const group = groups.find(g => g.id === groupId);
    setDeleteModal({
      isOpen: true,
      type: 'group',
      id: groupId,
      name: group ? group.name : 'Group',
      isDeleting: false
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id || !deleteModal.type) return;
    
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    
    try {
      switch (deleteModal.type) {
        case 'user':
          await usersAPI.delete(deleteModal.id);
          break;
        case 'player':
          await playersAPI.delete(deleteModal.id);
          break;
        case 'group':
          await groupsAPI.delete(deleteModal.id);
          break;
      }
      
      loadDashboardData(); // Reload data
      setDeleteModal({ isOpen: false, type: null, id: null, name: '', isDeleting: false });
      showSuccess(`${deleteModal.type?.charAt(0).toUpperCase()}${deleteModal.type?.slice(1)} deleted successfully`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to delete ${deleteModal.type}`;
      showError(errorMessage, 'Delete Error');
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  // Status update handlers
  const handleUserStatusUpdate = async (userId: number, isActive: boolean, reason?: string) => {
    try {
      await usersAPI.updateStatus(userId, { isActive, reason });
      loadDashboardData();
      showSuccess(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user status';
      showError(errorMessage, 'Status Update Error');
    }
  };

  const handlePlayerDeactivate = async (playerId: number, reason: string) => {
    try {
      await playersAPI.deactivate(playerId, reason);
      loadDashboardData();
      showSuccess('Player deactivated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to deactivate player';
      showError(errorMessage, 'Player Deactivation Error');
    }
  };

  const handlePlayerReactivate = async (playerId: number) => {
    try {
      await playersAPI.reactivate(playerId);
      loadDashboardData();
      showSuccess('Player reactivated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reactivate player';
      showError(errorMessage, 'Player Reactivation Error');
    }
  };

  const handleAutoAssignmentComplete = async () => {
    console.log('Auto-assignment completed, refreshing dashboard data...');
    setAutoAssignmentModal(false);
    await loadDashboardData();
    showSuccess('Auto-assignment completed successfully');
  };

  const handlePromotionComplete = async () => {
    console.log('Promotion completed, refreshing dashboard data...');
    setPromotionModal({ isOpen: false, playerId: null });
    await loadDashboardData();
    showSuccess('Player promotion completed successfully');
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
            <div className="bg-white/10 rounded-xl p-6 h-96"></div>
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
            onClick={loadDashboardData}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
              <p className="text-blue-200">Manage users, groups, and academy operations</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-blue-200">Welcome back,</p>
                <p className="text-white font-semibold">{user?.email || 'Admin'}</p>
              </div>
              <LogoutButton />
            </div>
          </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm font-medium">Total Groups</p>
                <p className="text-2xl font-bold text-white">{stats.totalGroups}</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-full">
                <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-blue-300 mt-2">{stats.activeGroups} active groups</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm font-medium">Total Coaches</p>
                <p className="text-2xl font-bold text-white">{stats.totalCoaches}</p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-full">
                <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a4 4 0 100 8 4 4 0 000-8zM8 14a6 6 0 00-6 6 2 2 0 002 2h12a2 2 0 002-2 6 6 0 00-6-6H8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-blue-300 mt-2">Available for assignment</p>
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
            <p className="text-xs text-blue-300 mt-2">{stats.unassignedPlayers} unassigned</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm font-medium">Quick Actions</p>
                <p className="text-sm font-medium text-white">Management</p>
              </div>
              <div className="p-3 bg-yellow-500/20 rounded-full">
                <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="space-y-2 mt-2">
              <div className="flex gap-1">
                <button
                  onClick={handleCreateGroup}
                  className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded text-xs text-blue-200"
                >
                  Group
                </button>
                <button
                  onClick={handleCreateUser}
                  className="px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 rounded text-xs text-purple-200"
                >
                  User
                </button>
                <button
                  onClick={handleCreatePlayer}
                  className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 rounded text-xs text-green-200"
                >
                  Player
                </button>
              </div>
              {stats.unassignedPlayers > 0 && (
                <button
                  onClick={() => setAutoAssignmentModal(true)}
                  className="w-full px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 rounded text-xs text-cyan-200 flex items-center justify-center gap-1"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Auto-Assign ({stats.unassignedPlayers})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-1 mb-8">
          <div className="flex space-x-1">
            {[
              { key: 'overview', label: 'Overview', icon: '📊' },
              { key: 'groups', label: 'Groups', icon: '👥' },
              { key: 'users', label: 'Users', icon: '🧑‍💼' },
              { key: 'players', label: 'Players', icon: '⚽' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'overview' | 'groups' | 'users' | 'players')}
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

        {/* Tab Content */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Academy Overview</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Groups */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Recent Groups</h3>
                  <div className="space-y-3">
                    {groups.slice(0, 3).map((group) => (
                      <div key={group.id} className="bg-white/5 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">{group.name}</p>
                            <p className="text-sm text-blue-200">
                              {group.currentPlayerCount}/{group.capacity} players
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-blue-200">{group.level}</p>
                            {!group.coach && (
                              <button
                                onClick={() => handleAssignCoach(group.id)}
                                className="text-xs bg-yellow-500/20 hover:bg-yellow-500/30 px-2 py-1 rounded text-yellow-200"
                              >
                                Assign Coach
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Users */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Recent Staff</h3>
                  <div className="space-y-3">
                    {users.slice(0, 3).map((user) => (
                      <div key={user.id} className="bg-white/5 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-sm text-blue-200">{user.userType || 'Staff'}</p>
                          </div>
                          <div className={`
                            w-2 h-2 rounded-full 
                            ${user.isActive ? 'bg-green-400' : 'bg-red-400'}
                          `} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'groups' && (
            <GroupList
              groups={groups}
              onAssignCoach={handleAssignCoach}
              onAssignPlayer={handleAssignPlayer}
              onRemoveCoach={handleRemoveCoach}
              onRemovePlayer={handleRemovePlayer}
              onUnassignPlayer={handleRemovePlayer}
              onReassignPlayer={handleReassignPlayer}
              onEdit={handleEditGroup}
              onDelete={handleDeleteGroup}
              onCreateGroup={handleCreateGroup}
              showActions={true}
            />
          )}

          {activeTab === 'users' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Staff Management</h2>
                <button
                  onClick={handleCreateUser}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg text-white font-medium transition-all duration-200"
                >
                  Add Staff Member
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    onEdit={handleEditUser}
                    onDeactivate={(userId) => handleUserStatusUpdate(userId, false, 'Deactivated by admin')}
                    onActivate={(userId) => handleUserStatusUpdate(userId, true)}
                    showActions={true}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'players' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Player Management</h2>
                <button
                  onClick={handleCreatePlayer}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg text-white font-medium transition-all duration-200"
                >
                  Add Player
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {players.map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    onEdit={handleEditPlayer}
                    onDeactivate={handlePlayerDeactivate}
                    onReactivate={handlePlayerReactivate}
                    showActions={true}
                    onAssignGroup={player.groupId ? undefined : () => handleAssignPlayer(0)}
                    onPromote={player.level === Level.DEVELOPMENT ? () => handlePromotePlayer(player.id!) : undefined}
                    onUnassignGroup={player.groupId ? (playerId) => handleRemovePlayer(player.groupId!, playerId) : undefined}
                    onReassignGroup={player.groupId ? handleOpenReassignModal : undefined}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Assignment Modals */}
        <PlayerAssignmentModal
          isOpen={playerAssignmentModal.isOpen}
          onClose={() => setPlayerAssignmentModal({ isOpen: false })}
          groupId={playerAssignmentModal.groupId}
          selectedGroup={playerAssignmentModal.selectedGroup}
          onAssignmentComplete={handleAssignmentComplete}
        />

        <CoachAssignmentModal
          isOpen={coachAssignmentModal.isOpen}
          onClose={() => setCoachAssignmentModal({ isOpen: false })}
          groupId={coachAssignmentModal.groupId}
          selectedGroup={coachAssignmentModal.selectedGroup}
          onAssignmentComplete={handleAssignmentComplete}
        />

        <AutoAssignmentModal
          isOpen={autoAssignmentModal}
          onClose={() => setAutoAssignmentModal(false)}
          onComplete={handleAutoAssignmentComplete}
        />

        <PromotionModal
          isOpen={promotionModal.isOpen}
          playerId={promotionModal.playerId}
          onClose={() => setPromotionModal({ isOpen: false, playerId: null })}
          onComplete={handlePromotionComplete}
        />

        {/* Creation Modals */}
        <CreatePlayerModal
          isOpen={createPlayerModal}
          onClose={() => setCreatePlayerModal(false)}
          onComplete={() => {
            setCreatePlayerModal(false);
            loadDashboardData();
            showSuccess('Player created successfully');
          }}
        />

        <CreateUserModal
          isOpen={createUserModal}
          onClose={() => setCreateUserModal(false)}
          onComplete={() => {
            setCreateUserModal(false);
            loadDashboardData();
            showSuccess('User created successfully');
          }}
        />

        <CreateGroupModal
          isOpen={createGroupModal}
          onClose={() => setCreateGroupModal(false)}
          onComplete={() => {
            setCreateGroupModal(false);
            loadDashboardData();
            showSuccess('Group created successfully');
          }}
        />

        {/* Edit Modals */}
        <EditUserModal
          isOpen={editUserModal.isOpen}
          userId={editUserModal.userId}
          onClose={() => setEditUserModal({ isOpen: false, userId: null })}
          onComplete={() => {
            loadDashboardData();
            showSuccess('User updated successfully');
          }}
        />

        <EditPlayerModal
          isOpen={editPlayerModal.isOpen}
          playerId={editPlayerModal.playerId}
          onClose={() => setEditPlayerModal({ isOpen: false, playerId: null })}
          onComplete={() => {
            loadDashboardData();
            showSuccess('Player updated successfully');
          }}
        />

        <EditGroupModal
          isOpen={editGroupModal.isOpen}
          groupId={editGroupModal.groupId}
          onClose={() => setEditGroupModal({ isOpen: false, groupId: null })}
          onComplete={() => {
            loadDashboardData();
            showSuccess('Group updated successfully');
          }}
        />

        {/* Reassign Player Modal */}
        <ReassignPlayerModal
          isOpen={reassignPlayerModal.isOpen}
          onClose={() => setReassignPlayerModal({ isOpen: false, player: null, currentGroupId: null, currentGroupName: '' })}
          onConfirm={handleReassignModalConfirm}
          player={reassignPlayerModal.player}
          currentGroupId={reassignPlayerModal.currentGroupId || 0}
          currentGroupName={reassignPlayerModal.currentGroupName}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, type: null, id: null, name: '', isDeleting: false })}
          onConfirm={confirmDelete}
          title={`Delete ${deleteModal.type ? deleteModal.type.charAt(0).toUpperCase() + deleteModal.type.slice(1) : ''}`}
          message={`Are you sure you want to delete this ${deleteModal.type}? This action cannot be undone.`}
          itemName={deleteModal.name}
          isLoading={deleteModal.isDeleting}
        />
      </div>
    </div>
    </ProtectedRoute>
  );
}