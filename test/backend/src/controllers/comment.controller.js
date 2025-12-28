const commentService = require('../services/comment.service');
const { success, error } = require('../utils/response');

const getComments = async (req, res, next) => {
  try {
    const { articleId, imageId } = req.query;
    
    if (!articleId && !imageId) {
      return res.status(400).json(error('文章ID或图片ID不能为空', 400));
    }

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const result = await commentService.getComments({ articleId, imageId, page, pageSize });
    res.json(success(result, '获取成功'));
  } catch (err) {
    next(err);
  }
};

const createComment = async (req, res, next) => {
  try {
    const { content, articleId, imageId, parentId } = req.body;
    const comment = await commentService.createComment(req.user.id, { articleId, imageId, content, parentId });
    res.status(201).json(success(comment, '评论成功'));
  } catch (err) {
    next(err);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json(error('评论ID无效', 400));
    }

    const isAdmin = req.user.role === 'ADMIN';
    const result = await commentService.deleteComment(req.user.id, id, isAdmin);
    if (!result) {
      return res.status(404).json(error('评论不存在或无权删除', 404));
    }
    res.json(success(result, '删除成功'));
  } catch (err) {
    next(err);
  }
};

const getCommentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json(error('评论ID无效', 400));
    }

    const comment = await commentService.getCommentById(id);
    if (!comment) {
      return res.status(404).json(error('评论不存在', 404));
    }
    res.json(success(comment, '获取成功'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getComments,
  createComment,
  deleteComment,
  getCommentById
};
