/**
 * 创建带状态码的错误对象
 * @param {number} statusCode - HTTP 状态码
 * @param {string} message - 错误信息
 * @returns {Error} 带 statusCode 属性的 Error 对象
 */
const createError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

module.exports = { createError };
