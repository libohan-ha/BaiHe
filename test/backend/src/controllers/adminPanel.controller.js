const adminPanelService = require('../services/adminPanel.service');
const { success, error } = require('../utils/response');

const isInvalidId = (value) => !value || value === 'undefined' || value === 'null';

const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const keyword = (req.query.keyword || '').toString();

    const result = await adminPanelService.getUsers(page, pageSize, keyword);
    res.json(success(result, '获取成功'));
  } catch (err) {
    next(err);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isInvalidId(id)) {
      return res.status(400).json(error('用户ID无效', 400));
    }

    const { role } = req.body;
    const normalizedRole = role ? String(role).toUpperCase() : '';
    if (!['USER', 'ADMIN'].includes(normalizedRole)) {
      return res.status(400).json(error('角色必须是 USER 或 ADMIN', 400));
    }

    // 传递操作者的角色进行权限检查
    const operatorRole = req.user.role;
    const updated = await adminPanelService.updateUserRole(id, normalizedRole, operatorRole);
    if (!updated) {
      return res.status(404).json(error('用户不存在', 404));
    }

    res.json(success(updated, '更新成功'));
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isInvalidId(id)) {
      return res.status(400).json(error('用户ID无效', 400));
    }

    // 传递操作者的角色进行权限检查
    const operatorRole = req.user.role;
    const result = await adminPanelService.deleteUser(id, operatorRole);
    if (!result) {
      return res.status(404).json(error('用户不存在', 404));
    }

    res.json(success(result, '删除成功'));
  } catch (err) {
    next(err);
  }
};

const getArticles = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const status = req.query.status || null;
    const keyword = (req.query.keyword || '').toString();

    const result = await adminPanelService.getArticles(page, pageSize, status, keyword);
    res.json(success(result, '获取成功'));
  } catch (err) {
    next(err);
  }
};

const updateArticleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isInvalidId(id)) {
      return res.status(400).json(error('文章ID无效', 400));
    }

    const { status } = req.body;
    if (!status) {
      return res.status(400).json(error('文章状态不能为空', 400));
    }

    const updated = await adminPanelService.updateArticleStatus(id, status);
    if (!updated) {
      return res.status(404).json(error('文章不存在', 404));
    }

    res.json(success(updated, '更新成功'));
  } catch (err) {
    next(err);
  }
};

const deleteArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isInvalidId(id)) {
      return res.status(400).json(error('文章ID无效', 400));
    }

    const result = await adminPanelService.deleteArticle(id);
    if (!result) {
      return res.status(404).json(error('文章不存在', 404));
    }

    res.json(success(result, '删除成功'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsers,
  updateUserRole,
  deleteUser,
  getArticles,
  updateArticleStatus,
  deleteArticle
};

