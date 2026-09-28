const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const seedUsers = [
  {
    name: 'System Administrator',
    username: 'Admin',
    password: 'Admin',
    email: 'admin@saf2026.org',
    role: 'SUPER ADMIN',
    department: 'Management',
  },
  {
    name: 'Marcus Vance',
    username: 'tech_head',
    password: 'password',
    email: 'tech.head@saf2026.org',
    role: 'TECHNICAL TEAM',
    department: 'Technical',
  },
  {
    name: 'David Miller',
    username: 'production',
    password: 'password',
    email: 'production@saf2026.org',
    role: 'PRODUCTION TEAM',
    department: 'Production',
  },
  {
    name: 'Elena Rostova',
    username: 'programming',
    password: 'password',
    email: 'programming@saf2026.org',
    role: 'PROGRAMMING TEAM',
    department: 'Programming',
  },
  {
    name: 'Priya Sharma',
    username: 'inv_manager',
    password: 'password',
    email: 'inv.manager@saf2026.org',
    role: 'INVENTORY TEAM',
    department: 'Inventory',
  },
  {
    name: 'Guest Observer',
    username: 'viewer',
    password: 'password',
    email: 'viewer@saf2026.org',
    role: 'VIEWER',
    department: 'Management',
  },
];

async function main() {
  console.log('Seeding login users...');
  for (const u of seedUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        username: u.username,
        password: u.password,
        role: u.role,
        name: u.name,
        department: u.department,
      },
      create: u,
    });
  }
  console.log('Login users seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
