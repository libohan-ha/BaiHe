const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    const email = 'libohan@example.com';
    const username = 'libohan';
    const password = '079825lbh';
    const role = 'SUPER_ADMIN';

    const existingEmail = await prisma.user.findUnique({
      where: { email }
    });

    if (existingEmail) {
      console.log('❌ 邮箱已被使用:', email);
      return;
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUsername) {
      console.log('❌ 用户名已被使用:', username);
      return;
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const superAdmin = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true
      }
    });

    console.log('✅ 超级管理员创建成功:');
    console.log('   ID:', superAdmin.id);
    console.log('   邮箱:', superAdmin.email);
    console.log('   用户名:', superAdmin.username);
    console.log('   角色:', superAdmin.role);
    console.log('   创建时间:', superAdmin.createdAt);
  } catch (error) {
    console.error('❌ 创建超级管理员失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
