bug：
后端的，已修复
前端：
1.用户头像应该在气泡右侧 已解决
2.窗口折叠时新增聊天室按钮 已解决
3.刷新时聊天窗口自动拖动到最下方了，应该把聊天窗口固定住，位置不要改变 已解决

待完成：
图片大小限制-头像上传的 已解决（前端限制 50MB：yuri-archive/src/pages/UserCenterPage/index.tsx；后端限制 50MB：test/backend/src/config/multer.js）

编辑、重新生成回复时要携带最新消息图片 已解决（后端：test/backend/src/controllers/aiChat.controller.js）

加入ai进去聊天室

修改路由名字 解决

点击聊天室的用户头像，跳转到主页 解决