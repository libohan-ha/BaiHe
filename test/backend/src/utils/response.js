const success = (data = null, message = 'success') => {
  return {
    code: 200,
    message,
    data
  };
};

const error = (message = 'error', code = 400, data = null) => {
  return {
    code,
    message,
    data
  };
};

const paginated = (data, pagination) => {
  return {
    code: 200,
    message: 'success',
    data: {
      ...data,
      pagination
    }
  };
};

module.exports = { success, error, paginated };
