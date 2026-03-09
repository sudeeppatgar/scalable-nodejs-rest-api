import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

/**
 * Validation middleware
 * Checks express-validator results and returns formatted errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
    }));

    return next(
      ApiError.unprocessableEntity('Validation failed', formattedErrors)
    );
  }

  next();
};

/**
 * Custom validation error formatter
 * Can be used with express-validator
 */
const customErrorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  return {
    location,
    message: msg,
    param,
    value,
    nestedErrors,
  };
};

export { validate, customErrorFormatter };

