const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSuperUser() {
  console.log('Creating/updating superuser Admin in Supabase...');

  const user = await prisma.user.upsert({
    where: { email: 'admin@saf.org' },
    update: {
      username: 'Admin',
      name: 'Admin',
      password: 'Admin',
      role: 'SUPER ADMIN',
      department: 'Management',
      mustChangePassword: false,
    },
    create: {
      name: 'Admin',
      username: 'Admin',
      email: 'admin@saf.org',
      password: 'Admin',
      role: 'SUPER ADMIN',
      department: 'Management',
      mustChangePassword: false,
    },
  });

  console.log('Superuser created/updated successfully:');
  console.log(user);
}

createSuperUser()
  .catch((err) => {
    console.error('Error creating superuser:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
