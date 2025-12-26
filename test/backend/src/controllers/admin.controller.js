const adminService = require('../services/admin.service');
const { success, error } = require('../utils/response');

const getAdmins = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const result = await adminService.getAdmins(page, pageSize);
    res.json(success(result, '获取成功'));
  } catch (err) {
    next(err);
  }
};

const createAdmin = async (req, res, next) => {
  try {
    const { email, username, password, role } = req.body;
    
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json(error('邮箱不能为空', 400));
    }
    
    if (!username || typeof username !== 'string' || !username.trim()) {
      return res.status(400).json(error('用户名不能为空', 400));
    }
    
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json(error('密码至少6位', 400));
    }
    
    if (role && !['ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return res.status(400).json(error('角色必须是 ADMIN 或 SUPER_ADMIN', 400));
    }

    const admin = await adminService.createAdmin(
      email.trim(),
      username.trim(),
      password,
      role || 'ADMIN'
    );
    
    res.status(201).json(success(admin, '创建成功'));
  } catch (err) {
    next(err);
  }
};

const updateAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json(error('管理员ID无效', 400));
    }

    const { email, username, password, role } = req.body;
    
    if (email !== undefined && (typeof email !== 'string' || !email.trim())) {
      return res.status(400).json(error('邮箱不能为空', 400));
    }
    
    if (username !== undefined && (typeof username !== 'string' || !username.trim())) {
      return res.status(400).json(error('用户名不能为空', 400));
    }
    
    if (password !== undefined && (typeof password !== 'string' || password.length < 6)) {
      return res.status(400).json(error('密码至少6位', 400));
    }
    
    if (role !== undefined && !['ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return res.status(400).json(error('角色必须是 ADMIN 或 SUPER_ADMIN', 400));
    }

    const updateData = {};
    if (email !== undefined) updateData.email = email.trim();
    if (username !== undefined) updateData.username = username.trim();
    if (password !== undefined) updateData.password = password;
    if (role !== undefined) updateData.role = role;

    const admin = await adminService.updateAdmin(id, updateData);
    if (!admin) {
      return res.status(404).json(error('管理员不存在', 404));
    }

    res.json(success(admin, '更新成功'));
  } catch (err) {
    next(err);
  }
};

const deleteAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json(error('管理员ID无效', 400));
    }

    const result = await adminService.deleteAdmin(id);
    if (!result) {
      return res.status(404).json(error('管理员不存在', 404));
    }
    
    res.json(success(result, '删除成功'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin
};
