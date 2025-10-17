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
      emoji: '📈',
      color: 'bg-gradient-to-br from-gray-600 to-gray-700',
      bgColor: 'bg-gray-500/20',
      borderColor: 'border-gray-400/30',
      textColor: 'text-gray-300',
      description: 'View all skills across categories'
    },
    ...SKILL_CATEGORIES
  ];

  return (
    <div className="card-base p-2">
      <div className="flex flex-wrap gap-2 relative">
        {allTabs.map((tab) => {
          const isActive = activeCategory === tab.key;
          const totalCount = getCategoryCount(tab.key);
          const activeCount = getActiveCategoryCount(tab.key);

          return (
            <button
              key={tab.key}
              onClick={() => onCategoryChange(tab.key)}
              title={tab.description} // Add tooltip
              className={`
                relative flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-semibold
                transition-all duration-300 transform hover:scale-105 group
                hover:z-20 focus:z-20 focus:outline-none focus:ring-2 focus:ring-primary/50
                active:scale-100
                ${isActive
                  ? `${tab.color} text-white shadow-xl scale-105 border-2 border-white/40`
                  : 'text-text-primary hover:text-white hover:shadow-lg bg-background border border-border hover:border-transparent hover:bg-gradient-to-br hover:from-primary hover:to-primary-dark'
                }
              `}
            >
              {/* Icon with enhanced hover effect */}
              <div className="relative">
                <span className="text-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  {tab.icon}
                </span>
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-white/60 rounded-full animate-pulse" />
                )}
                {/* Hover description popup - Enhanced contrast */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-white text-gray-800 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-50 shadow-2xl border border-gray-300">
                  {tab.description}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-white"></div>
                </div>
              </div>

              {/* Label and Counts */}
              <div className="flex flex-col items-start">
                <span className="font-bold text-base">{tab.label}</span>
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      isActive ? 'bg-white/70' : 'bg-text-secondary'
                    }`} />
                    <span className={isActive ? 'text-white/90' : 'text-text-secondary'}>
                      {totalCount} total
                    </span>
                  </div>
                  {totalCount > 0 && (
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        activeCount === totalCount
                          ? (isActive ? 'bg-green-300' : 'bg-green-500')
                          : (isActive ? 'bg-yellow-300' : 'bg-yellow-500')
                      } animate-pulse`} />
                      <span className={`font-medium ${
                        activeCount === totalCount
                          ? (isActive ? 'text-green-200' : 'text-green-400')
                          : (isActive ? 'text-yellow-200' : 'text-yellow-400')
                      }`}>
                        {activeCount} active
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Badge for count - Always show */}
              <div className={`
                ml-auto px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300
                flex items-center gap-1.5 shadow-lg
                ${isActive
                  ? 'bg-black/20 text-white border border-white/30'
                  : 'bg-secondary text-text-primary border border-border'
                }
                group-hover:scale-105
              `}>
                <span className="text-xs">{(tab as any).emoji || tab.icon}</span>
                <span>{totalCount}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Category Summary */}
      {activeCategory !== 'ALL' && (
        <div className="mt-6 p-4 card-base">
          <div className="flex items-center gap-4">
            {(() => {
              const categoryInfo = getCategoryInfo(activeCategory as SkillCategory);
              const totalCount = getCategoryCount(activeCategory);
              const activeCount = getActiveCategoryCount(activeCategory);

              return (
                <>
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center text-xl
                    ${categoryInfo?.color || 'bg-gray-500'}
                    shadow-lg transition-transform duration-300 hover:scale-110
                    before:absolute before:inset-0 before:rounded-xl before:bg-white/20 before:opacity-0
                    hover:before:opacity-100 before:transition-opacity before:duration-300
                    relative
                  `}>
                    <span className="relative z-10">{categoryInfo?.icon || '🎯'}</span>
                  </div>

                  <div className="flex-1">
                    <h4 className="text-text-primary font-bold text-lg mb-1">
                      {categoryInfo?.label || activeCategory} Skills
                    </h4>
                    <p className="text-text-secondary text-sm">
                      {totalCount} skills in this category
                      {activeCount < totalCount && (
                        <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 bg-yellow-600 border border-yellow-500 rounded-md text-yellow-200 text-xs font-medium">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92z" clipRule="evenodd" />
                          </svg>
                          {totalCount - activeCount} inactive
                        </span>
                      )}
                    </p>
                    {categoryInfo?.description && (
                      <p className="text-text-secondary text-xs mt-1 opacity-80">
                        {categoryInfo.description}
                      </p>
                    )}
                  </div>

                  {/* Progress indicator */}
                  <div className="text-right">
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <div className="text-text-primary font-bold text-xl">
                          {totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0}%
                        </div>
                        <div className="text-text-secondary text-xs">
                          {activeCount}/{totalCount} active
                        </div>
                      </div>
                      <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden shadow-inner">
                        <div
                          className={`h-full transition-all duration-500 ease-out ${categoryInfo?.color || 'bg-gray-500'} rounded-full shadow-sm`}
                          style={{ width: `${totalCount > 0 ? (activeCount / totalCount) * 100 : 0}%` }}
                        />
                      </div>
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
        <div className="mt-6 p-4 card-base">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-text-primary font-bold text-lg mb-1">All Skills Overview</h4>
              <p className="text-text-secondary text-sm">
                {skills.length} total skills across {SKILL_CATEGORIES.length} categories
              </p>
            </div>

            {/* Category breakdown */}
            <div className="flex items-center gap-3">
              {SKILL_CATEGORIES.map((category) => {
                const count = getCategoryCount(category.key);
                if (count === 0) return null;

                return (
                  <div
                    key={category.key}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold
                      ${category.color} text-white shadow-lg border border-border
                      transition-transform duration-300 hover:scale-105
                    `}
                  >
                    <span className="text-sm">{(category as any).emoji || category.icon}</span>
                    <span>{category.label}</span>
                    <div className="w-1 h-1 bg-white/50 rounded-full" />
                    <span className="font-bold">{count}</span>
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