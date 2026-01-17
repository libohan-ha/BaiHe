#!/usr/bin/env node
/**
 * 图片完整性检查脚本
 * 用于检测数据库中引用的图片文件是否存在
 * 
 * 使用方法:
 *   本地运行: node scripts/check-images.js
 *   Docker: docker exec baihe-backend node /app/check-images.js
 */

const fs = require('fs');
const path = require('path');

// 支持从不同位置运行
const isInBackend = fs.existsSync(path.join(__dirname, '../prisma'));
const UPLOADS_DIR = isInBackend
  ? path.join(__dirname, '../uploads')
  : path.join(__dirname, '../test/backend/uploads');

const prismaPath = isInBackend
  ? path.join(__dirname, '../node_modules/@prisma/client')
  : path.join(__dirname, '../test/backend/node_modules/@prisma/client');

const { PrismaClient } = require(prismaPath);
const prisma = new PrismaClient();

async function checkImages() {
  console.log('🔍 开始检查图片完整性...\n');
  console.log(`📁 上传目录: ${UPLOADS_DIR}\n`);
  
  const missingFiles = [];
  const validFiles = [];

  // 1. 检查文章封面
  console.log('📰 检查文章封面...');
  const articles = await prisma.article.findMany({
    select: { id: true, title: true, coverUrl: true }
  });
  
  for (const article of articles) {
    if (article.coverUrl) {
      const filePath = path.join(UPLOADS_DIR, article.coverUrl.replace('/uploads/', ''));
      if (!fs.existsSync(filePath)) {
        missingFiles.push({
          type: '文章封面',
          id: article.id,
          title: article.title?.slice(0, 30),
          url: article.coverUrl
        });
      } else {
        validFiles.push({ type: '文章封面', url: article.coverUrl });
      }
    }
  }

  // 2. 检查用户头像
  console.log('👤 检查用户头像...');
  const users = await prisma.user.findMany({
    select: { id: true, username: true, avatarUrl: true }
  });
  
  for (const user of users) {
    if (user.avatarUrl && user.avatarUrl.startsWith('/uploads/')) {
      const filePath = path.join(UPLOADS_DIR, user.avatarUrl.replace('/uploads/', ''));
      if (!fs.existsSync(filePath)) {
        missingFiles.push({
          type: '用户头像',
          id: user.id,
          title: user.username,
          url: user.avatarUrl
        });
      } else {
        validFiles.push({ type: '用户头像', url: user.avatarUrl });
      }
    }
  }

  // 3. 检查图库图片
  console.log('🖼️  检查图库图片...');
  const images = await prisma.image.findMany({
    select: { id: true, title: true, url: true }
  });
  
  for (const image of images) {
    if (image.url && image.url.startsWith('/uploads/')) {
      const filePath = path.join(UPLOADS_DIR, image.url.replace('/uploads/', ''));
      if (!fs.existsSync(filePath)) {
        missingFiles.push({
          type: '图库图片',
          id: image.id,
          title: image.title?.slice(0, 30),
          url: image.url
        });
      } else {
        validFiles.push({ type: '图库图片', url: image.url });
      }
    }
  }

  // 4. 检查AI角色图片
  console.log('🤖 检查AI角色图片...');
  try {
    const characters = await prisma.aICharacter.findMany({
      select: { id: true, name: true, avatarUrl: true, backgroundUrl: true, userAvatarUrl: true }
    });
    
    for (const char of characters) {
      for (const field of ['avatarUrl', 'backgroundUrl', 'userAvatarUrl']) {
        const url = char[field];
        if (url && url.startsWith('/uploads/')) {
          const filePath = path.join(UPLOADS_DIR, url.replace('/uploads/', ''));
          if (!fs.existsSync(filePath)) {
            missingFiles.push({
              type: `AI角色${field}`,
              id: char.id,
              title: char.name,
              url: url
            });
          } else {
            validFiles.push({ type: `AI角色${field}`, url: url });
          }
        }
      }
    }
  } catch (e) {
    console.log('   (AICharacter 表不存在，跳过)');
  }

  // 5. 检查聊天消息图片
  console.log('💬 检查聊天消息图片...');
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { images: { isEmpty: false } },
      select: { id: true, images: true }
    });
    
    for (const msg of messages) {
      if (msg.images && Array.isArray(msg.images)) {
        for (const url of msg.images) {
          if (url && url.startsWith('/uploads/')) {
            const filePath = path.join(UPLOADS_DIR, url.replace('/uploads/', ''));
            if (!fs.existsSync(filePath)) {
              missingFiles.push({
                type: '聊天图片',
                id: msg.id,
                title: '消息图片',
                url: url
              });
            } else {
              validFiles.push({ type: '聊天图片', url: url });
            }
          }
        }
      }
    }
  } catch (e) {
    console.log('   (ChatMessage 表不存在或无图片字段，跳过)');
  }

  // 输出结果
  console.log('\n' + '='.repeat(60));
  console.log('📊 检查结果汇总');
  console.log('='.repeat(60));
  
  console.log(`\n✅ 有效图片: ${validFiles.length} 个`);
  console.log(`❌ 缺失图片: ${missingFiles.length} 个`);

  if (missingFiles.length > 0) {
    console.log('\n🚨 缺失的图片列表:');
    console.log('-'.repeat(60));
    
    // 按类型分组
    const grouped = {};
    for (const file of missingFiles) {
      if (!grouped[file.type]) grouped[file.type] = [];
      grouped[file.type].push(file);
    }
    
    for (const [type, files] of Object.entries(grouped)) {
      console.log(`\n【${type}】(${files.length}个)`);
      for (const file of files) {
        console.log(`  - ${file.title || file.id}`);
        console.log(`    URL: ${file.url}`);
      }
    }
    
    console.log('\n💡 建议: 请重新上传这些缺失的图片，或更新数据库中的引用');
  } else {
    console.log('\n🎉 所有图片文件都存在，没有问题！');
  }

  await prisma.$disconnect();
}

checkImages().catch(async (e) => {
  console.error('❌ 检查失败:', e.message);
  await prisma.$disconnect();
  process.exit(1);
});