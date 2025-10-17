'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { skillsAPI } from '@/lib/api/skills';
import { Skill, SkillCategory, SkillLevel } from '@/types/skills';
import { ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';

interface SkillsListProps {
  category?: SkillCategory;
  level?: SkillLevel;
  onSkillSelect?: (skill: Skill) => void;
}

export default function SkillsList({ category, level, onSkillSelect }: SkillsListProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | undefined>(category);
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel | undefined>(level);

  const fetchSkills = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await skillsAPI.getAll({
        category: selectedCategory,
        level: selectedLevel,
        activeOnly,
        page: currentPage,
        size: pageSize
      });
      
      setSkills(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load skills');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, selectedCategory, selectedLevel, activeOnly]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(0); // Reset to first page
  };

  const filteredSkills = skills.filter(skill => 
    skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    skill.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startIndex = currentPage * pageSize + 1;
  const endIndex = Math.min((currentPage + 1) * pageSize, totalElements);

  if (loading && skills.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button 
          onClick={fetchSkills}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedCategory || ''}
              onChange={(e) => {
                setSelectedCategory(e.target.value as SkillCategory || undefined);
                setCurrentPage(0);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="ATHLETIC">Athletic</option>
              <option value="TECHNICAL">Technical</option>
              <option value="MENTALITY">Mentality</option>
              <option value="PERSONALITY">Personality</option>
            </select>

            <select
              value={selectedLevel || ''}
              onChange={(e) => {
                setSelectedLevel(e.target.value as SkillLevel || undefined);
                setCurrentPage(0);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Levels</option>
              <option value="DEVELOPMENT">Development</option>
              <option value="ADVANCED">Advanced</option>
            </select>

            <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg">
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={(e) => {
                  setActiveOnly(e.target.checked);
                  setCurrentPage(0);
                }}
                className="rounded text-primary focus:ring-primary"
              />
              <span className="text-sm">Active Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSkills.map((skill) => (
          <div
            key={skill.id}
            onClick={() => onSkillSelect?.(skill)}
            className={`bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow cursor-pointer ${
              !skill.isActive ? 'opacity-60' : ''
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg">{skill.name}</h3>
              <span className={`px-2 py-1 text-xs rounded-full ${
                skill.category === 'ATHLETIC' ? 'bg-primary/10 text-primary' :
                skill.category === 'TECHNICAL' ? 'bg-green-100 text-green-800' :
                skill.category === 'MENTALITY' ? 'bg-purple-100 text-purple-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {skill.category}
              </span>
            </div>
            
            {skill.description && (
              <p className="text-gray-600 text-sm mb-2">{skill.description}</p>
            )}
            
            <div className="flex justify-between items-center text-sm">
              <div className="flex gap-1">
                {skill.applicableLevels?.map((level) => (
                  <span key={level} className={`px-2 py-1 rounded text-xs ${
                    level === 'ADVANCED' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {level}
                  </span>
                )) || <span className="px-2 py-1 rounded bg-gray-100 text-gray-800">N/A</span>}
              </div>
              <span className="text-gray-500">Order: {skill.displayOrder}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-semibold">{startIndex}</span> to{' '}
            <span className="font-semibold">{endIndex}</span> of{' '}
            <span className="font-semibold">{totalElements}</span> skills
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Items per page:</label>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className={`p-2 rounded-lg ${
                  currentPage === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i;
                  } else if (currentPage <= 2) {
                    pageNum = i;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 5 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 rounded-lg ${
                        pageNum === currentPage
                          ? 'bg-primary text-white'
                          : 'bg-white border border-border text-text-primary hover:bg-secondary-50'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
                className={`p-2 rounded-lg ${
                  currentPage === totalPages - 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}