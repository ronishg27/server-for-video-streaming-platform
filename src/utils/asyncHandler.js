/**
 * Wraps a request handler function and returns a new function that handles asynchronous operations.
 * If the promise returned by the request handler is resolved, the value is passed to the next middleware function.
 * If the promise is rejected with an error, the error is caught and passed to the next middleware function.
 *
 * @param {function} requestHandler - The request handler function to be wrapped.
 * @returns {function} - The new function that handles asynchronous operations.
 */
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };

// const asyncHandler = () => {};
// const asyncHandler = (fn) => {()=>{}};  //this is same as below code

// just a wrapper to handle async and try/catch

// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (error) {
//     res.status(error.code || 500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
