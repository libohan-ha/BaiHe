const tagService = require('../services/tag.service');
const { success, error } = require('../utils/response');

const getTags = async (req, res, next) => {
  try {
    const result = await tagService.getTags();
    res.json(success(result, '获取成功'));
  } catch (err) {
    next(err);
  }
};

const createTag = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json(error('标签名称不能为空', 400));
    }

    const tag = await tagService.createTag(name.trim());
    res.status(201).json(success(tag, '创建成功'));
  } catch (err) {
    next(err);
  }
};

const updateTag = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json(error('标签ID无效', 400));
    }

    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json(error('标签名称不能为空', 400));
    }

    const tag = await tagService.updateTag(id, name.trim());
    if (!tag) {
      return res.status(404).json(error('标签不存在', 404));
    }

    res.json(success(tag, '更新成功'));
  } catch (err) {
    next(err);
  }
};

const deleteTag = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json(error('标签ID无效', 400));
    }

    const result = await tagService.deleteTag(id);
    if (!result) {
      return res.status(404).json(error('标签不存在', 404));
    }
    res.json(success(result, '删除成功'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTags,
  createTag,
  updateTag,
  deleteTag
};
