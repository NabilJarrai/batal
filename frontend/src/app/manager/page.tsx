"use client";

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import LogoutButton from '@/components/LogoutButton';
import { useAuth } from '@/store/hooks';
import { groupsAPI, usersAPI, playersAPI } from '@/lib/api';
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

export default function ManagerDashboard() {
  const { user } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'reports' | 'finances'>('overview');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  // Data
  const [groups, setGroups] = useState<GroupResponse[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [players, setPlayers] = useState<PlayerDTO[]>([]);
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalCoaches: 0,
    totalPlayers: 0,
    totalAdmins: 0,
    activeGroups: 0,
    activePlayers: 0,
    capacityUtilization: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    completedAssessments: 0,
    pendingAssessments: 0
  });

  // Chart data
  const [playerGrowthData, setPlayerGrowthData] = useState<ChartData>({
    labels: [],
    values: []
  });

  // Load initial data
  useEffect(() => {
    loadManagerData();
  }, []);

  const loadManagerData = async () => {
    setLoading(true);
    try {
      const [groupsResponse, usersResponse, playersResponse, playerStatsResponse] = await Promise.all([
        groupsAPI.getAll(),
        usersAPI.getAll(),
        playersAPI.getAll(),
        playersAPI.getStats()
      ]);

      setGroups(groupsResponse);
      setUsers(usersResponse.content || usersResponse);
      setPlayers(playersResponse.content || playersResponse);

      // Calculate comprehensive stats
      const allUsers = usersResponse.content || usersResponse;
      const coaches = allUsers.filter(user => 
        user.userType === UserType.COACH || user.roles.includes('COACH')
      );
      const admins = allUsers.filter(user => 
        user.userType === UserType.ADMIN || user.roles.includes('ADMIN')
      );
      const activeGroups = groupsResponse.filter((group: GroupResponse) => group.isActive);
      const totalCapacity = groupsResponse.reduce((acc: number, g: GroupResponse) => acc + g.capacity, 0);
      const totalOccupancy = groupsResponse.reduce((acc: number, g: GroupResponse) => acc + g.currentPlayerCount, 0);
      const capacityUtilization = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

      setStats({
        totalGroups: groupsResponse.length,
        totalCoaches: coaches.length,
        totalPlayers: playerStatsResponse.totalActivePlayers || players.length,
        totalAdmins: admins.length,
        activeGroups: activeGroups.length,
        activePlayers: playerStatsResponse.totalActivePlayers || 0,
        capacityUtilization,
        monthlyRevenue: 125000, // Mock data - would come from backend
        pendingPayments: 15000, // Mock data
        completedAssessments: 85, // Mock data
        pendingAssessments: 12 // Mock data
      });

      // Generate mock growth data
      setPlayerGrowthData({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        values: [120, 135, 148, 155, 168, playerStatsResponse.totalActivePlayers || 180]
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
      <div className="min-h-screen bg-background p-6">
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
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Manager Dashboard</h1>
              <p className="text-gray-600">Comprehensive academy oversight and analytics</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="text-gray-900 font-semibold">{user?.email || 'Manager'}</p>
              </div>
              <LogoutButton />
            </div>
          </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Academy Status */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/20 rounded-full">
                <svg className="w-6 h-6 text-accent-teal" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm text-accent-teal font-medium">Operational</span>
            </div>
            <p className="text-gray-600 text-sm font-medium">Academy Status</p>
            <p className="text-2xl font-bold text-gray-900">{stats.activePlayers} Active</p>
            <p className="text-xs text-gray-600 mt-1">
              {stats.capacityUtilization}% capacity utilization
            </p>
          </div>

          {/* Financial Overview */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-500/20 rounded-full">
                <svg className="w-6 h-6 text-accent-yellow" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm text-accent-yellow font-medium">+12%</span>
            </div>
            <p className="text-gray-600 text-sm font-medium">Monthly Revenue</p>
            <p className="text-2xl font-bold text-gray-900">AED {stats.monthlyRevenue.toLocaleString()}</p>
            <p className="text-xs text-gray-600 mt-1">
              AED {stats.pendingPayments.toLocaleString()} pending
            </p>
          </div>

          {/* Staff Overview */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/20 rounded-full">
                <svg className="w-6 h-6 text-text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <span className="text-sm text-text-primary font-medium">{stats.totalCoaches + stats.totalAdmins}</span>
            </div>
            <p className="text-gray-600 text-sm font-medium">Total Staff</p>
            <p className="text-lg font-bold text-gray-900">{stats.totalCoaches} Coaches</p>
            <p className="text-lg font-bold text-gray-900">{stats.totalAdmins} Admins</p>
          </div>

          {/* Assessments */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-cyan-500/20 rounded-full">
                <svg className="w-6 h-6 text-text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm text-text-primary font-medium">This Month</span>
            </div>
            <p className="text-gray-600 text-sm font-medium">Assessments</p>
            <p className="text-2xl font-bold text-gray-900">{stats.completedAssessments} Done</p>
            <p className="text-xs text-gray-600 mt-1">
              {stats.pendingAssessments} pending
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-1 mb-8">
          <div className="flex space-x-1">
            {[
              { key: 'overview', label: 'Overview', icon: '📊' },
              { key: 'analytics', label: 'Analytics', icon: '📈' },
              { key: 'reports', label: 'Reports', icon: '📋' },
              { key: 'finances', label: 'Finances', icon: '💰' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200
                  ${activeTab === tab.key
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Groups Distribution */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Academy Overview</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Groups by Level */}
                  <div className="bg-white/5 rounded-lg p-4">
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
                  <div className="bg-white/5 rounded-lg p-4">
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
                <h3 className="text-lg font-medium text-text-primary mb-3">Top Performing Groups</h3>
                <div className="bg-white/5 rounded-lg">
                  <div className="divide-y divide-white/10">
                    {topGroups.map((group, index) => (
                      <div key={group.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center text-white font-bold
                            ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-blue-500'}
                          `}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">{group.name}</p>
                            <p className="text-sm text-text-secondary">
                              {group.level} • {group.ageGroup}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-white">
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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-text-primary">Performance Analytics</h2>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  className="px-3 py-2 bg-background border border-border text-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="quarter">Last Quarter</option>
                  <option value="year">Last Year</option>
                </select>
              </div>

              {/* Player Growth Chart */}
              <div className="bg-white/5 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-text-primary mb-4">Player Growth Trend</h3>
                <div className="h-64 flex items-end justify-between gap-2">
                  {playerGrowthData.labels.map((label, index) => (
                    <div key={label} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-blue-500/20 rounded-t flex-1 flex items-end">
                        <div 
                          className="w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t transition-all duration-500"
                          style={{ 
                            height: `${(playerGrowthData.values[index] / Math.max(...playerGrowthData.values)) * 100}%` 
                          }}
                        />
                      </div>
                      <p className="text-xs text-text-secondary mt-2">{label}</p>
                      <p className="text-xs font-medium text-text-primary">{playerGrowthData.values[index]}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-text-secondary mb-2">Average Group Size</h4>
                  <p className="text-2xl font-bold text-white">
                    {groups.length > 0 ? Math.round(stats.totalPlayers / groups.length) : 0}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">players per group</p>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-text-secondary mb-2">Coach-Player Ratio</h4>
                  <p className="text-2xl font-bold text-white">
                    1:{stats.totalCoaches > 0 ? Math.round(stats.totalPlayers / stats.totalCoaches) : 0}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">optimal ratio maintained</p>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-text-secondary mb-2">Retention Rate</h4>
                  <p className="text-2xl font-bold text-white">94%</p>
                  <p className="text-xs text-accent-teal mt-1">+2% from last month</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">Generate Reports</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button className="bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg p-6 text-left transition-colors duration-200">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 bg-blue-500/20 rounded-full">
                      <svg className="w-6 h-6 text-text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-white">Player Progress Report</h3>
                  </div>
                  <p className="text-sm text-text-secondary mb-2">
                    Comprehensive overview of all player development metrics
                  </p>
                  <span className="text-xs text-text-secondary">Last generated: 2 days ago</span>
                </button>

                <button className="bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg p-6 text-left transition-colors duration-200">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 bg-purple-500/20 rounded-full">
                      <svg className="w-6 h-6 text-text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-white">Coach Performance</h3>
                  </div>
                  <p className="text-sm text-text-secondary mb-2">
                    Evaluation of coach effectiveness and group management
                  </p>
                  <span className="text-xs text-text-secondary">Last generated: 1 week ago</span>
                </button>

                <button className="bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg p-6 text-left transition-colors duration-200">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 bg-green-500/20 rounded-full">
                      <svg className="w-6 h-6 text-accent-teal" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-white">Financial Summary</h3>
                  </div>
                  <p className="text-sm text-text-secondary mb-2">
                    Revenue, expenses, and payment status overview
                  </p>
                  <span className="text-xs text-text-secondary">Last generated: 3 days ago</span>
                </button>

                <button className="bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg p-6 text-left transition-colors duration-200">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 bg-yellow-500/20 rounded-full">
                      <svg className="w-6 h-6 text-accent-yellow" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-white">Academy Snapshot</h3>
                  </div>
                  <p className="text-sm text-text-secondary mb-2">
                    Executive summary of all academy operations
                  </p>
                  <span className="text-xs text-text-secondary">Generate monthly</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'finances' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">Financial Overview</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2 bg-white/5 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-white mb-4">Revenue Breakdown</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-text-secondary">Membership Fees</span>
                        <span className="text-sm font-medium text-white">AED 95,000</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div className="h-2 rounded-full bg-green-500" style={{ width: '76%' }} />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-text-secondary">Training Programs</span>
                        <span className="text-sm font-medium text-white">AED 20,000</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div className="h-2 rounded-full bg-blue-500" style={{ width: '16%' }} />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-text-secondary">Equipment & Merchandise</span>
                        <span className="text-sm font-medium text-white">AED 10,000</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div className="h-2 rounded-full bg-purple-500" style={{ width: '8%' }} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium text-white">Total Revenue</span>
                      <span className="text-2xl font-bold text-white">AED 125,000</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-white mb-4">Payment Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <span className="text-sm text-accent-teal">Paid</span>
                      <span className="text-sm font-medium text-white">165</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <span className="text-sm text-accent-yellow">Pending</span>
                      <span className="text-sm font-medium text-white">12</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <span className="text-sm text-accent-red">Overdue</span>
                      <span className="text-sm font-medium text-white">3</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="p-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-white text-sm font-medium transition-colors duration-200">
                    Send Payment Reminders
                  </button>
                  <button className="p-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-white text-sm font-medium transition-colors duration-200">
                    Export Financial Report
                  </button>
                  <button className="p-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-white text-sm font-medium transition-colors duration-200">
                    Sync with ERPNext
                  </button>
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