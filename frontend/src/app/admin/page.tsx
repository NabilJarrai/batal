"use client";

import { useState, useEffect, useCallback } from 'react';
import { ResponsiveTabs } from '@/components/responsive';
import GroupList from '@/components/GroupList';
import UserCard from '@/components/UserCard';
import PlayerCard from '@/components/PlayerCard';
import { PlayerAssignmentModal, CoachAssignmentModal } from '@/components/AssignmentModals';
import AutoAssignmentModal from '@/components/AutoAssignmentModal';
import GroupOverCapacityModal from '@/components/GroupOverCapacityModal';
import AssignAssessmentModal from '@/components/AssignAssessmentModal';
import GroupPlayersModal from '@/components/GroupPlayersModal';
import PromotionModal from '@/components/PromotionModal';
import CreatePlayerModal from '@/components/CreatePlayerModal';
import CreateUserModal from '@/components/CreateUserModal';
import CreateGroupModal from '@/components/CreateGroupModal';
import EditUserModal from '@/components/EditUserModal';
import EditPlayerModal from '@/components/EditPlayerModal';
import EditGroupModal from '@/components/EditGroupModal';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import ResetPasswordModal from '@/components/ResetPasswordModal';
import ReassignPlayerModal from '@/components/ReassignPlayerModal';
import SkillsManagement from '@/components/skills/SkillsManagement';
import AssessmentTemplateManagement from '@/components/assessments/AssessmentTemplateManagement';
import ProtectedRoute from '@/components/ProtectedRoute';
import LogoutButton from '@/components/LogoutButton';
import { useAuth } from '@/store/hooks';
import { useNotification } from '@/contexts/NotificationContext';
import { groupsAPI, usersAPI, playersAPI, authAPI, settingsAPI } from '@/lib/api';
import {
  GroupResponse,
  UserResponse,
  PlayerDTO,
  UserType,
  Level,
  ParentWelcomeEmailSetting,
  BulkWelcomeEmailResponse,
  getParentInviteStatus
} from '@/types';


const ADMIN_TABS = ['overview', 'groups', 'users', 'parents', 'players', 'assessments', 'skills', 'settings'] as const;
type AdminTab = (typeof ADMIN_TABS)[number];

