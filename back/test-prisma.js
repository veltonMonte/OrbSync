const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    await prisma.workspace.create({
      data: {
        name: "Test Workspace",
        slug: "test-workspace-" + Date.now(),
        members: {
          create: { userId: "dac74f6e-f12c-47ae-b25e-7d40fccc4566", role: "OWNER" }
        }
      }
    });
    console.log("Success");
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
