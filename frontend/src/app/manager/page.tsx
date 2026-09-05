"use client";

import { useState, useEffect, useMemo } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import LogoutButton from '@/components/LogoutButton';
import { useAuth } from '@/store/hooks';
import { groupsAPI, usersAPI, playersAPI } from '@/lib/api';
import { assessmentsAPI } from '@/lib/api/assessments';
import { AssessmentManagement } from '@/components/assessments/AssessmentManagement';
import { ResponsiveTabs } from '@/components/responsive';
import {
  GroupResponse,
  UserResponse,
  PlayerDTO,
  Level,
  AgeGroup,
  UserType
} from '@/types';

interface ChartData {
  labels: string[];
  values: number[];
}

type TimeRange = 'week' | 'month' | 'quarter' | 'year';

const endOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

/**
 * Cumulative active players at the end of each bucket, taken from the date
 * each player actually joined. This chart used to plot invented figures.
 */
const buildGrowthSeries = (players: PlayerDTO[], range: TimeRange): ChartData => {
  const joinDates = players
    .filter(player => player.isActive !== false)
    .map(player => new Date(player.joiningDate || player.createdAt || ''))
    .filter(date => !isNaN(date.getTime()));

  const now = new Date();
  const buckets: { label: string; end: Date }[] = [];

  if (range === 'week') {
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      buckets.push({ label: day.toLocaleDateString(undefined, { weekday: 'short' }), end: endOfDay(day) });
    }
  } else if (range === 'month') {
    for (let i = 4; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(now.getDate() - i * 7);
      buckets.push({
        label: day.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
        end: endOfDay(day)
      });
    }
  } else {
    const months = range === 'quarter' ? 3 : 12;
    for (let i = months - 1; i >= 0; i--) {
      // Day 0 of the following month is the last day of this one.
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      buckets.push({ label: monthEnd.toLocaleDateString(undefined, { month: 'short' }), end: endOfDay(monthEnd) });
    }
  }

  return {
    labels: buckets.map(bucket => bucket.label),
    values: buckets.map(bucket => joinDates.filter(date => date <= bucket.end).length)
  };
};

/** First and last day of the current month, as the API's ISO date strings. */
const currentMonthRange = () => {
  const now = new Date();
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return {
    dateFrom: iso(new Date(now.getFullYear(), now.getMonth(), 1)),
    dateTo: iso(new Date(now.getFullYear(), now.getMonth() + 1, 0))
  };
};

