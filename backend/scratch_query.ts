import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const { prisma } = await import('./src/services/db.js');
  const workflows = await prisma.workflow.findMany({
    where: {
      path: {
        contains: 'profile'
      }
    }
  });
  console.log(JSON.stringify(workflows, null, 2));
}
main().catch(console.error);
