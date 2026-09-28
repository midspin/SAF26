const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authenticCurators = [
  {
    name: "Anisha Rachel Oommen",
    category: "Culinary Arts",
    photo: "https://images.serendipityartsfestival.com/site-images/1769074092285-Anisha-Rachel-Oommen-Curator-17.jpg",
    profile: "Anisha Rachel Oommen is a food writer, editor and co-founder of Goya Media, a media company focused on food culture and agriculture in South Asia.",
    organisation: "Goya Media",
    email: "anisha.curator@saf.org"
  },
  {
    name: "Ankur Tewari",
    category: "Music",
    photo: "https://images.serendipityartsfestival.com/site-images/1769074122119-Ankur-Tewari-Curator-1.jpg",
    profile: "Ankur Tewari is a renowned singer-songwriter, composer and music supervisor known for his work in independent music and Bollywood soundtracks.",
    organisation: "Independent Music",
    email: "ankur.curator@saf.org"
  },
  {
    name: "Anuradha Kapur",
    category: "Theatre",
    photo: "https://images.serendipityartsfestival.com/site-images/1769074149861-Anuradha-Kapur-Curator-1.jpg",
    profile: "Anuradha Kapur is a distinguished theatre director, former Director of the National School of Drama, and influential educator.",
    organisation: "National School of Drama Alumni",
    email: "anuradha.curator@saf.org"
  },
  {
    name: "Aruna Sairam",
    category: "Music",
    photo: "https://images.serendipityartsfestival.com/site-images/1769074176317-Aruna-Sairam-Curator-1.jpg",
    profile: "Padma Shri Aruna Sairam is an acclaimed Carnatic vocalist, composer and cultural ambassador who has performed globally.",
    organisation: "Carnatic Music Foundation",
    email: "aruna.curator@saf.org"
  },
  {
    name: "Ashley Lobo",
    category: "Dance",
    photo: "https://images.serendipityartsfestival.com/site-images/1769074199859-Ashley-Lobo-Curator-1.jpg",
    profile: "Ashley Lobo is an internationally recognized choreographer and founder of Danceworx and Navdhara India Dance Theatre.",
    organisation: "Navdhara India Dance Theatre",
    email: "ashley.curator@saf.org"
  },
  {
    name: "Kshitij Jalori",
    category: "Craft",
    photo: "https://images.serendipityartsfestival.com/site-images/1769074230198-Kshitij-Jalori-Curator-1.jpg",
    profile: "Kshitij Jalori is a prominent textile designer and couturier bridging traditional Indian handlooms with modern aesthetic sensibilities.",
    organisation: "Kshitij Jalori Studio",
    email: "kshitij.curator@saf.org"
  },
  {
    name: "Latika Gupta",
    category: "Visual Arts",
    photo: "https://images.serendipityartsfestival.com/site-images/1769074261771-Latika-Gupta-Curator-1.jpg",
    profile: "Latika Gupta is an art historian, curator and researcher specializing in contemporary and visual art practices across South Asia.",
    organisation: "Contemporary Art Research",
    email: "latika.curator@saf.org"
  },
  {
    name: "Mahesh Dattani",
    category: "Theatre",
    photo: "https://images.serendipityartsfestival.com/site-images/1769074291880-Mahesh-Dattani-Curator-1.jpg",
    profile: "Mahesh Dattani is a Sahitya Akademi Award-winning playwright, director and actor whose works explore complex social dynamics.",
    organisation: "Playwright Guild",
    email: "mahesh.curator@saf.org"
  },
  {
    name: "Padmini Chettur",
    category: "Special Projects",
    photo: "https://images.serendipityartsfestival.com/site-images/1769074322449-Padmini-Chettur-Curator-1.jpg",
    profile: "Padmini Chettur is a radical contemporary dancer and choreographer known for her minimalist and spatial movement investigations.",
    organisation: "Contemporary Movement Collective",
    email: "padmini.curator@saf.org"
  },
  {
    name: "Ram Rahman",
    category: "Special Projects",
    photo: "https://images.serendipityartsfestival.com/site-images/1769074351052-Ram-Rahman-Curator-1.jpg",
    profile: "Ram Rahman is a celebrated photographer, artist, curator and founding member of the SAHMAT collective.",
    organisation: "SAHMAT Collective",
    email: "ram.curator@saf.org"
  },
  {
    name: "Salil Chaturvedi",
    category: "Accessibility",
    photo: "https://images.serendipityartsfestival.com/site-images/1769074381387-Salil-Chaturvedi-Curator-1.jpg",
    profile: "Salil Chaturvedi is a writer, poet, disability rights activist and accessibility curator advocating for inclusive festival environments.",
    organisation: "Inclusive Arts Network",
    email: "salil.curator@saf.org"
  },
  {
    name: "Sheba Chhachhi",
    category: "Visual Arts",
    photo: "https://images.serendipityartsfestival.com/site-images/1769074409893-Sheba-Chhachhi-Curator-1.jpg",
    profile: "Sheba Chhachhi is a Singapore Art Museum Premio winner, photographer and installation artist focusing on gender, eco-philosophy and memory.",
    organisation: "Visual Art & Memory Archive",
    email: "sheba.curator@saf.org"
  },
  {
    name: "Sreyansi Singh",
    category: "Special Projects",
    photo: "https://images.serendipityartsfestival.com/site-images/1769074438312-Sreyansi-Singh-Curator-1.jpg",
    profile: "Sreyansi Singh is a multidisciplinary arts manager and project curator focusing on experimental interdisciplinary showcases.",
    organisation: "SAF Interdisciplinary Unit",
    email: "sreyansi.curator@saf.org"
  },
  {
    name: "Sudhir Baldeo Rajbhar",
    category: "Craft",
    photo: "https://images.serendipityartsfestival.com/site-images/1769074465814-Sudhir-Baldeo-Rajbhar-Curator-1.jpg",
    profile: "Sudhir Baldeo Rajbhar is an artisan and founder of Chamar Studio, promoting sustainability and craft-led social empowerment.",
    organisation: "Chamar Studio",
    email: "sudhir.curator@saf.org"
  },
  {
    name: "Surjit Nongmeikapam",
    category: "Dance",
    photo: "https://images.serendipityartsfestival.com/site-images/1769074492928-Surjit-Nongmeikapam-Curator-1.jpg",
    profile: "Surjit Nongmeikapam (Bonita) is a Manipur-based contemporary dancer and choreographer exploring indigenous performance traditions.",
    organisation: "Nachom Arts Foundation",
    email: "surjit.curator@saf.org"
  }
];

async function seedCurators() {
  console.log("Fetching active event...");
  const activeEvent = (await prisma.event.findFirst({ where: { status: 'Active' } })) || (await prisma.event.findFirst());
  if (!activeEvent) {
    console.error("No event found!");
    process.exit(1);
  }

  console.log(`Clearing existing curators for event ${activeEvent.name}...`);
  await prisma.curator.deleteMany({ where: { eventId: activeEvent.id } });

  console.log(`Seeding ${authenticCurators.length} authentic curators...`);
  for (const c of authenticCurators) {
    await prisma.curator.create({
      data: {
        eventId: activeEvent.id,
        name: c.name,
        category: c.category,
        photo: c.photo,
        profile: c.profile,
        organisation: c.organisation,
        email: c.email
      }
    });
  }

  console.log("Curators seeded successfully!");
}

seedCurators()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
