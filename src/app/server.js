/**
 * Application Server Lifecycle
 * Owns startup & shutdown logic
 */
export const createServer = ({
    app,
    database,
    redis,
    port,
    env,
  }) => {
    let httpServer;
  
    const start = async () => {
      console.log('🚀 Starting server...');
  
      // Connect dependencies
      await database.connect();
      await redis.connect();
  
      // Start HTTP server
      httpServer = app.listen(port, () => {
        console.log(`✅ Server running on port ${port}`);
        console.log(`🌍 Environment: ${env}`);
        console.log(`📡 API available at http://localhost:${port}`);
      });
    };
  
    const stop = async (signal = 'UNKNOWN') => {
      console.log(`\n${signal} received. Shutting down...`);
  
      if (httpServer) {
        await new Promise((resolve) => httpServer.close(resolve));
        console.log('✅ HTTP server closed');
      }
  
      await database.disconnect();
      await redis.disconnect();
  
      console.log('✅ All connections closed');
    };
  
    return { start, stop };
  };
  