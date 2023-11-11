// using promises

const asyncHandler = (requesHandler) => {
  (req, res, next) => {
    Promise.resolve().catch((err) => next(err));
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
