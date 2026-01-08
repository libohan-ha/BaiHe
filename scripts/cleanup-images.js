#!/usr/bin/env node
/**
 * 图片清理脚本
 * 用于删除uploads目录中未被数据库引用的孤儿文件
 * 
 * 使用方法:
 *   预览模式（不删除）: node scripts/cleanup-images.js
 *   实际删除: node scripts/cleanup-images.js --delete
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

// 是否真正删除文件
const shouldDelete = process.argv.includes('--delete');

async function cleanup() {
  console.log('🧹 开始清理未使用的图片...\n');
  console.log(`📁 扫描目录: ${UPLOADS_DIR}`);
  console.log(`🔧 模式: ${shouldDelete ? '⚠️  删除模式' : '预览模式（添加 --delete 参数执行删除）'}\n`);
  
  // 1. 收集数据库中所有引用的图片URL
  console.log('📊 正在收集数据库中的图片引用...');
  const usedUrls = new Set();

  // 用户头像
  const users = await prisma.user.findMany({ select: { avatarUrl: true } });
  users.forEach(u => u.avatarUrl && usedUrls.add(u.avatarUrl));

  // 文章封面
  const articles = await prisma.article.findMany({ select: { coverUrl: true } });
  articles.forEach(a => a.coverUrl && usedUrls.add(a.coverUrl));

  // 图库图片
  const images = await prisma.image.findMany({ select: { url: true } });
  images.forEach(i => {
    i.url && usedUrls.add(i.url);
  });

  // 隐私图片
  try {
    const privateImages = await prisma.privateImage.findMany({ select: { url: true } });
    privateImages.forEach(i => {
      i.url && usedUrls.add(i.url);
    });
  } catch (e) { /* 表不存在 */ }

  // AI角色
  try {
    const characters = await prisma.aICharacter.findMany({ 
      select: { avatarUrl: true, backgroundUrl: true, userAvatarUrl: true } 
    });
    characters.forEach(c => {
      c.avatarUrl && usedUrls.add(c.avatarUrl);
      c.backgroundUrl && usedUrls.add(c.backgroundUrl);
      c.userAvatarUrl && usedUrls.add(c.userAvatarUrl);
    });
  } catch (e) { /* 表不存在 */ }

  // 聊天消息图片
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { NOT: { images: { equals: [] } } },
      select: { images: true }
    });
    messages.forEach(m => {
      if (m.images && Array.isArray(m.images)) {
        m.images.forEach(url => usedUrls.add(url));
      }
    });
  } catch (e) { /* 表不存在或无images字段 */ }

  console.log(`   找到 ${usedUrls.size} 个被引用的图片\n`);

  // 2. 扫描uploads目录中的所有文件
  console.log('📂 正在扫描文件系统...');
  const allFiles = [];
  const subdirs = ['avatars', 'covers', 'gallery', 'chat', 'private'];
  
  for (const subdir of subdirs) {
    const dirPath = path.join(UPLOADS_DIR, subdir);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      files.forEach(file => {
        if (!file.startsWith('.')) { // 忽略隐藏文件
          allFiles.push({
            subdir,
            filename: file,
            fullPath: path.join(dirPath, file),
            url: `/uploads/${subdir}/${file}`
          });
        }
      });
    }
  }
  console.log(`   找到 ${allFiles.length} 个文件\n`);

  // 3. 找出未使用的文件
  const orphanFiles = allFiles.filter(f => !usedUrls.has(f.url));
  const usedFiles = allFiles.filter(f => usedUrls.has(f.url));

  // 计算大小
  let orphanSize = 0;
  let usedSize = 0;
  
  orphanFiles.forEach(f => {
    try {
      orphanSize += fs.statSync(f.fullPath).size;
    } catch (e) {}
  });
  
  usedFiles.forEach(f => {
    try {
      usedSize += fs.statSync(f.fullPath).size;
    } catch (e) {}
  });

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  // 4. 输出统计
  console.log('='.repeat(60));
  console.log('📊 统计结果');
  console.log('='.repeat(60));
  console.log(`\n✅ 正在使用的文件: ${usedFiles.length} 个 (${formatSize(usedSize)})`);
  console.log(`🗑️  未使用的文件: ${orphanFiles.length} 个 (${formatSize(orphanSize)})`);

  if (orphanFiles.length === 0) {
    console.log('\n🎉 没有未使用的文件，目录很干净！');
    await prisma.$disconnect();
    return;
  }

  // 按目录分组显示
  console.log('\n📋 未使用的文件列表:');
  console.log('-'.repeat(60));
  
  const grouped = {};
  orphanFiles.forEach(f => {
    if (!grouped[f.subdir]) grouped[f.subdir] = [];
    grouped[f.subdir].push(f);
  });

  for (const [subdir, files] of Object.entries(grouped)) {
    const subdirSize = files.reduce((sum, f) => {
      try { return sum + fs.statSync(f.fullPath).size; } catch { return sum; }
    }, 0);
    console.log(`\n【${subdir}】${files.length} 个文件 (${formatSize(subdirSize)})`);
    
    // 只显示前5个
    const showFiles = files.slice(0, 5);
    showFiles.forEach(f => console.log(`  - ${f.filename}`));
    if (files.length > 5) {
      console.log(`  ... 还有 ${files.length - 5} 个文件`);
    }
  }

  // 5. 删除操作
  if (shouldDelete) {
    console.log('\n⚠️  正在删除未使用的文件...');
    let deletedCount = 0;
    let deletedSize = 0;
    
    for (const f of orphanFiles) {
      try {
        const size = fs.statSync(f.fullPath).size;
        fs.unlinkSync(f.fullPath);
        deletedCount++;
        deletedSize += size;
      } catch (e) {
        console.log(`   ❌ 删除失败: ${f.filename} - ${e.message}`);
      }
    }
    
    console.log(`\n✅ 删除完成！共删除 ${deletedCount} 个文件，释放 ${formatSize(deletedSize)} 空间`);
  } else {
    console.log('\n💡 提示: 运行 "node scripts/cleanup-images.js --delete" 来删除这些文件');
  }

  await prisma.$disconnect();
}

cleanup().catch(async (e) => {
  console.error('❌ 清理失败:', e.message);
  await prisma.$disconnect();
  process.exit(1);
});