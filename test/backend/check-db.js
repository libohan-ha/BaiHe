const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // 检查迁移历史
    const migrations = await prisma.$queryRawUnsafe(
      'SELECT migration_name, finished_at FROM "_prisma_migrations" ORDER BY finished_at DESC LIMIT 10'
    );
    console.log('迁移历史:');
    migrations.forEach(row => console.log(' -', row.migration_name));

    // 检查所有表
    const tables = await prisma.$queryRawUnsafe(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    console.log('\n当前表:');
    tables.forEach(row => console.log(' -', row.table_name));

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
