'use client';

import { Skill, SkillCategory, SKILL_CATEGORIES, getCategoryInfo } from '@/types/skills';

interface SkillCategoryTabsProps {
  skills: Skill[];
  activeCategory: SkillCategory | 'ALL';
  onCategoryChange: (category: SkillCategory | 'ALL') => void;
}

export default function SkillCategoryTabs({ 
  skills, 
  activeCategory, 
  onCategoryChange 
}: SkillCategoryTabsProps) {
  
  // Calculate skill counts per category
  const getCategoryCount = (category: SkillCategory | 'ALL'): number => {
    if (category === 'ALL') return skills.length;
    return skills.filter(skill => skill.category === category).length;
  };

  const getActiveCategoryCount = (category: SkillCategory | 'ALL'): number => {
    if (category === 'ALL') return skills.filter(skill => skill.isActive).length;
    return skills.filter(skill => skill.category === category && skill.isActive).length;
  };

  const allTabs = [
    {
      key: 'ALL' as const,
      label: 'All Skills',
      icon: '🎯',
      color: 'bg-gray-600'
    },
    ...SKILL_CATEGORIES
  ];

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-1">
      <div className="flex flex-wrap gap-1">
        {allTabs.map((tab) => {
          const isActive = activeCategory === tab.key;
          const totalCount = getCategoryCount(tab.key);
          const activeCount = getActiveCategoryCount(tab.key);
          
          return (
            <button
              key={tab.key}
              onClick={() => onCategoryChange(tab.key)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive 
                  ? `${tab.color} text-white shadow-lg scale-105` 
                  : 'text-blue-200 hover:text-white hover:bg-white/10'
                }
              `}
            >
              {/* Icon */}
              <span className="text-lg">{tab.icon}</span>
              
              {/* Label and Counts */}
              <div className="flex flex-col items-start">
                <span className="font-semibold">{tab.label}</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className={isActive ? 'text-white/90' : 'text-blue-300'}>
                    {totalCount} total
                  </span>
                  {totalCount > 0 && (
                    <>
                      <span className={isActive ? 'text-white/60' : 'text-blue-400'}>•</span>
                      <span className={`${
                        activeCount === totalCount 
                          ? (isActive ? 'text-green-200' : 'text-green-400')
                          : (isActive ? 'text-yellow-200' : 'text-yellow-400')
                      }`}>
                        {activeCount} active
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Badge for count */}
              {totalCount > 0 && (
                <div className={`
                  ml-auto px-2 py-1 rounded-full text-xs font-bold
                  ${isActive 
                    ? 'bg-white/20 text-white' 
                    : 'bg-blue-500/20 text-blue-300'
                  }
                `}>
                  {totalCount}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Category Summary */}
      {activeCategory !== 'ALL' && (
        <div className="mt-4 p-3 bg-white/5 rounded-lg">
          <div className="flex items-center gap-3">
            {(() => {
              const categoryInfo = getCategoryInfo(activeCategory as SkillCategory);
              const totalCount = getCategoryCount(activeCategory);
              const activeCount = getActiveCategoryCount(activeCategory);
              
              return (
                <>
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    ${categoryInfo?.color || 'bg-gray-500'}
                  `}>
                    {categoryInfo?.icon || '🎯'}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-white font-medium">
                      {categoryInfo?.label || activeCategory} Skills
                    </h4>
                    <p className="text-blue-200 text-sm">
                      {totalCount} skills in this category
                      {activeCount < totalCount && (
                        <span className="text-yellow-400 ml-1">
                          ({totalCount - activeCount} inactive)
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Progress indicator */}
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${categoryInfo?.color || 'bg-gray-500'}`}
                          style={{ width: `${totalCount > 0 ? (activeCount / totalCount) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-blue-200">
                        {totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* All Skills Summary */}
      {activeCategory === 'ALL' && skills.length > 0 && (
        <div className="mt-4 p-3 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium">All Skills Overview</h4>
              <p className="text-blue-200 text-sm">
                {skills.length} total skills across {SKILL_CATEGORIES.length} categories
              </p>
            </div>

            {/* Category breakdown */}
            <div className="flex items-center gap-2">
              {SKILL_CATEGORIES.map((category) => {
                const count = getCategoryCount(category.key);
                if (count === 0) return null;
                
                return (
                  <div 
                    key={category.key}
                    className={`
                      flex items-center gap-1 px-2 py-1 rounded-full text-xs
                      ${category.color} text-white
                    `}
                  >
                    <span>{category.icon}</span>
                    <span>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}