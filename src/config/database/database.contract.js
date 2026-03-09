/**
 * Database contract (Clean Architecture)
 * Any database implementation MUST follow this shape
 */
export const DatabaseContract = {
    connect: async () => {},
    disconnect: async () => {},
    isConnected: () => false,
  };


  
//   export type Database = {
//     connect: () => Promise<void>;
//     disconnect: () => Promise<void>;
//     isConnected: () => boolean;
//   };
  