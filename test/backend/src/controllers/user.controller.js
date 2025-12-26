const userService = require('../services/user.service');
const { success, error } = require('../utils/response');

const getProfile = (req, res) => {
  res.json(success(req.user, '获取成功'));
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await userService.updateUserProfile(req.user.id, req.body);
    res.json(success(user, '更新成功'));
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json(error('用户ID无效', 400));
    }

    const user = await userService.getUserById(id);
    if (!user) {
      return res.status(404).json(error('用户不存在', 404));
    }
    res.json(success(user, '获取成功'));
  } catch (err) {
    next(err);
  }
};

const getUserArticles = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json(error('用户ID无效', 400));
    }

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const result = await userService.getUserArticles(id, page, pageSize);
    res.json(success(result, '获取成功'));
  } catch (err) {
    next(err);
  }
};

const getUserCollections = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json(error('用户ID无效', 400));
    }

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const result = await userService.getUserCollections(id, page, pageSize);
    res.json(success(result, '获取成功'));
  } catch (err) {
    next(err);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const keyword = (req.query.keyword || '').toString();

    const result = await userService.getAllUsers(page, pageSize, keyword);
    res.json(success(result, '获取成功'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById,
  getUserArticles,
  getUserCollections
};
