import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

async function main() {
  const { prisma } = await import('./src/services/db.js');
  const project = await prisma.project.findFirst({
    where: { id: '672c9f5b-58e5-401e-8d5d-b4172f402a79' },
    include: { workflows: true }
  });
  console.log(JSON.stringify(project, null, 2));
}
main().catch(console.error);
