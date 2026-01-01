const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      return res.status(409).json({
        code: 409,
        message: '该资源已存在',
        data: null
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        code: 404,
        message: '资源不存在',
        data: null
      });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({
        code: 400,
        message: '关联数据不存在',
        data: null
      });
    }
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      code: 400,
      message: err.message,
      data: null
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      code: 401,
      message: 'Token 无效',
      data: null
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      code: 401,
      message: 'Token 已过期',
      data: null
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';

  return res.status(statusCode).json({
    code: statusCode,
    message,
    data: null,
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 && { stack: err.stack })
  });
};

module.exports = errorHandler;
