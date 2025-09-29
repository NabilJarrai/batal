'use client';

import { useState, useEffect } from 'react';
import { 
  Skill, 
  SkillCategory, 
  SkillFormData, 
  SkillCreateRequest, 
  SkillUpdateRequest 
} from '@/types/skills';
import { skillsAPI } from '@/lib/api/skills';
import { useNotification } from '@/contexts/NotificationContext';
import SkillForm from './SkillForm';
import SkillCard from './SkillCard';
import SkillCategoryTabs from './SkillCategoryTabs';
import BulkSkillCreator from './BulkSkillCreator';

type ModalState = 'none' | 'create' | 'edit' | 'bulk' | 'initialize';

export default function SkillsManagement() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<ModalState>('none');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [activeCategory, setActiveCategory] = useState<SkillCategory | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 6;
  
  const { showError, showSuccess } = useNotification();

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    setLoading(true);
    try {
      // Request all skills without pagination for management view
      const data = await skillsAPI.getAll({ size: 1000 });
      // Handle paginated response
      const skillsArray = data.content || [];
      setSkills(skillsArray);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to load skills');
      setSkills([]); // Ensure skills is always an array
    } finally {
      setLoading(false);
    }
  };

  const filteredSkills = (skills || []).filter(skill => {
    const matchesCategory = activeCategory === 'ALL' || skill.category === activeCategory;
    const matchesSearch = !searchTerm || skill.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         skill.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesActive = showInactive || skill.isActive;
    
    return matchesCategory && matchesSearch && matchesActive;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredSkills.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSkills = filteredSkills.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [activeCategory, searchTerm, showInactive]);

  const handleCreateSkill = async (data: SkillFormData) => {
    try {
      const request: SkillCreateRequest = {
        name: data.name,
        category: data.category,
        applicableLevels: data.applicableLevels,
        description: data.description || undefined,
        isActive: data.isActive
      };

      await skillsAPI.create(request);
      await loadSkills();
      setModalState('none');
      showSuccess('Skill created successfully!');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to create skill');
      throw error;
    }
  };

  const handleUpdateSkill = async (data: SkillFormData) => {
    if (!selectedSkill) return;

    try {
      const request: SkillUpdateRequest = {
        name: data.name,
        description: data.description || undefined,
        isActive: data.isActive
      };

      await skillsAPI.update(selectedSkill.id, request);
      await loadSkills();
      setModalState('none');
      setSelectedSkill(null);
      showSuccess('Skill updated successfully!');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to update skill');
      throw error;
    }
  };

  const handleDeleteSkill = async (skill: Skill) => {
    try {
      await skillsAPI.delete(skill.id);
      await loadSkills();
      showSuccess('Skill deleted successfully!');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to delete skill');
    }
  };

  const handleToggleActive = async (skill: Skill) => {
    try {
      const request: SkillUpdateRequest = {
        name: skill.name,
        description: skill.description,
        isActive: !skill.isActive
      };

      await skillsAPI.update(skill.id, request);
      await loadSkills();
      showSuccess(`Skill ${skill.isActive ? 'deactivated' : 'activated'} successfully!`);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to update skill status');
    }
  };

  const handleBulkCreate = async (skillRequests: SkillCreateRequest[]) => {
    try {
      await skillsAPI.bulkCreate(skillRequests);
      await loadSkills();
      setModalState('none');
      showSuccess(`${skillRequests.length} skills created successfully!`);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to create skills');
      throw error;
    }
  };

  const handleInitializeDefaults = async () => {
    try {
      await skillsAPI.initializeDefaults();
      await loadSkills();
      setModalState('none');
      showSuccess('Default skills initialized successfully!');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to initialize default skills');
    }
  };

  const openEditModal = (skill: Skill) => {
    setSelectedSkill(skill);
    setModalState('edit');
  };

  const closeModal = () => {
    setModalState('none');
    setSelectedSkill(null);
  };

  const hasSkills = skills.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Skills Management</h2>
          <p className="text-text-secondary mt-1">
            Manage skill definitions for player assessments ({skills.length} total)
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setModalState('create')}
            className="btn-success btn-md flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Skill
          </button>
          
          <button
            onClick={() => setModalState('bulk')}
            className="btn-primary btn-md flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Bulk Create
          </button>

          {!hasSkills && (
            <button
              onClick={() => setModalState('initialize')}
              className="btn-outline btn-md flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Initialize Defaults
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-background border border-border rounded-xl p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search skills by name or description..."
                className="input-base pl-10"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="w-4 h-4 text-primary bg-secondary-50 border-border rounded focus:ring-primary"
              />
              <span className="text-text-secondary text-sm">Show inactive skills</span>
            </label>

            <div className="text-text-secondary text-sm">
              Showing {filteredSkills.length} of {skills.length} skills
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      {hasSkills && (
        <SkillCategoryTabs
          skills={skills}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      )}

      {/* Skills Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-secondary-50 rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-secondary-100 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-secondary-100 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-secondary-100 rounded w-1/2"></div>
                </div>
              </div>
              <div className="h-12 bg-secondary-100 rounded mb-3"></div>
              <div className="h-8 bg-secondary-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredSkills.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedSkills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                onEdit={openEditModal}
                onDelete={handleDeleteSkill}
                onToggleActive={handleToggleActive}
                showActions={true}
              />
            ))}
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className={`p-2 rounded-lg transition-colors ${
                  currentPage === 0
                    ? 'bg-white/5 text-disabled cursor-not-allowed'
                    : 'bg-secondary-50 text-text-primary hover:bg-secondary-100'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => {
                  // Show max 5 page buttons
                  if (totalPages <= 5 || i === 0 || i === totalPages - 1 || Math.abs(i - currentPage) <= 1) {
                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`px-3 py-1 rounded-lg transition-colors ${
                          i === currentPage
                            ? 'bg-cyan-600 text-text-primary'
                            : 'bg-secondary-50 text-text-primary hover:bg-secondary-100'
                        }`}
                      >
                        {i + 1}
                      </button>
                    );
                  } else if (i === 1 && currentPage > 2) {
                    return <span key={i} className="px-2 text-text-secondary">...</span>;
                  } else if (i === totalPages - 2 && currentPage < totalPages - 3) {
                    return <span key={i} className="px-2 text-text-secondary">...</span>;
                  }
                  return null;
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage === totalPages - 1}
                className={`p-2 rounded-lg transition-colors ${
                  currentPage === totalPages - 1
                    ? 'bg-white/5 text-disabled cursor-not-allowed'
                    : 'bg-secondary-50 text-text-primary hover:bg-secondary-100'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <span className="ml-4 text-text-secondary text-sm">
                Page {currentPage + 1} of {totalPages} ({filteredSkills.length} skills)
              </span>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <div className="bg-background border border-border rounded-xl p-8">
            <svg className="mx-auto h-16 w-16 text-text-secondary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              {searchTerm || activeCategory !== 'ALL' || !showInactive 
                ? 'No skills match your filters' 
                : 'No skills found'
              }
            </h3>
            <p className="text-text-secondary mb-6">
              {!hasSkills 
                ? 'Get started by initializing the default skills or creating your own.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {!hasSkills ? (
                <>
                  <button
                    onClick={() => setModalState('initialize')}
                    className="btn-outline btn-md"
                  >
                    Initialize Default Skills
                  </button>
                  <button
                    onClick={() => setModalState('create')}
                    className="btn-success btn-md"
                  >
                    Create First Skill
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setActiveCategory('ALL');
                    setShowInactive(false);
                  }}
                  className="btn-primary btn-md"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {modalState === 'create' && (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900/20 via-slate-800/30 to-slate-900/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-screen overflow-y-auto">
            <SkillForm
              onSubmit={handleCreateSkill}
              onCancel={closeModal}
            />
          </div>
        </div>
      )}

      {modalState === 'edit' && selectedSkill && (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900/20 via-slate-800/30 to-slate-900/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-screen overflow-y-auto">
            <SkillForm
              skill={selectedSkill}
              onSubmit={handleUpdateSkill}
              onCancel={closeModal}
            />
          </div>
        </div>
      )}

      {modalState === 'bulk' && (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900/20 via-slate-800/30 to-slate-900/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl max-h-screen overflow-y-auto">
            <BulkSkillCreator
              onSubmit={handleBulkCreate}
              onCancel={closeModal}
            />
          </div>
        </div>
      )}

      {modalState === 'initialize' && (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900/20 via-slate-800/30 to-slate-900/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-text-primary mb-4">Initialize Default Skills</h3>
            <p className="text-text-secondary mb-6">
              This will create 16 default skills across 4 categories (Athletic, Technical, Mentality, Personality) 
              for Development level players. You can modify them later.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInitializeDefaults}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-text-primary rounded-lg font-medium transition-colors"
              >
                Initialize Skills
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}