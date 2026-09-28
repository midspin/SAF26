const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Fetching active event...');
  let event = await prisma.event.findFirst({ where: { status: 'Active' } });
  if (!event) {
    event = await prisma.event.findFirst();
  }
  if (!event) {
    console.error('No event found in DB!');
    return;
  }

  console.log(`Using event: ${event.name} (${event.id})`);

  const programmingMembers = [
    {
      name: 'Prerna Jaiswal',
      role: 'Programming Head',
      organisation: 'Serendipity Arts',
      email: 'prerna.jaiswal@serendipityarts.org',
      photo: 'https://serendipityarts.org/wp-content/uploads/2020/10/Prerna-team.jpg',
      responsibilities: 'Overall festival curatorial & programming management',
    },
    {
      name: 'Nitya Iyer',
      role: 'Programming & Production',
      organisation: 'Serendipity Arts',
      email: 'nitya.iyer@serendipityarts.org',
      photo: 'https://serendipityarts.org/wp-content/uploads/2020/10/Nitya-team.jpg',
      responsibilities: 'Stage programming & production liaisons',
    },
    {
      name: 'Keith Peter',
      role: 'Programming Lead',
      organisation: 'Serendipity Arts',
      email: 'keith.peter@serendipityarts.org',
      photo: 'https://serendipityarts.org/wp-content/uploads/2020/10/Keith-team.jpg',
      responsibilities: 'Artist relations & performance schedule management',
    },
    {
      name: 'Deeksha Vats',
      role: 'Programming Manager',
      organisation: 'Serendipity Arts',
      email: 'deeksha.vats@serendipityarts.org',
      photo: 'https://serendipityarts.org/wp-content/uploads/2022/08/Deeksha-team.jpg',
      responsibilities: 'Visual arts & installation programming',
    },
    {
      name: 'Ruchi Manchekar',
      role: 'Programming Officer',
      organisation: 'Serendipity Arts',
      email: 'ruchi.m@serendipityarts.org',
      photo: 'https://serendipityarts.org/wp-content/uploads/2022/08/Ruchi-team.jpg',
      responsibilities: 'Curatorial coordination & artist liaison',
    },
    {
      name: 'Priyanka Tagore',
      role: 'Programming Coordinator',
      organisation: 'Serendipity Arts',
      email: 'priyanka.t@serendipityarts.org',
      photo: 'https://serendipityarts.org/wp-content/uploads/2022/10/Priyanka-Tagore-scaled-e1666948346661-500x500.jpg',
      responsibilities: 'Workshop & special project programming',
    },
    {
      name: 'Krupa Gagwani',
      role: 'Programming Assistant',
      organisation: 'Serendipity Arts',
      email: 'krupa.g@serendipityarts.org',
      photo: 'https://serendipityarts.org/wp-content/uploads/2022/10/Krupa-team.jpg',
      responsibilities: 'Artist POC & hospitality coordination',
    },
    {
      name: 'Shreya Nair',
      role: 'Programming Executive',
      organisation: 'Serendipity Arts',
      email: 'shreya.n@serendipityarts.org',
      photo: 'https://serendipityarts.org/wp-content/uploads/2025/04/Shreya-team.jpg',
      responsibilities: 'Music & performing arts coordination',
    },
    {
      name: 'Ananya',
      role: 'Programming Associate',
      organisation: 'Serendipity Arts',
      email: 'ananya@serendipityarts.org',
      photo: 'https://serendipityarts.org/wp-content/uploads/2025/04/Ananya-team.jpg',
      responsibilities: 'Culinary & craft pavilion coordination',
    },
    {
      name: 'Moakshaa Vohra',
      role: 'Programming Specialist',
      organisation: 'Serendipity Arts',
      email: 'moakshaa.v@serendipityarts.org',
      photo: 'https://serendipityarts.org/wp-content/uploads/2020/10/Moaksha-team.jpg',
      responsibilities: 'Interdisciplinary projects & venue programming',
    },
    {
      name: 'Jogita',
      role: 'Programming Liaison',
      organisation: 'Serendipity Arts',
      email: 'jogita@serendipityarts.org',
      photo: 'https://serendipityarts.org/wp-content/uploads/2026/04/Jogita-team.jpg',
      responsibilities: 'On-site programming support & artist POC',
    },
    {
      name: 'Gaurav Kumar',
      role: 'Programme Officer',
      organisation: 'Serendipity Arts',
      email: 'gaurav.k@serendipityarts.org',
      photo: 'https://serendipityarts.org/wp-content/uploads/2026/09/gaurav-1.jpg',
      responsibilities: 'Theatre & dance pavilion programming',
    },
  ];

  console.log('Seeding programming team members...');
  for (const member of programmingMembers) {
    const existing = await prisma.programmingPerson.findFirst({
      where: { name: member.name, eventId: event.id },
    });

    if (existing) {
      await prisma.programmingPerson.update({
        where: { id: existing.id },
        data: {
          role: member.role,
          organisation: member.organisation,
          email: member.email,
          photo: member.photo,
          responsibilities: member.responsibilities,
        },
      });
      console.log(`Updated: ${member.name}`);
    } else {
      await prisma.programmingPerson.create({
        data: {
          eventId: event.id,
          ...member,
        },
      });
      console.log(`Created: ${member.name}`);
    }
  }

  console.log('Finished seeding Programming Team!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
