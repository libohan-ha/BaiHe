const authService = require('../services/auth.service');

const register = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({
        code: 400,
        message: '邮箱、用户名和密码不能为空',
        data: null
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        code: 400,
        message: '密码长度至少6位',
        data: null
      });
    }

    const { user, token } = await authService.register(email, username, password);

    res.status(201).json({
      code: 200,
      message: '注册成功',
      data: { user, token }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    // 支持 email 或 identifier 字段（兼容旧版本）
    const identifier = req.body.identifier || req.body.email;
    const { password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        code: 400,
        message: '邮箱/用户名和密码不能为空',
        data: null
      });
    }

    const { user, token } = await authService.login(identifier, password);

    res.json({
      code: 200,
      message: '登录成功',
      data: { user, token }
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);

    res.json({
      code: 200,
      message: 'success',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { username, bio, avatarUrl } = req.body;

    const user = await authService.updateProfile(req.user.id, {
      username,
      bio,
      avatarUrl
    });

    res.json({
      code: 200,
      message: '更新成功',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        code: 400,
        message: '原密码和新密码不能为空',
        data: null
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        code: 400,
        message: '新密码长度至少6位',
        data: null
      });
    }

    await authService.updatePassword(req.user.id, oldPassword, newPassword);

    res.json({
      code: 200,
      message: '密码更新成功',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  updatePassword
};
