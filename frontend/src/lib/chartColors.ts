export const chartColors = {
  // Design system aligned colors
  primary: '#1E40AF', // Primary blue from design system
  accent: {
    teal: '#14B8A6',   // Accent teal
    red: '#EF4444',    // Accent red
    yellow: '#F59E0B', // Accent yellow
  },
  text: {
    primary: '#111827',   // Dark gray/black
    secondary: '#6B7280', // Medium gray
    light: '#9CA3AF',     // Light gray for grid lines
  },
  background: {
    primary: '#FFFFFF',   // White background
    card: '#F9FAFB',      // Light gray for chart backgrounds
    overlay: 'rgba(255, 255, 255, 0.9)', // Semi-transparent white
  },
  // Category specific colors (consistent across all charts)
  categories: {
    ATHLETIC: '#1E40AF',     // Primary blue
    TECHNICAL: '#14B8A6',    // Accent teal
    MENTALITY: '#7C3AED',    // Purple (from skill categories)
    PERSONALITY: '#DC2626',  // Red
  },
  // Chart specific styling
  grid: 'rgba(17, 24, 39, 0.1)',      // Light gray grid lines
  axis: 'rgba(17, 24, 39, 0.3)',      // Darker axis lines
  hover: 'rgba(30, 64, 175, 0.1)',    // Light blue hover state
};

// Helper function to get category color
export const getCategoryColor = (category: string): string => {
  return chartColors.categories[category as keyof typeof chartColors.categories] || chartColors.primary;
};

// Helper function to get category color with transparency
export const getCategoryColorWithAlpha = (category: string, alpha: number): string => {
  const color = getCategoryColor(category);
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Get all category colors as array (for multiple category charts)
export const getCategoryColorsArray = (): string[] => {
  return Object.values(chartColors.categories);
};