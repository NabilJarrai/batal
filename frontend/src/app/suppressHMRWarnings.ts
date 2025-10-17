// Suppress WebSocket HMR warnings in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  console.error = (...args) => {
    if (
      args[0]?.includes?.('WebSocket') || 
      args[0]?.includes?.('ws://localhost:3000/_next/webpack-hmr') ||
      args[0]?.toString?.()?.includes?.('WebSocket')
    ) {
      // Suppress WebSocket HMR warnings
      return;
    }
    originalError.apply(console, args);
  };
}

export {};