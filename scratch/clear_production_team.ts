import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing Production Team table data...');

  // 1. Delete all ArtistProductionAssignment records
  const deletedAssignments = await prisma.artistProductionAssignment.deleteMany({});
  console.log(`Deleted ${deletedAssignments.count} artist production assignments.`);

  // 2. Delete all ProductionPerson records
  const deletedPeople = await prisma.productionPerson.deleteMany({});
  console.log(`Deleted ${deletedPeople.count} production team members.`);

  // 3. Delete any auto-created User accounts tied to Production Team (role/department Production)
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      OR: [
        { department: 'PRODUCTION' },
        { department: 'Production' },
        { role: 'PRODUCTION TEAM' },
        { role: 'PRODUCTION & LAYOUT' },
      ],
      // Protect super admin user
      username: { not: 'admin' },
    },
  });
  console.log(`Cleared ${deletedUsers.count} production user login accounts.`);

  console.log('Production Team Table data successfully cleared!');
}

main()
  .catch((e) => {
    console.error('Error clearing production team:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
