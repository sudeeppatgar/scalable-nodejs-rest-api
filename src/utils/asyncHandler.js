/**
 * Async handler wrapper
 * Automatically catches errors in async route handlers
 * Eliminates need for try-catch blocks in controllers
 *
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;