export default function ManagerDashboard() {
  const { user } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'assessments' | 'reports'>('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  // Data
  const [groups, setGroups] = useState<GroupResponse[]>([]);
  const [players, setPlayers] = useState<PlayerDTO[]>([]);
  const [stats, setStats] = useState({
    totalGroups: 0,
    activeGroups: 0,
    totalStaff: 0,
    totalCoaches: 0,
    totalManagers: 0,
    totalAdmins: 0,
    activePlayers: 0,
    assignedPlayers: 0,
    unassignedPlayers: 0,
    totalCapacity: 0,
    filledPlaces: 0,
    capacityUtilization: 0,
    assessmentsThisMonth: 0,
    assessmentsCompleted: 0,
    assessmentsInProgress: 0
  });

  // Real growth, recomputed when the range changes rather than refetched.
  const playerGrowthData = useMemo(
    () => buildGrowthSeries(players, timeRange),
    [players, timeRange]
  );

  // Load initial data
  useEffect(() => {
    loadManagerData();
  }, []);

  const loadManagerData = async () => {
    setLoading(true);
    try {
      const thisMonth = currentMonthRange();

      const [groupsResponse, usersResponse, playersResponse, playerStatsResponse, allTimeAssessments, monthAssessments] =
        await Promise.all([
          groupsAPI.getAll(),
          // Every staff member, not the default first page of ten — the role
          // counts below are wrong the moment the academy has more than that.
          usersAPI.getAll(0, 1000),
          playersAPI.getAllList(),
          playersAPI.getStats(),
          // The assessment counts are a headline number, not the dashboard's
          // reason to exist, so a failure here leaves the rest of it standing.
          assessmentsAPI.getSummary().catch(() => null),
          assessmentsAPI.getSummary(thisMonth).catch(() => null)
        ]);

      const allUsers: UserResponse[] = usersResponse.content || usersResponse;
      const allPlayers: PlayerDTO[] = playersResponse;

      setGroups(groupsResponse);
      setPlayers(allPlayers);

      const isStaff = (user: UserResponse, role: UserType) =>
        user.userType === role || !!user.roles?.includes(role);
      const staffWithRole = (role: UserType) => allUsers.filter(user => isStaff(user, role)).length;
      // Distinct people, not the sum of the three role counts: one person can
      // be both a coach and an admin, and would otherwise be counted twice.
      const totalStaff = allUsers.filter(user =>
        isStaff(user, UserType.COACH) || isStaff(user, UserType.MANAGER) || isStaff(user, UserType.ADMIN)
      ).length;

      const activeGroups = groupsResponse.filter((group: GroupResponse) => group.isActive);
      const totalCapacity = groupsResponse.reduce((acc: number, g: GroupResponse) => acc + g.capacity, 0);
      const filledPlaces = groupsResponse.reduce((acc: number, g: GroupResponse) => acc + g.currentPlayerCount, 0);
      const capacityUtilization = totalCapacity > 0 ? Math.round((filledPlaces / totalCapacity) * 100) : 0;

      // Active players and players sitting in a group are different numbers:
      // the gap is players nobody has assigned yet, which is worth showing.
      const activePlayers = allPlayers.filter(player => player.isActive !== false);
      const unassignedPlayers = activePlayers.filter(player => !player.groupId).length;

      setStats({
        totalGroups: groupsResponse.length,
        activeGroups: activeGroups.length,
        totalStaff,
        totalCoaches: staffWithRole(UserType.COACH),
        totalManagers: staffWithRole(UserType.MANAGER),
        totalAdmins: staffWithRole(UserType.ADMIN),
        activePlayers: playerStatsResponse.totalActivePlayers ?? activePlayers.length,
        assignedPlayers: activePlayers.length - unassignedPlayers,
        unassignedPlayers,
        totalCapacity,
        filledPlaces,
        capacityUtilization,
        assessmentsThisMonth: monthAssessments?.completedAssessments ?? 0,
        assessmentsCompleted: allTimeAssessments?.completedAssessments ?? 0,
        assessmentsInProgress: allTimeAssessments?.pendingAssessments ?? 0
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load manager data');
    }
    setLoading(false);
  };

  const getGroupsByLevel = () => {
    const byLevel: Record<Level, number> = {
      [Level.DEVELOPMENT]: 0,
      [Level.ADVANCED]: 0
    };
    groups.forEach(group => {
      byLevel[group.level]++;
    });
    return byLevel;
  };

  const getGroupsByAgeGroup = () => {
    const byAge: Record<AgeGroup, number> = {
      [AgeGroup.COOKIES]: 0,
      [AgeGroup.DOLPHINS]: 0,
      [AgeGroup.TIGERS]: 0,
      [AgeGroup.LIONS]: 0
    };
    groups.forEach(group => {
      byAge[group.ageGroup]++;
    });
    return byAge;
  };

  const getTopPerformingGroups = () => {
    return groups
      .filter(g => g.isActive)
      .sort((a, b) => b.currentPlayerCount - a.currentPlayerCount)
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 max-w-md w-full">
          <h2 className="text-xl font-semibold text-text-primary mb-2">Error Loading Dashboard</h2>
          <p className="text-accent-red mb-4">{error}</p>
          <button
            onClick={loadManagerData}
            className="px-4 py-2 bg-accent-red hover:bg-accent-red-600 rounded-lg text-white transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const groupsByLevel = getGroupsByLevel();
  const groupsByAge = getGroupsByAgeGroup();
  const topGroups = getTopPerformingGroups();

  return (
    <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-5 sm:mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Manager Dashboard</h1>
              <p className="text-sm sm:text-base text-gray-600">Comprehensive academy oversight and analytics</p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="min-w-0 sm:text-right">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="text-gray-900 font-semibold truncate">{user?.email || 'Manager'}</p>
              </div>
              <LogoutButton />
            </div>
          </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {/* Academy Status */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-3 sm:p-6">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="p-2 sm:p-3 bg-green-500/20 rounded-full">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-accent-teal" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-[11px] sm:text-sm text-accent-teal font-medium">
                {stats.capacityUtilization}% of capacity
              </span>
            </div>
            <p className="text-gray-600 text-xs sm:text-sm font-medium">Active Players</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.activePlayers}</p>
            <p className="text-xs text-gray-600 mt-1">
              {stats.unassignedPlayers > 0
                ? `${stats.assignedPlayers} in a group • ${stats.unassignedPlayers} unassigned`
                : 'all assigned to a group'}
            </p>
          </div>

          {/* Groups. Replaces a revenue card whose figures were invented;
              finances come back when the business side is settled. */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-3 sm:p-6">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="p-2 sm:p-3 bg-blue-500/20 rounded-full">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <span className="text-[11px] sm:text-sm text-text-primary font-medium">{stats.activeGroups} active</span>
            </div>
            <p className="text-gray-600 text-xs sm:text-sm font-medium">Groups</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalGroups}</p>
            <p className="text-xs text-gray-600 mt-1">
              {stats.filledPlaces} of {stats.totalCapacity} places filled
            </p>
          </div>

          {/* Staff Overview */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-3 sm:p-6">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="p-2 sm:p-3 bg-purple-500/20 rounded-full">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <span className="text-[11px] sm:text-sm text-text-primary font-medium">{stats.totalStaff}</span>
            </div>
            <p className="text-gray-600 text-xs sm:text-sm font-medium">Total Staff</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalCoaches} Coaches</p>
            <p className="text-xs text-gray-600 mt-1">
              {stats.totalManagers} manager{stats.totalManagers === 1 ? '' : 's'} • {stats.totalAdmins} admin
              {stats.totalAdmins === 1 ? '' : 's'}
            </p>
          </div>

          {/* Assessments */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-3 sm:p-6">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="p-2 sm:p-3 bg-cyan-500/20 rounded-full">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-[11px] sm:text-sm text-text-primary font-medium">This Month</span>
            </div>
            <p className="text-gray-600 text-xs sm:text-sm font-medium">Assessments</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.assessmentsThisMonth} Done</p>
            <p className="text-xs text-gray-600 mt-1">
              {stats.assessmentsCompleted} all time • {stats.assessmentsInProgress} in progress
            </p>
          </div>
        </div>

        {/* Tab Navigation. ResponsiveTabs is the shared strip the admin page
            already uses: it scrolls rather than squeezing on a phone. */}
        <ResponsiveTabs
          tabs={[
            { id: 'overview', label: 'Overview', icon: <span>📊</span> },
            { id: 'analytics', label: 'Analytics', icon: <span>📈</span> },
            { id: 'assessments', label: 'Assessments', icon: <span>📝</span> },
            { id: 'reports', label: 'Reports', icon: <span>📋</span> }
            // Finances is hidden until the business side is settled; every
            // figure it showed was invented.
          ]}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as typeof activeTab)}
          className="mb-5 sm:mb-8"
        />

        {/* Main Content Area */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 sm:p-6">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Groups Distribution */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Academy Overview</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Groups by Level */}
                  <div className="bg-secondary-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Groups by Level</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">Development</span>
                          <span className="text-sm font-medium text-gray-900">
                            {groupsByLevel[Level.DEVELOPMENT]} groups
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                            style={{ width: `${(groupsByLevel[Level.DEVELOPMENT] / groups.length) * 100}%` }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">Advanced</span>
                          <span className="text-sm font-medium text-gray-900">
                            {groupsByLevel[Level.ADVANCED]} groups
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-600"
                            style={{ width: `${(groupsByLevel[Level.ADVANCED] / groups.length) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Groups by Age */}
                  <div className="bg-secondary-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Groups by Age Category</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(groupsByAge).map(([age, count]) => (
                        <div key={age} className="bg-secondary-50 rounded-lg p-3">
                          <p className="text-xs text-gray-600">{age}</p>
                          <p className="text-xl font-bold text-gray-900">{count}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Performing Groups */}
              <div>
                {/* Ranked by how full each group is — not by any performance
                    measure, which is what the old heading implied. */}
                <h3 className="text-lg font-medium text-text-primary mb-3">Fullest Groups</h3>
                <div className="bg-secondary-50 rounded-lg">
                  <div className="divide-y divide-white/10">
                    {topGroups.map((group, index) => (
                      <div key={group.id} className="p-3 sm:p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center text-text-primary font-bold
                            ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-blue-500'}
                          `}>
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-text-primary truncate">{group.name}</p>
                            <p className="text-sm text-text-secondary">
                              {group.level} • {group.ageGroup}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 pl-12 sm:pl-0 sm:text-right">
                          <p className="font-medium text-text-primary">
                            {group.currentPlayerCount}/{group.capacity} players
                          </p>
                          <p className="text-sm text-text-secondary">
                            {Math.round((group.currentPlayerCount / group.capacity) * 100)}% full
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                <h2 className="text-xl font-semibold text-text-primary shrink-0">Performance Analytics</h2>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  className="select-base w-full sm:w-48"
                >
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="quarter">Last Quarter</option>
                  <option value="year">Last Year</option>
                </select>
              </div>

              {/* Player Growth Chart */}
              <div className="bg-secondary-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-text-primary">Player Growth</h3>
                <p className="text-sm text-text-secondary mb-4">
                  Active players registered by each point, from their joining dates
                </p>
                <div className="overflow-x-auto">
                  <div className="h-48 flex items-stretch gap-2 min-w-full" style={{ minWidth: `${playerGrowthData.labels.length * 44}px` }}>
                    {playerGrowthData.labels.map((label, index) => (
                      <div key={`${label}-${index}`} className="flex-1 min-w-[36px] h-full flex flex-col justify-end items-center">
                        <div className="w-full bg-blue-500/20 rounded-t flex-1 flex items-end">
                          <div
                            className="w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t transition-all duration-500"
                            style={{
                              height: `${(playerGrowthData.values[index] / Math.max(1, ...playerGrowthData.values)) * 100}%`
                            }}
                          />
                        </div>
                        <p className="text-xs text-text-secondary mt-2 whitespace-nowrap">{label}</p>
                        <p className="text-xs font-medium text-text-primary">{playerGrowthData.values[index]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
                <div className="bg-secondary-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-text-secondary mb-2">Average Group Size</h4>
                  <p className="text-2xl font-bold text-text-primary">
                    {stats.activeGroups > 0 ? Math.round(stats.assignedPlayers / stats.activeGroups) : 0}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    players per active group
                  </p>
                </div>

                <div className="bg-secondary-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-text-secondary mb-2">Coach-Player Ratio</h4>
                  <p className="text-2xl font-bold text-text-primary">
                    1:{stats.totalCoaches > 0 ? Math.round(stats.activePlayers / stats.totalCoaches) : 0}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    active players per coach
                  </p>
                </div>

                {/* Was a 94% retention rate with a +2% trend, both invented. This
                    is the same shape of number and the academy actually has it. */}
                <div className="bg-secondary-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-text-secondary mb-2">Players Without a Group</h4>
                  <p className="text-2xl font-bold text-text-primary">{stats.unassignedPlayers}</p>
                  <p className="text-xs text-text-secondary mt-1">
                    {stats.unassignedPlayers === 0
                      ? 'every active player is assigned'
                      : 'waiting to be assigned'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'assessments' && (
            /* Oversight, not authoring: every assessment the coaches have
               written, open to edit or delete, including finalized ones. */
            <AssessmentManagement
              allowCreate={false}
              groupByGroup
              title="Assessments"
              subtitle="Every assessment the coaches have recorded, by group — review, correct or remove one"
            />
          )}

          {activeTab === 'reports' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-text-primary">Reports</h2>
                <p className="text-sm text-text-secondary mt-1">
                  Planned reports — none of these generate anything yet.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-secondary-50 border border-border rounded-lg p-6 text-left opacity-75">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 bg-blue-500/20 rounded-full">
                      <svg className="w-6 h-6 text-text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-text-primary">Player Progress Report</h3>
                  </div>
                  <p className="text-sm text-text-secondary mb-2">
                    Comprehensive overview of all player development metrics
                  </p>
                  <span className="badge-secondary">Not available yet</span>
                </div>

                <div className="bg-secondary-50 border border-border rounded-lg p-6 text-left opacity-75">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 bg-purple-500/20 rounded-full">
                      <svg className="w-6 h-6 text-text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-text-primary">Coach Performance</h3>
                  </div>
                  <p className="text-sm text-text-secondary mb-2">
                    Evaluation of coach effectiveness and group management
                  </p>
                  <span className="badge-secondary">Not available yet</span>
                </div>

                <div className="bg-secondary-50 border border-border rounded-lg p-6 text-left opacity-75">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 bg-yellow-500/20 rounded-full">
                      <svg className="w-6 h-6 text-accent-yellow" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-text-primary">Academy Snapshot</h3>
                  </div>
                  <p className="text-sm text-text-secondary mb-2">
                    Executive summary of all academy operations
                  </p>
                  <span className="badge-secondary">Not available yet</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}
