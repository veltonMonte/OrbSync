const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const columns = await prisma.column.findMany();
  console.log(columns);
}
main().finally(() => prisma.$disconnect());