/** The tab named in the URL hash, or Overview when it is missing or unknown. */
function readTabFromUrl(): AdminTab {
  if (typeof window === 'undefined') return 'overview';
  const hash = window.location.hash.replace('#', '');
  return (ADMIN_TABS as readonly string[]).includes(hash) ? (hash as AdminTab) : 'overview';
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();
  
  // State
  const [activeTab, setActiveTabState] = useState<AdminTab>(() => readTabFromUrl());

  // Mirrored into the URL hash so the tab survives a remount, a refresh, or a
  // shared link, instead of silently snapping back to Overview.
  const setActiveTab = useCallback((tab: AdminTab) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${tab}`);
    }
  }, []);

  // The hash also changes on back/forward.
  useEffect(() => {
    const syncFromUrl = () => setActiveTabState(readTabFromUrl());
    window.addEventListener('hashchange', syncFromUrl);
    return () => window.removeEventListener('hashchange', syncFromUrl);
  }, []);
  const [loading, setLoading] = useState(true);

  // Data. `users` is academy staff only; parents are listed separately.
  const [groups, setGroups] = useState<GroupResponse[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [parents, setParents] = useState<UserResponse[]>([]);
  const [players, setPlayers] = useState<PlayerDTO[]>([]);
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalCoaches: 0,
    totalPlayers: 0,
    activeGroups: 0,
    unassignedPlayers: 0
  });

  // Pagination and search state
  const [usersPagination, setUsersPagination] = useState({
    page: 0,
    size: 12,
    totalElements: 0,
    totalPages: 0,
    sortBy: 'firstName',
    sortDir: 'asc',
    search: ''
  });

  const [parentsPagination, setParentsPagination] = useState({
    page: 0,
    size: 12,
    totalElements: 0,
    totalPages: 0,
    sortBy: 'firstName',
    sortDir: 'asc',
    search: ''
  });

  // Welcome email state for the Parents tab.
  //
  // While welcomeEmailsEnabled is false, new parent accounts are created
  // without their setup email - which is the point during an intake, when the
  // academy is still empty and an invitation would lead somewhere with nothing
  // in it. Those parents accumulate as "not invited" and are sent their
  // invitations here, together, once there is something worth seeing.
  const [welcomeEmailSetting, setWelcomeEmailSetting] = useState<ParentWelcomeEmailSetting | null>(null);
  const [isSavingWelcomeEmailSetting, setIsSavingWelcomeEmailSetting] = useState(false);
  const [selectedParentIds, setSelectedParentIds] = useState<Set<number>>(new Set());
  const [isSendingWelcomeEmails, setIsSendingWelcomeEmails] = useState(false);
  const [isSendingPasswordResets, setIsSendingPasswordResets] = useState(false);

  // Deactivated families are kept for history, not day to day work, so the
  // Parents tab hides them until asked. The count is what makes the hidden
  // ones discoverable instead of just absent.
  const [showDeactivatedParents, setShowDeactivatedParents] = useState(false);
  const [deactivatedParentCount, setDeactivatedParentCount] = useState(0);

  const [playersPagination, setPlayersPagination] = useState({
    page: 0,
    size: 12,
    totalElements: 0,
    totalPages: 0,
    sortBy: 'firstName',
    sortDir: 'asc',
    search: ''
  });

  // Modals
  const [playerAssignmentModal, setPlayerAssignmentModal] = useState<{
    isOpen: boolean;
    groupId?: number;
    selectedGroup?: GroupResponse;
    selectedPlayer?: PlayerDTO;
    playerPreSelected?: boolean;
  }>({ isOpen: false });
  
  const [coachAssignmentModal, setCoachAssignmentModal] = useState<{
    isOpen: boolean;
    groupId?: number;
    selectedGroup?: GroupResponse;
  }>({ isOpen: false });

  // Offered when an assignment lands on a group that is already at its limit.
  const [overCapacityModal, setOverCapacityModal] = useState<{
    isOpen: boolean;
    group: GroupResponse | null;
    player: PlayerDTO | null;
  }>({ isOpen: false, group: null, player: null });

  const [assignAssessmentModal, setAssignAssessmentModal] = useState<{
    isOpen: boolean;
    group: GroupResponse | null;
  }>({ isOpen: false, group: null });

  const [groupPlayersModal, setGroupPlayersModal] = useState<{
    isOpen: boolean;
    group: GroupResponse | null;
  }>({ isOpen: false, group: null });

  const [autoAssignmentModal, setAutoAssignmentModal] = useState(false);
  const [autoAssignRefreshTrigger, setAutoAssignRefreshTrigger] = useState(0);
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

  // Creation modals. createPlayerModal.parent is set when the flow starts from
  // a parent's card, which fixes the parent instead of asking for one.
  const [createPlayerModal, setCreatePlayerModal] = useState<{
    isOpen: boolean;
    parent: UserResponse | null;
    mode: 'create' | 'edit';
  }>({ isOpen: false, parent: null, mode: 'create' });
  const [createUserModal, setCreateUserModal] = useState(false);
  const [createGroupModal, setCreateGroupModal] = useState(false);

  // Edit modals
  const [editUserModal, setEditUserModal] = useState<{ isOpen: boolean; userId: number | null }>({ isOpen: false, userId: null });
  const [resetPasswordModal, setResetPasswordModal] = useState<{ isOpen: boolean; userId: number | null }>({ isOpen: false, userId: null });
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
      // Load groups and basic data
      const [groupsResponse, usersResponse, parentsResponse, playersResponse, playerStatsResponse] = await Promise.all([
        groupsAPI.getAll(),
        usersAPI.getAll(0, 12), // Initial page
        usersAPI.getParents(0, 12), // Initial page
        playersAPI.getAll(0, 12), // Initial page
        playersAPI.getStats()
      ]);

      setGroups(groupsResponse);
      setUsers(usersResponse.content);
      setParents(parentsResponse.content);
      setPlayers(playersResponse.content);

      // Update pagination state
      setUsersPagination(prev => ({
        ...prev,
        totalElements: usersResponse.totalElements,
        totalPages: usersResponse.totalPages
      }));

      setParentsPagination(prev => ({
        ...prev,
        totalElements: parentsResponse.totalElements,
        totalPages: parentsResponse.totalPages
      }));

      setPlayersPagination(prev => ({
        ...prev,
        totalElements: playersResponse.totalElements,
        totalPages: playersResponse.totalPages
      }));
      
      // Calculate stats
      const activeGroups = groupsResponse.filter((group: GroupResponse) => group.isActive);
      const coaches = usersResponse.content.filter(user => 
        user.userType === UserType.COACH || user.roles.includes('COACH')
      );
      const unassignedPlayers = playersResponse.content.filter((player: PlayerDTO) => !player.groupId).length;

      setStats({
        totalGroups: groupsResponse.length,
        totalCoaches: coaches.length,
        totalPlayers: playerStatsResponse.totalActivePlayers || playersResponse.totalElements,
        activeGroups: activeGroups.length,
        unassignedPlayers
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
      showError(errorMessage, 'Dashboard Error');
    }
    setLoading(false);
  };

  const loadUsersData = useCallback(async () => {
    try {
      const response = await usersAPI.getAll(
        usersPagination.page,
        usersPagination.size,
        usersPagination.sortBy,
        usersPagination.sortDir,
        usersPagination.search || undefined
      );
      
      setUsers(response.content);
      setUsersPagination(prev => ({
        ...prev,
        totalElements: response.totalElements,
        totalPages: response.totalPages
      }));
      
      // Update coaches count in stats
      const coaches = response.content.filter(user => 
        user.userType === UserType.COACH || user.roles.includes('COACH')
      );
      
      setStats(prev => ({
        ...prev,
        totalCoaches: coaches.length
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load users data';
      showError(errorMessage, 'Users Data Error');
    }
  }, [usersPagination.page, usersPagination.size, usersPagination.sortBy, usersPagination.sortDir, usersPagination.search, showError]);

  // Groups carry their assigned assessment template, so anything that changes
  // templates or assignments needs them re-read.
  const loadGroupsData = useCallback(async () => {
    try {
      setGroups(await groupsAPI.getAll());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load groups';
      showError(errorMessage, 'Groups Data Error');
    }
  }, [showError]);

  const loadParentsData = useCallback(async () => {
    try {
      const [response, deactivated] = await Promise.all([
        usersAPI.getParents(
          parentsPagination.page,
          parentsPagination.size,
          parentsPagination.sortBy,
          parentsPagination.sortDir,
          parentsPagination.search || undefined,
          showDeactivatedParents
        ),
        usersAPI.getDeactivatedParentCount(),
      ]);

      setParents(response.content);
      setDeactivatedParentCount(deactivated.count);
      setParentsPagination(prev => ({
        ...prev,
        totalElements: response.totalElements,
        totalPages: response.totalPages
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load parents data';
      showError(errorMessage, 'Parents Data Error');
    }
  }, [parentsPagination.page, parentsPagination.size, parentsPagination.sortBy, parentsPagination.sortDir, parentsPagination.search, showDeactivatedParents, showError]);

  const loadPlayersData = useCallback(async () => {
    try {
      const response = await playersAPI.getAll(
        playersPagination.page,
        playersPagination.size,
        playersPagination.sortBy,
        playersPagination.sortDir,
        playersPagination.search || undefined
      );
      
      setPlayers(response.content);
      setPlayersPagination(prev => ({
        ...prev,
        totalElements: response.totalElements,
        totalPages: response.totalPages
      }));
      
      // Update unassigned players count
      const unassignedPlayers = response.content.filter((player: PlayerDTO) => !player.groupId).length;
      setStats(prev => ({
        ...prev,
        unassignedPlayers
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load players data';
      showError(errorMessage, 'Players Data Error');
    }
  }, [playersPagination.page, playersPagination.size, playersPagination.sortBy, playersPagination.sortDir, playersPagination.search, showError]);

  // Reload users when pagination/search changes
  useEffect(() => {
    if (loading) return; // Don't load during initial load
    loadUsersData();
  }, [loading, loadUsersData]);

  // Reload parents when pagination/search changes
  useEffect(() => {
    if (loading) return; // Don't load during initial load
    loadParentsData();
  }, [loading, loadParentsData]);

  // Reload players when pagination/search changes
  useEffect(() => {
    if (loading) return; // Don't load during initial load
    loadPlayersData();
  }, [loading, loadPlayersData]);

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

  const handleAssignPlayerFromCard = (player: PlayerDTO) => {
    console.log('handleAssignPlayerFromCard called with player:', player);
    setPlayerAssignmentModal({ 
      isOpen: true, 
      selectedPlayer: player,
      playerPreSelected: true
    });
  };

  const handleCreateGroup = () => {
    setCreateGroupModal(true);
  };

  const handleCreateUser = () => {
    setCreateUserModal(true);
  };

  const handleCreatePlayer = () => {
    setCreatePlayerModal({ isOpen: true, parent: null, mode: 'create' });
  };

  const handleAssignmentComplete = async (assignedId: number, groupId: number) => {
    console.log('Assignment completed, updating specific group...', { assignedId, groupId });
    try {
      // Add small delay to ensure database transaction is committed
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Determine if this is a player assignment by checking which modal is open
      const isPlayerAssignment = playerAssignmentModal.isOpen;
      const isCoachAssignment = coachAssignmentModal.isOpen;
      
      // Handle auto-assignment case (groupId = -1) by refreshing all groups and players
      if (groupId === -1) {
        console.log('Auto-assignment detected, refreshing all groups and players...');
        const updatedGroups = await groupsAPI.getAll();
        setGroups(updatedGroups);
        
        // Also refresh players data for auto-assignment since it could affect multiple players
        if (isPlayerAssignment) {
          loadPlayersData();
        }
      } else {
        // Fetch only the updated group data instead of reloading everything
        const updatedGroup = await groupsAPI.getById(groupId);
        
        // Update only the specific group in the state to preserve sorting and avoid full page refresh
        setGroups(prevGroups => 
          prevGroups.map(group => 
            group.id === groupId ? updatedGroup : group
          )
        );
        
        // If this is a player assignment, also update the player's groupId in players state
        if (isPlayerAssignment) {
          console.log('Updating player groupId in players state...', { playerId: assignedId, groupId });
          setPlayers(prevPlayers =>
            prevPlayers.map(player =>
              player.id === assignedId
                ? { ...player, groupId: groupId, groupName: updatedGroup.name }
                : player
            )
          );
          
          // Trigger refresh of auto-assignment modal data since unassigned players changed
          setAutoAssignRefreshTrigger(prev => prev + 1);
        }
        
        console.log(`${isPlayerAssignment ? 'Player' : 'Coach'} assignment data updated successfully:`, updatedGroup.name);
      }
      
      setPlayerAssignmentModal({ isOpen: false });
      setCoachAssignmentModal({ isOpen: false });
      showSuccess('Assignment completed successfully');
    } catch (error) {
      console.error('Error updating group data:', error);
      showError('Assignment succeeded but failed to refresh group data. Please refresh the page.');
    }
  };

  const handlePromotePlayer = (playerId: number) => {
    setPromotionModal({ isOpen: true, playerId });
  };

  const handleRemoveCoach = async (groupId: number) => {
    try {
      const updatedGroup = await groupsAPI.removeCoach(groupId);
      
      // Update only the specific group in the state instead of reloading all data
      setGroups(prev => prev.map(group => 
        group.id === groupId ? { ...group, ...updatedGroup } : group
      ));
      
      showSuccess('Coach removed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove coach';
      showError(errorMessage, 'Remove Coach Error');
    }
  };

  const handleRemovePlayer = async (groupId: number, playerId: number) => {
    try {
      const updatedGroup = await groupsAPI.removePlayer(groupId, playerId);
      
      // Update both groups state and players state
      setGroups(prev => prev.map(group => 
        group.id === groupId ? { ...group, ...updatedGroup } : group
      ));
      
      // Remove player from players state or update their groupId
      setPlayers(prev => prev.map(player => 
        player.id === playerId ? { ...player, groupId: undefined, groupName: undefined } : player
      ));
      
      // Trigger refresh of auto-assignment modal data
      setAutoAssignRefreshTrigger(prev => prev + 1);
      
      showSuccess('Player removed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove player';
      showError(errorMessage, 'Remove Player Error');
    }
  };

  const handleReassignPlayer = async (playerId: number, fromGroupId: number, toGroupId: number) => {
    try {
      // First remove from current group
      const updatedFromGroup = await groupsAPI.removePlayer(fromGroupId, playerId);
      
      // Then assign to new group
      const updatedToGroup = await groupsAPI.assignPlayer({ playerId, groupId: toGroupId });
      
      // Update both groups in state
      setGroups(prev => prev.map(group => {
        if (group.id === fromGroupId) {
          return { ...group, ...updatedFromGroup };
        } else if (group.id === toGroupId) {
          return { ...group, ...updatedToGroup };
        }
        return group;
      }));
      
      // Update player's groupId in players state
      setPlayers(prev => prev.map(player => 
        player.id === playerId ? { ...player, groupId: toGroupId } : player
      ));
      
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

  // Staff and parents are held in separate lists but share the same card and
  // handlers, so account lookups have to check both.
  const findAccountById = (userId: number): UserResponse | undefined =>
    users.find(u => u.id === userId) ?? parents.find(p => p.id === userId);

  // Applies an update to whichever list holds the account. The other list has
  // no matching id, so its map is a no-op.
  const updateAccountInLists = (updated: UserResponse) => {
    setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
    setParents(prev => prev.map(p => (p.id === updated.id ? updated : p)));
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

  // Resend setup email handler
  const handleResendSetupEmail = async (userId: number) => {
    try {
      const user = findAccountById(userId);
      await authAPI.resendSetupEmail(userId);
      showSuccess(`Password setup email sent to ${user?.email || 'user'}`);
      // The card's badge and the waiting count both hang off this send, so
      // refresh them rather than leaving the parent looking uninvited.
      await Promise.all([loadParentsData(), loadWelcomeEmailSetting()]);
    } catch (error: any) {
      showError(error.message || 'Failed to send password setup email');
    }
  };

  // ===== Parent welcome emails =====

  const loadWelcomeEmailSetting = useCallback(async () => {
    try {
      setWelcomeEmailSetting(await settingsAPI.getParentWelcomeEmails());
    } catch (error) {
      // Not worth an error toast: the switch is secondary to the list, and the
      // panel simply stays hidden until a later load succeeds.
      console.error('Failed to load the parent welcome email setting', error);
    }
  }, []);

  // Refetched on entering either tab that shows it, so the waiting count is
  // current even if parents were added from elsewhere since the dashboard
  // loaded.
  useEffect(() => {
    if (activeTab === 'parents' || activeTab === 'settings') {
      loadWelcomeEmailSetting();
    }
  }, [activeTab, loadWelcomeEmailSetting]);

  const handleToggleWelcomeEmails = async (enabled: boolean) => {
    setIsSavingWelcomeEmailSetting(true);
    try {
      const updated = await settingsAPI.setParentWelcomeEmails(enabled);
      setWelcomeEmailSetting(updated);
      showSuccess(
        enabled
          ? 'Welcome emails resumed. New parents will be emailed as soon as their account is created.'
          : 'Welcome emails paused. New parents will be created quietly until you resume.'
      );
    } catch (error: any) {
      showError(error.message || 'Failed to update the welcome email setting');
    } finally {
      setIsSavingWelcomeEmailSetting(false);
    }
  };

  const toggleParentSelection = (userId: number) => {
    setSelectedParentIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  /** Parents on this page who have not been invited yet. */
  const uninvitedOnPage = parents.filter(p => getParentInviteStatus(p) === 'not_invited');

  const selectAllUninvitedOnPage = () => {
    setSelectedParentIds(prev => {
      const next = new Set(prev);
      uninvitedOnPage.forEach(p => next.add(p.id));
      return next;
    });
  };

  /**
   * Select every parent still awaiting an invitation, not just the ones on
   * screen. The ids come from the server because an intake will usually run to
   * several pages, and "select all" that quietly meant "this page" would send a
   * fraction of the intake and look like it had sent all of it.
   */
  const selectAllUninvitedEverywhere = async () => {
    try {
      const { userIds } = await usersAPI.getParentsAwaitingWelcomeEmail();
      setSelectedParentIds(new Set(userIds));
      if (userIds.length === 0) {
        showSuccess('Every parent has already been invited.');
      }
    } catch (error: any) {
      showError(error.message || 'Failed to look up parents awaiting an invitation');
    }
  };

  /**
   * Shared by both bulk sends. Delivery happens in the background, so this
   * refetches once immediately for the quick ones and again shortly after for
   * the rest; anything that genuinely failed keeps its old state and can
   * simply be selected again.
   */
  const runBulkSend = async (
    send: (ids: number[]) => Promise<BulkWelcomeEmailResponse>,
    setBusy: (busy: boolean) => void,
    successNote: (count: number) => string,
    failureLabel: string
  ) => {
    const userIds = Array.from(selectedParentIds);
    if (userIds.length === 0) return;

    setBusy(true);
    try {
      const result = await send(userIds);

      if (result.queuedCount > 0) {
        showSuccess(successNote(result.queuedCount));
      }

      if (result.skipped.length > 0) {
        const detail = result.skipped
          .slice(0, 3)
          .map(s => `${s.name} (${s.reason.toLowerCase()})`)
          .join(', ');
        const more = result.skipped.length > 3 ? ` and ${result.skipped.length - 3} more` : '';
        showError(
          `Skipped ${result.skipped.length} of ${userIds.length}: ${detail}${more}`,
          'Some parents were not emailed'
        );
      }

      setSelectedParentIds(new Set());

      await Promise.all([loadParentsData(), loadWelcomeEmailSetting()]);
      setTimeout(() => {
        loadParentsData();
        loadWelcomeEmailSetting();
      }, 4000);
    } catch (error: any) {
      showError(error.message || failureLabel);
    } finally {
      setBusy(false);
    }
  };

  const handleSendWelcomeEmails = () =>
    runBulkSend(
      usersAPI.sendParentWelcomeEmails,
      setIsSendingWelcomeEmails,
      (n) =>
        `Sending welcome emails to ${n} parent${n === 1 ? '' : 's'}. ` +
        'They will show as invited here as the emails go out.',
      'Failed to send welcome emails'
    );

  const handleSendPasswordResets = () =>
    runBulkSend(
      usersAPI.sendParentPasswordResets,
      setIsSendingPasswordResets,
      (n) =>
        `Sending a password reset link to ${n} parent${n === 1 ? '' : 's'}. ` +
        'The link is valid for 48 hours.',
      'Failed to send password resets'
    );

  const handleToggleDeactivatedParents = () => {
    // Back to the first page: the row the admin is looking at will not be in
    // the same position once the hidden families are folded in.
    setShowDeactivatedParents(prev => !prev);
    setParentsPagination(prev => ({ ...prev, page: 0 }));
  };

  // Delete handlers
  const handleDeleteUser = (userId: number) => {
    const user = findAccountById(userId);
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

  // Parent-child management handlers.
  // Players are attached to their parent at creation, so the card creates a
  // player rather than linking an existing one.
  const handleAddPlayerForParent = (userId: number) => {
    const parent = parents.find(u => u.id === userId);
    if (parent) {
      setCreatePlayerModal({ isOpen: true, parent, mode: 'create' });
    }
  };

  // Parents are edited through the same parent-and-players form, not the
  // staff form, which asks for a user type and job title they do not have.
  const handleEditParent = (userId: number) => {
    const parent = parents.find(u => u.id === userId);
    if (parent) {
      setCreatePlayerModal({ isOpen: true, parent, mode: 'edit' });
    }
  };

  const handleUnassignChild = async (parentId: number, playerId: number) => {
    try {
      await usersAPI.unassignChild(parentId, playerId);
      showSuccess('Child unassigned successfully');
      // Refresh the parent data to update the children list
      await loadParentsData();
    } catch (error: any) {
      showError(error.message || 'Failed to unassign child');
    }
  };

  // Helper function to get coach assignment info
  const getCoachAssignmentInfo = (userId: number) => {
    const assignedGroups = groups.filter(group => group.coach?.id === userId);
    return {
      assignedGroupsCount: assignedGroups.length,
      assignedGroupNames: assignedGroups.map(group => group.name)
    };
  };

  const confirmDelete = async () => {
    if (!deleteModal.id || !deleteModal.type) return;
    
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    
    try {
      switch (deleteModal.type) {
        case 'user':
          // Use usersAPI.delete for all users (including coaches)
          await usersAPI.delete(deleteModal.id);

          // Remove the account from whichever list holds it
          setUsers(prev => prev.filter(user => user.id !== deleteModal.id));
          setParents(prev => prev.filter(parent => parent.id !== deleteModal.id));

          // Check if user was a coach and refresh groups to update coach assignments
          const userToDelete = findAccountById(deleteModal.id);
          const isCoach = userToDelete && (
            userToDelete.userType === UserType.COACH ||
            userToDelete.roles.includes('COACH')
          );

          if (isCoach) {
            const updatedGroups = await groupsAPI.getAll();
            setGroups(updatedGroups);
          }
          break;
        case 'player':
          await playersAPI.delete(deleteModal.id);
          // Remove player from state
          setPlayers(prev => prev.filter(player => player.id !== deleteModal.id));
          break;
        case 'group':
          await groupsAPI.delete(deleteModal.id);
          // Remove group from state
          setGroups(prev => prev.filter(group => group.id !== deleteModal.id));
          break;
      }
      
      // Update stats
      const updatedStats = { ...stats };
      if (deleteModal.type === 'user') updatedStats.totalCoaches = Math.max(0, updatedStats.totalCoaches - 1);
      if (deleteModal.type === 'player') updatedStats.totalPlayers = Math.max(0, updatedStats.totalPlayers - 1);
      if (deleteModal.type === 'group') {
        updatedStats.totalGroups = Math.max(0, updatedStats.totalGroups - 1);
        updatedStats.activeGroups = Math.max(0, updatedStats.activeGroups - 1);
      }
      setStats(updatedStats);
      
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
      const updatedUser = await usersAPI.updateStatus(userId, { 
        isActive, 
        inactiveReason: reason 
      });
      
      // Update only the specific user in the state instead of reloading all data
      updateAccountInLists(updatedUser);

      showSuccess(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user status';
      showError(errorMessage, 'Status Update Error');
    }
  };

  const handlePlayerDeactivate = async (playerId: number, reason: string) => {
    try {
      const updatedPlayer = await playersAPI.deactivate(playerId, reason);
      
      // Update only the specific player in the state
      setPlayers(prev => prev.map(player => 
        player.id === playerId ? { ...player, ...updatedPlayer } : player
      ));
      
      showSuccess('Player deactivated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to deactivate player';
      showError(errorMessage, 'Player Deactivation Error');
    }
  };

  const handlePlayerReactivate = async (playerId: number) => {
    try {
      const updatedPlayer = await playersAPI.reactivate(playerId);
      
      // Update only the specific player in the state
      setPlayers(prev => prev.map(player => 
        player.id === playerId ? { ...player, ...updatedPlayer } : player
      ));
      
      showSuccess('Player reactivated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reactivate player';
      showError(errorMessage, 'Player Reactivation Error');
    }
  };

  const handleAutoAssignmentComplete = async () => {
    console.log('Auto-assignment completed, refreshing dashboard data...');
    setAutoAssignmentModal(false);
    
    try {
      // Show immediate feedback
      showSuccess('Auto-assignment completed! Refreshing data...');
      
      // Reload data to ensure consistency after complex multi-player assignments
      await loadDashboardData();
      
      // Trigger refresh of auto-assignment modal data for next time
      setAutoAssignRefreshTrigger(prev => prev + 1);
      
      // Show final success message
      showSuccess('Auto-assignment completed successfully! Players have been assigned to groups.');
    } catch (error) {
      showError('Auto-assignment completed but failed to refresh data. Please refresh the page.');
    }
  };

  const handlePromotionComplete = async () => {
    console.log('Promotion completed, refreshing dashboard data...');
    setPromotionModal({ isOpen: false, playerId: null });
    await loadDashboardData(); // Keep full reload for complex promotion
    showSuccess('Player promotion completed successfully');
  };

  // Group status handlers
  const handleGroupActivate = async (groupId: number) => {
    try {
      const updatedGroup = await groupsAPI.activate(groupId);
      
      // Update only the specific group in the state
      setGroups(prev => prev.map(group => 
        group.id === groupId ? { ...group, ...updatedGroup } : group
      ));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        activeGroups: prev.activeGroups + 1
      }));
      
      showSuccess('Group activated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to activate group';
      showError(errorMessage, 'Group Activation Error');
    }
  };

  const handleGroupDeactivate = async (groupId: number) => {
    try {
      const updatedGroup = await groupsAPI.deactivate(groupId);
      
      // Update only the specific group in the state
      setGroups(prev => prev.map(group => 
        group.id === groupId ? { ...group, ...updatedGroup } : group
      ));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        activeGroups: Math.max(0, prev.activeGroups - 1)
      }));
      
      showSuccess('Group deactivated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to deactivate group';
      showError(errorMessage, 'Group Deactivation Error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-background border border-border shadow-sm rounded-xl p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
            <div className="bg-background border border-border shadow-sm rounded-xl p-6 h-96"></div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">Admin Dashboard</h1>
              <p className="text-sm sm:text-base text-text-secondary">Manage users, groups, and academy operations</p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              <div className="text-right">
                <p className="text-xs sm:text-sm text-text-secondary">Welcome back,</p>
                <p className="text-sm sm:text-base text-text-primary font-semibold truncate max-w-[150px] sm:max-w-none">{user?.email || 'Admin'}</p>
              </div>
              <LogoutButton />
            </div>
          </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-background border border-border shadow-sm rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-text-secondary text-xs sm:text-sm font-medium">Total Groups</p>
                <p className="text-xl sm:text-2xl font-bold text-text-primary">{stats.totalGroups}</p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-500/20 rounded-full flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-text-secondary mt-2">{stats.activeGroups} active groups</p>
          </div>

          <div className="bg-background border border-border shadow-sm rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-text-secondary text-xs sm:text-sm font-medium">Total Coaches</p>
                <p className="text-xl sm:text-2xl font-bold text-text-primary">{stats.totalCoaches}</p>
              </div>
              <div className="p-2 sm:p-3 bg-purple-500/20 rounded-full flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a4 4 0 100 8 4 4 0 000-8zM8 14a6 6 0 00-6 6 2 2 0 002 2h12a2 2 0 002-2 6 6 0 00-6-6H8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-text-secondary mt-2">Available for assignment</p>
          </div>

          <div className="bg-background-modal border border-border rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-text-secondary text-xs sm:text-sm font-medium">Total Players</p>
                <p className="text-xl sm:text-2xl font-bold text-text-primary">{stats.totalPlayers}</p>
              </div>
              <div className="p-2 sm:p-3 bg-green-500/20 rounded-full flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-accent-teal" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-text-secondary mt-2">{stats.unassignedPlayers} unassigned</p>
          </div>

          <div className="bg-background-modal border border-border rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-text-secondary text-xs sm:text-sm font-medium">Quick Actions</p>
                <p className="text-xs sm:text-sm font-medium text-text-primary">Management</p>
              </div>
              <div className="p-2 sm:p-3 bg-yellow-500/20 rounded-full flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-accent-yellow" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="space-y-2 mt-2">
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={handleCreateGroup}
                  className="flex-1 sm:flex-none px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded text-xs text-text-secondary min-w-[60px]"
                >
                  Group
                </button>
                <button
                  onClick={handleCreateUser}
                  className="flex-1 sm:flex-none px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 rounded text-xs text-text-secondary min-w-[60px]"
                >
                  User
                </button>
                <button
                  onClick={handleCreatePlayer}
                  className="flex-1 sm:flex-none px-2 py-1 bg-green-500/20 hover:bg-green-500/30 rounded text-xs text-accent-teal min-w-[60px]"
                >
                  Player
                </button>
              </div>
              {stats.unassignedPlayers > 0 && (
                <button
                  onClick={() => setAutoAssignmentModal(true)}
                  className="w-full px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded text-xs text-text-secondary flex items-center justify-center gap-1 transition-all duration-200 hover:shadow-md"
                  title={`Automatically assign ${stats.unassignedPlayers} unassigned player${stats.unassignedPlayers !== 1 ? 's' : ''} to appropriate groups`}
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
        <ResponsiveTabs
          tabs={[
            { id: 'overview', label: 'Overview', icon: <span>📊</span> },
            { id: 'groups', label: 'Groups', icon: <span>👥</span> },
            { id: 'users', label: 'Staff', icon: <span>🧑‍💼</span> },
            { id: 'parents', label: 'Parents', icon: <span>👪</span> },
            { id: 'players', label: 'Players', icon: <span>⚽</span> },
            { id: 'assessments', label: 'Assessments', icon: <span>📝</span> },
            { id: 'skills', label: 'Skills', icon: <span>🎯</span> },
            { id: 'settings', label: 'Settings', icon: <span>⚙️</span> }
          ]}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as AdminTab)}
          className="mb-6 sm:mb-8"
        />

        {/* Tab Content */}
        <div className="bg-background border border-border shadow-sm rounded-xl p-6">
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-4">Academy Overview</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Groups */}
                <div>
                  <h3 className="text-lg font-medium text-text-primary mb-3">Recent Groups</h3>
                  <div className="space-y-3">
                    {groups.slice(0, 3).map((group) => (
                      <div key={group.id} className="bg-secondary-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-text-primary">{group.name}</p>
                            <p className="text-sm text-text-secondary">
                              {group.currentPlayerCount}/{group.capacity} players
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-text-secondary">{group.level}</p>
                            {!group.coach && (
                              <button
                                onClick={() => handleAssignCoach(group.id)}
                                className="text-xs bg-yellow-500/20 hover:bg-yellow-500/30 px-2 py-1 rounded text-accent-yellow"
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
                  <h3 className="text-lg font-medium text-text-primary mb-3">Recent Staff</h3>
                  <div className="space-y-3">
                    {users.slice(0, 3).map((user) => (
                      <div key={user.id} className="bg-secondary-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-text-primary">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-sm text-text-secondary">{user.userType || 'Staff'}</p>
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
              onViewPlayers={(groupId) => {
                const group = groups.find(g => g.id === groupId);
                if (group) setGroupPlayersModal({ isOpen: true, group });
              }}
              onAssignAssessment={(groupId) => {
                const group = groups.find(g => g.id === groupId);
                if (group) setAssignAssessmentModal({ isOpen: true, group });
              }}
              onEdit={handleEditGroup}
              onDelete={handleDeleteGroup}
              onCreateGroup={handleCreateGroup}
              onActivateGroup={handleGroupActivate}
              onDeactivateGroup={handleGroupDeactivate}
              showActions={true}
            />
          )}

          {activeTab === 'users' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-text-primary">Staff Management</h2>
                <button
                  type="button"
                  onClick={handleCreateUser}
                  className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary/80 rounded-lg text-text-primary text-sm sm:text-base font-medium transition-all duration-200"
                >
                  Add Staff Member
                </button>
              </div>

              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search staff members by name or email..."
                    value={usersPagination.search}
                    onChange={(e) => {
                      setUsersPagination(prev => ({
                        ...prev,
                        search: e.target.value,
                        page: 0 // Reset to first page when searching
                      }));
                    }}
                    className="w-full px-4 py-2 pl-10 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <svg className="absolute left-3 top-2.5 h-5 w-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user) => {
                  const coachInfo = getCoachAssignmentInfo(user.id);
                  return (
                    <UserCard
                      key={user.id}
                      user={user}
                      onEdit={handleEditUser}
                      onDelete={handleDeleteUser}
                      onDeactivate={(userId) => handleUserStatusUpdate(userId, false, 'Deactivated by admin')}
                      onActivate={(userId) => handleUserStatusUpdate(userId, true)}
                      onResendSetupEmail={handleResendSetupEmail}
                      onResetPassword={(userId) => setResetPasswordModal({ isOpen: true, userId })}
                      showActions={true}
                      assignedGroupsCount={coachInfo.assignedGroupsCount}
                      assignedGroupNames={coachInfo.assignedGroupNames}
                    />
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {usersPagination.totalElements > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6 p-4 bg-secondary-50 rounded-lg">
                  <div className="text-xs sm:text-sm text-text-secondary text-center sm:text-left">
                    Showing {usersPagination.page * usersPagination.size + 1} to {Math.min((usersPagination.page + 1) * usersPagination.size, usersPagination.totalElements)} of {usersPagination.totalElements} staff members
                  </div>

                  {usersPagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setUsersPagination(prev => ({ ...prev, page: Math.max(0, prev.page - 1) }))}
                        disabled={usersPagination.page === 0}
                        className="px-3 py-1 bg-background hover:bg-background/20 disabled:opacity-50 disabled:cursor-not-allowed rounded text-text-primary text-xs sm:text-sm transition-colors"
                      >
                        Previous
                      </button>

                      <span className="text-xs sm:text-sm text-text-secondary whitespace-nowrap">
                        Page {usersPagination.page + 1} of {usersPagination.totalPages}
                      </span>

                      <button
                        type="button"
                        onClick={() => setUsersPagination(prev => ({ ...prev, page: Math.min(prev.totalPages - 1, prev.page + 1) }))}
                        disabled={usersPagination.page >= usersPagination.totalPages - 1}
                        className="px-3 py-1 bg-background hover:bg-background/20 disabled:opacity-50 disabled:cursor-not-allowed rounded text-text-primary text-xs sm:text-sm transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'parents' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-text-primary">Parent Management</h2>
                  <p className="text-xs text-text-secondary mt-1">
                    Parents are created together with their first player. Use Add Player on a card to
                    add another child.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCreatePlayer}
                  className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg text-text-primary text-sm sm:text-base font-medium transition-all duration-200"
                >
                  Add Player
                </button>
              </div>

              {/* A paused switch is worth surfacing here even though it now
                  lives in Settings: without it, parents created on this screen
                  silently do not get emailed and nothing on screen says why. */}
              {welcomeEmailSetting && !welcomeEmailSetting.enabled && (
                <div className="mb-6 rounded-lg border border-orange-500/30 bg-orange-500/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-xs text-text-secondary">
                    <span className="font-semibold text-orange-400">Welcome emails are paused.</span>{' '}
                    New parents are created quietly, and
                    {welcomeEmailSetting.awaitingWelcomeEmailCount > 0 ? (
                      <>
                        {' '}
                        <span className="font-semibold text-text-primary">
                          {welcomeEmailSetting.awaitingWelcomeEmailCount}
                        </span>{' '}
                        {welcomeEmailSetting.awaitingWelcomeEmailCount === 1 ? 'is' : 'are'} waiting to be
                        invited. Select them below and send when you are ready.
                      </>
                    ) : (
                      ' nothing is sent until you invite them.'
                    )}
                  </p>
                  <div className="flex items-center gap-3 shrink-0">
                    {welcomeEmailSetting.awaitingWelcomeEmailCount > 0 && (
                      <button
                        type="button"
                        onClick={selectAllUninvitedEverywhere}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Select all waiting
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveTab('settings')}
                      className="text-xs font-medium text-text-secondary hover:underline"
                    >
                      Settings
                    </button>
                  </div>
                </div>
              )}

              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search parents by name or email..."
                    value={parentsPagination.search}
                    onChange={(e) => {
                      setParentsPagination(prev => ({
                        ...prev,
                        search: e.target.value,
                        page: 0 // Reset to first page when searching
                      }));
                    }}
                    className="w-full px-4 py-2 pl-10 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <svg className="absolute left-3 top-2.5 h-5 w-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Deactivated families are hidden by default. The control only
                    appears when there are some, so it never implies hidden
                    records that do not exist. */}
                {(deactivatedParentCount > 0 || showDeactivatedParents) && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-text-secondary">
                      {showDeactivatedParents
                        ? 'Showing deactivated parents'
                        : `${deactivatedParentCount} deactivated parent${deactivatedParentCount === 1 ? '' : 's'} hidden`}
                    </span>
                    <button
                      type="button"
                      onClick={handleToggleDeactivatedParents}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {showDeactivatedParents ? 'Hide them' : 'Show them'}
                    </button>
                  </div>
                )}
              </div>

              {parents.length === 0 ? (
                <div className="text-center py-12 text-text-secondary">
                  {parentsPagination.search
                    ? 'No parents match your search'
                    : 'No parents yet. Add a player to create the first one.'}
                </div>
              ) : (
                <>
                  {/* Selection bar. Selection is kept across pages on purpose,
                      so "Select all waiting" can span an intake that runs to
                      several pages; the count is always shown so a selection
                      reaching beyond this page is never invisible. */}
                  <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-secondary-50 rounded-lg">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm text-text-primary font-medium">
                        {selectedParentIds.size > 0
                          ? `${selectedParentIds.size} selected`
                          : 'Select parents to send their welcome email'}
                      </span>

                      {uninvitedOnPage.length > 0 && (
                        <button
                          type="button"
                          onClick={selectAllUninvitedOnPage}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Select {uninvitedOnPage.length} not invited on this page
                        </button>
                      )}

                      {selectedParentIds.size > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedParentIds(new Set())}
                          className="text-xs font-medium text-text-secondary hover:underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                      {/* Two sends, because a selected parent is in exactly one
                          of two states: never onboarded (needs the welcome
                          email) or onboarded and locked out (needs a reset).
                          Each send skips the other group and says so. */}
                      {/* btn-primary / btn-secondary rather than hand-rolled
                          colours: --text-primary is near-black, so putting it
                          on the dark blue --primary makes the label invisible.
                          The shared classes already pair white with it. */}
                      <button
                        type="button"
                        onClick={handleSendWelcomeEmails}
                        disabled={selectedParentIds.size === 0 || isSendingWelcomeEmails || isSendingPasswordResets}
                        className="btn-primary btn-sm w-full sm:w-auto disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isSendingWelcomeEmails
                          ? 'Sending...'
                          : `Send welcome email${selectedParentIds.size === 1 ? '' : 's'}`}
                      </button>

                      <button
                        type="button"
                        onClick={handleSendPasswordResets}
                        disabled={selectedParentIds.size === 0 || isSendingWelcomeEmails || isSendingPasswordResets}
                        title="For parents who already set a password and cannot get back in"
                        className="btn-secondary btn-sm w-full sm:w-auto disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isSendingPasswordResets ? 'Sending...' : 'Send password reset'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {parents.map((parent) => (
                      <UserCard
                        key={parent.id}
                        user={parent}
                        onEdit={handleEditParent}
                        onDelete={handleDeleteUser}
                        onDeactivate={(userId) => handleUserStatusUpdate(userId, false, 'Deactivated by admin')}
                        onActivate={(userId) => handleUserStatusUpdate(userId, true)}
                        onAddPlayer={handleAddPlayerForParent}
                        onUnassignChild={handleUnassignChild}
                        onResendSetupEmail={handleResendSetupEmail}
                        onResetPassword={(userId) => setResetPasswordModal({ isOpen: true, userId })}
                        showActions={true}
                        isSelectable={true}
                        isSelected={selectedParentIds.has(parent.id)}
                        onSelect={toggleParentSelection}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Pagination Controls */}
              {parentsPagination.totalElements > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6 p-4 bg-secondary-50 rounded-lg">
                  <div className="text-xs sm:text-sm text-text-secondary text-center sm:text-left">
                    Showing {parentsPagination.page * parentsPagination.size + 1} to {Math.min((parentsPagination.page + 1) * parentsPagination.size, parentsPagination.totalElements)} of {parentsPagination.totalElements} parents
                  </div>

                  {parentsPagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setParentsPagination(prev => ({ ...prev, page: Math.max(0, prev.page - 1) }))}
                        disabled={parentsPagination.page === 0}
                        className="px-3 py-1 bg-background hover:bg-background/20 disabled:opacity-50 disabled:cursor-not-allowed rounded text-text-primary text-xs sm:text-sm transition-colors"
                      >
                        Previous
                      </button>

                      <span className="text-xs sm:text-sm text-text-secondary whitespace-nowrap">
                        Page {parentsPagination.page + 1} of {parentsPagination.totalPages}
                      </span>

                      <button
                        type="button"
                        onClick={() => setParentsPagination(prev => ({ ...prev, page: Math.min(prev.totalPages - 1, prev.page + 1) }))}
                        disabled={parentsPagination.page >= parentsPagination.totalPages - 1}
                        className="px-3 py-1 bg-background hover:bg-background/20 disabled:opacity-50 disabled:cursor-not-allowed rounded text-text-primary text-xs sm:text-sm transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'players' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-text-primary">Player Management</h2>
                <button
                  type="button"
                  onClick={handleCreatePlayer}
                  className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg text-text-primary text-sm sm:text-base font-medium transition-all duration-200"
                >
                  Add Player
                </button>
              </div>

              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search players by name or email..."
                    value={playersPagination.search}
                    onChange={(e) => {
                      setPlayersPagination(prev => ({
                        ...prev,
                        search: e.target.value,
                        page: 0 // Reset to first page when searching
                      }));
                    }}
                    className="w-full px-4 py-2 pl-10 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <svg className="absolute left-3 top-2.5 h-5 w-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0z" />
                  </svg>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {players.map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    onEdit={handleEditPlayer}
                    onDelete={handleDeletePlayer}
                    onDeactivate={handlePlayerDeactivate}
                    onReactivate={handlePlayerReactivate}
                    showActions={true}
                    onAssignGroup={player.groupId ? undefined : () => handleAssignPlayerFromCard(player)}
                    onPromote={player.level === Level.DEVELOPMENT ? () => handlePromotePlayer(player.id!) : undefined}
                    onUnassignGroup={player.groupId ? (playerId) => handleRemovePlayer(player.groupId!, playerId) : undefined}
                    onReassignGroup={player.groupId ? handleOpenReassignModal : undefined}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {playersPagination.totalElements > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6 p-4 bg-secondary-50 rounded-lg">
                  <div className="text-xs sm:text-sm text-text-secondary text-center sm:text-left">
                    Showing {playersPagination.page * playersPagination.size + 1} to {Math.min((playersPagination.page + 1) * playersPagination.size, playersPagination.totalElements)} of {playersPagination.totalElements} players
                  </div>

                  {playersPagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPlayersPagination(prev => ({ ...prev, page: Math.max(0, prev.page - 1) }))}
                        disabled={playersPagination.page === 0}
                        className="px-3 py-1 bg-background hover:bg-background/20 disabled:opacity-50 disabled:cursor-not-allowed rounded text-text-primary text-xs sm:text-sm transition-colors"
                      >
                        Previous
                      </button>

                      <span className="text-xs sm:text-sm text-text-secondary whitespace-nowrap">
                        Page {playersPagination.page + 1} of {playersPagination.totalPages}
                      </span>

                      <button
                        type="button"
                        onClick={() => setPlayersPagination(prev => ({ ...prev, page: Math.min(prev.totalPages - 1, prev.page + 1) }))}
                        disabled={playersPagination.page >= playersPagination.totalPages - 1}
                        className="px-3 py-1 bg-background hover:bg-background/20 disabled:opacity-50 disabled:cursor-not-allowed rounded text-text-primary text-xs sm:text-sm transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'assessments' && (
            <AssessmentTemplateManagement
              onError={(message) => showError(message, 'Assessment Error')}
              onSuccess={showSuccess}
              groupsWithoutTemplate={groups
                .filter(group => group.isActive && !group.assessmentTemplateId)
                .map(group => group.name)}
              onTemplatesChanged={loadGroupsData}
            />
          )}

          {activeTab === 'skills' && (
            <SkillsManagement />
          )}

          {activeTab === 'settings' && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-text-primary">Settings</h2>
                <p className="text-xs text-text-secondary mt-1">
                  Academy-wide settings. Changes take effect immediately.
                </p>
              </div>

              <section>
                <h3 className="text-sm font-semibold text-text-primary mb-1">Communications</h3>
                <p className="text-xs text-text-secondary mb-4">
                  Control the automatic emails the system sends on your behalf.
                </p>

                {welcomeEmailSetting ? (
                  <div
                    className={`rounded-lg border p-4 ${
                      welcomeEmailSetting.enabled
                        ? 'bg-secondary-50 border-border'
                        : 'bg-orange-500/10 border-orange-500/30'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-text-primary">
                            Parent welcome emails
                          </h4>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              welcomeEmailSetting.enabled
                                ? 'bg-accent-teal/20 text-accent-teal border border-accent-teal/30'
                                : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            }`}
                          >
                            {welcomeEmailSetting.enabled ? 'Sending' : 'Paused'}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary mt-1 max-w-2xl">
                          {welcomeEmailSetting.enabled
                            ? 'New parents are emailed their password setup link as soon as their account is created.'
                            : 'New parents are created quietly. Pause this while you are loading the academy in, so nobody is invited to an empty dashboard.'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleWelcomeEmails(!welcomeEmailSetting.enabled)}
                        disabled={isSavingWelcomeEmailSetting}
                        className="btn-secondary btn-sm w-full sm:w-auto shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSavingWelcomeEmailSetting
                          ? 'Saving...'
                          : welcomeEmailSetting.enabled
                            ? 'Pause welcome emails'
                            : 'Resume welcome emails'}
                      </button>
                    </div>

                    {welcomeEmailSetting.awaitingWelcomeEmailCount > 0 && (
                      <div className="mt-3 pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <p className="text-xs text-text-secondary">
                          <span className="font-semibold text-text-primary">
                            {welcomeEmailSetting.awaitingWelcomeEmailCount}
                          </span>{' '}
                          parent{welcomeEmailSetting.awaitingWelcomeEmailCount === 1 ? '' : 's'} waiting to be
                          invited. Resuming does not email them — invite them deliberately from the
                          Parents tab.
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveTab('parents')}
                          className="shrink-0 text-xs font-medium text-primary hover:underline text-left sm:text-right"
                        >
                          Go to Parents
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-border bg-secondary-50 p-4 text-xs text-text-secondary">
                    Could not load the communication settings. Refresh to try again.
                  </div>
                )}
              </section>
            </div>
          )}
        </div>

        {/* Assignment Modals */}
        <PlayerAssignmentModal
          isOpen={playerAssignmentModal.isOpen}
          onClose={() => setPlayerAssignmentModal({ isOpen: false })}
          groupId={playerAssignmentModal.groupId}
          selectedGroup={playerAssignmentModal.selectedGroup}
          selectedPlayer={playerAssignmentModal.selectedPlayer}
          playerPreSelected={playerAssignmentModal.playerPreSelected}
          onAssignmentComplete={handleAssignmentComplete}
          onGroupFull={(player, group) => {
            setPlayerAssignmentModal({ isOpen: false });
            setOverCapacityModal({ isOpen: true, group, player });
          }}
        />

        <GroupPlayersModal
          isOpen={groupPlayersModal.isOpen}
          group={groupPlayersModal.group}
          onClose={() => setGroupPlayersModal({ isOpen: false, group: null })}
          onChanged={async (message) => {
            await Promise.all([loadGroupsData(), loadPlayersData()]);
            showSuccess(message);
          }}
          onError={(message) => showError(message, 'Group Players')}
        />

        <AssignAssessmentModal
          isOpen={assignAssessmentModal.isOpen}
          group={assignAssessmentModal.group}
          onClose={() => setAssignAssessmentModal({ isOpen: false, group: null })}
          onComplete={(updated, message) => {
            setGroups(prev => prev.map(g => (g.id === updated.id ? updated : g)));
            setAssignAssessmentModal({ isOpen: false, group: null });
            showSuccess(message);
          }}
          onError={(message) => showError(message, 'Assessment Assignment')}
        />

        <GroupOverCapacityModal
          isOpen={overCapacityModal.isOpen}
          group={overCapacityModal.group}
          player={overCapacityModal.player}
          onClose={() => setOverCapacityModal({ isOpen: false, group: null, player: null })}
          onComplete={async (message) => {
            setOverCapacityModal({ isOpen: false, group: null, player: null });
            await Promise.all([loadGroupsData(), loadPlayersData()]);
            showSuccess(message);
          }}
          onError={(message) => showError(message, 'Group Capacity')}
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
          refreshTrigger={autoAssignRefreshTrigger}
        />

        <PromotionModal
          isOpen={promotionModal.isOpen}
          playerId={promotionModal.playerId}
          onClose={() => setPromotionModal({ isOpen: false, playerId: null })}
          onComplete={handlePromotionComplete}
        />

        {/* Creation Modals */}
        <CreatePlayerModal
          isOpen={createPlayerModal.isOpen}
          lockedParent={createPlayerModal.parent}
          mode={createPlayerModal.mode}
          onClose={() => setCreatePlayerModal({ isOpen: false, parent: null, mode: 'create' })}
          onComplete={(newPlayers, parentChanged) => {
            setPlayers(prev => [...prev, ...newPlayers]);
            setStats(prev => ({ ...prev, totalPlayers: prev.totalPlayers + newPlayers.length }));
            setCreatePlayerModal({ isOpen: false, parent: null, mode: 'create' });
            // The parent is new, edited, or has gained children - all of which
            // its card displays.
            loadParentsData();
            showSuccess(
              newPlayers.length === 0
                ? 'Parent updated successfully'
                : newPlayers.length > 1
                  ? `${newPlayers.length} players created successfully`
                  : parentChanged && createPlayerModal.mode === 'edit'
                    ? 'Parent updated and player created successfully'
                    : 'Player created successfully'
            );
          }}
        />

        <CreateUserModal
          isOpen={createUserModal}
          onClose={() => setCreateUserModal(false)}
          onComplete={(newUser) => {
            // Add new user to state
            setUsers(prev => [...prev, newUser]);
            if (newUser.userType === 'COACH' || newUser.roles?.includes('COACH')) {
              setStats(prev => ({ ...prev, totalCoaches: prev.totalCoaches + 1 }));
            }
            setCreateUserModal(false);
            showSuccess('User created successfully');
          }}
        />

        <CreateGroupModal
          isOpen={createGroupModal}
          onClose={() => setCreateGroupModal(false)}
          onComplete={(newGroup) => {
            // Add new group to state
            setGroups(prev => [...prev, newGroup]);
            setStats(prev => ({
              ...prev,
              totalGroups: prev.totalGroups + 1,
              activeGroups: newGroup.isActive ? prev.activeGroups + 1 : prev.activeGroups
            }));
            setCreateGroupModal(false);
            showSuccess('Group created successfully');
          }}
        />

        {/* Edit Modals */}
        <EditUserModal
          isOpen={editUserModal.isOpen}
          userId={editUserModal.userId}
          onClose={() => setEditUserModal({ isOpen: false, userId: null })}
          onComplete={(updatedUser) => {
            // Update only the specific user in the state
            updateAccountInLists(updatedUser);
            setEditUserModal({ isOpen: false, userId: null });
            showSuccess('User updated successfully');
          }}
        />

        <ResetPasswordModal
          isOpen={resetPasswordModal.isOpen}
          userId={resetPasswordModal.userId}
          userName={resetPasswordModal.userId && findAccountById(resetPasswordModal.userId)
            ? `${findAccountById(resetPasswordModal.userId)!.firstName} ${findAccountById(resetPasswordModal.userId)!.lastName ?? ''}`.trim()
            : undefined}
          userEmail={resetPasswordModal.userId ? findAccountById(resetPasswordModal.userId)?.email : undefined}
          onClose={() => setResetPasswordModal({ isOpen: false, userId: null })}
          onSuccess={() => showSuccess('Password updated successfully')}
        />

        <EditPlayerModal
          isOpen={editPlayerModal.isOpen}
          playerId={editPlayerModal.playerId}
          onClose={() => setEditPlayerModal({ isOpen: false, playerId: null })}
          onComplete={(updatedPlayer) => {
            // Update only the specific player in the state
            setPlayers(prev => prev.map(player => 
              player.id === updatedPlayer.id ? updatedPlayer : player
            ));
            setEditPlayerModal({ isOpen: false, playerId: null });
            showSuccess('Player updated successfully');
          }}
        />

        <EditGroupModal
          isOpen={editGroupModal.isOpen}
          groupId={editGroupModal.groupId}
          onClose={() => setEditGroupModal({ isOpen: false, groupId: null })}
          onComplete={(updatedGroup) => {
            // Update only the specific group in the state
            setGroups(prev => prev.map(group => 
              group.id === updatedGroup.id ? updatedGroup : group
            ));
            setEditGroupModal({ isOpen: false, groupId: null });
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