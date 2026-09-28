const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedBulkData() {
  console.log('Seeding bulk realistic data...');

  // Get active event
  let event = await prisma.event.findFirst({ where: { status: 'Active' } });
  if (!event) {
    event = await prisma.event.findFirst();
  }
  if (!event) {
    console.error('No event found in database');
    process.exit(1);
  }

  const eventId = event.id;
  console.log(`Target Event: ${event.name} (${eventId})`);

  // 1. ADD 8 PROGRAMMING TEAM MEMBERS
  const programmingData = [
    {
      name: 'Maya Lin',
      role: 'Senior Programming Curator',
      organisation: 'SAF International Arts Council',
      email: 'maya.lin@saf.org',
      phone: '+1 212 555 0192',
      whatsapp: '+1 212 555 0192',
      responsibilities: 'Oversees Asia-Pacific contemporary art programming and panel talks.',
    },
    {
      name: "Liam O'Connor",
      role: 'Head of Performance & Live Arts',
      organisation: 'Dublin Experimental Arts',
      email: 'liam.oc@saf.org',
      phone: '+353 1 496 0123',
      whatsapp: '+353 1 496 0123',
      responsibilities: 'Coordinates live soundscape installations and interactive performances.',
    },
    {
      name: 'Priya Nair',
      role: 'Digital Arts & New Media Director',
      organisation: 'Kochi Biennale Foundation',
      email: 'priya.nair@saf.org',
      phone: '+91 98470 33445',
      whatsapp: '+91 98470 33445',
      responsibilities: 'Manages VR, AR, and immersive projection mapping showcases.',
    },
    {
      name: 'Carlos Santana',
      role: 'Latin American Programming Lead',
      organisation: 'Museo de Arte Moderno',
      email: 'carlos.s@saf.org',
      phone: '+52 55 5200 1122',
      whatsapp: '+52 55 5200 1122',
      responsibilities: 'Curates sculpture gardens and large-scale architectural pavilions.',
    },
    {
      name: 'Fatima Al-Mansoori',
      role: 'MENA Cultural Engagement Manager',
      organisation: 'Sharjah Art Foundation',
      email: 'fatima.m@saf.org',
      phone: '+971 6 544 8899',
      whatsapp: '+971 6 544 8899',
      responsibilities: 'Directs community workshops, artist residencies, and talks.',
    },
    {
      name: 'Kenji Sato',
      role: 'Sound Architecture Coordinator',
      organisation: 'Tokyo Sonic Labs',
      email: 'kenji.sato@saf.org',
      phone: '+81 3 3400 9988',
      whatsapp: '+81 3 3400 9988',
      responsibilities: 'Technical programming for multi-channel spatial audio setups.',
    },
    {
      name: 'Chloe Bennett',
      role: 'Educational & Publications Lead',
      organisation: 'Tate Modern Cultural Exchange',
      email: 'chloe.b@saf.org',
      phone: '+44 20 7946 0881',
      whatsapp: '+44 20 7946 0881',
      responsibilities: 'Edits exhibition catalogues and directs symposium programs.',
    },
    {
      name: 'Tariq Mansour',
      role: 'Public Installations Manager',
      organisation: 'Cairo Design Collective',
      email: 'tariq.m@saf.org',
      phone: '+20 2 2735 4411',
      whatsapp: '+20 2 2735 4411',
      responsibilities: 'Coordinates outdoor light projections and urban art installations.',
    },
  ];

  console.log('Inserting 8 Programming Team Members...');
  for (const prog of programmingData) {
    await prisma.programmingPerson.create({
      data: { eventId, ...prog },
    });
  }

  // 2. ADD 6 POCs (POINTS OF CONTACT)
  const pocData = [
    {
      name: 'Samuel Green',
      role: 'Studio Operations Director',
      organisation: 'Green Light Studios LLC',
      email: 'samuel@greenlight.art',
      phone: '+1 415 889 0144',
      whatsapp: '+1 415 889 0144',
      altPhone: '+1 415 889 0145',
      notes: 'Primary liaison for US kinetic sculpture shipments.',
    },
    {
      name: 'Yuka Takahashi',
      role: 'Artist Manager & Agent',
      organisation: 'Takahashi Contemporary',
      email: 'yuka@takahashi-art.jp',
      phone: '+81 90 1234 5678',
      whatsapp: '+81 90 1234 5678',
      notes: 'Handles travel, visa arrangements, and media interviews for Japanese artists.',
    },
    {
      name: 'David Kalu',
      role: 'Technical & Rigging Liaison',
      organisation: 'AfroTech Installations Ltd',
      email: 'david@afrotech.co.ke',
      phone: '+254 712 345678',
      whatsapp: '+254 712 345678',
      notes: 'Direct contact for heavy truss and outdoor structure setup.',
    },
    {
      name: 'Beatrice Dupont',
      role: 'Paris Gallery Coordinator',
      organisation: 'Galerie Dupont & Cie',
      email: 'b.dupont@galerie-dupont.fr',
      phone: '+33 1 42 68 55 00',
      whatsapp: '+33 6 12 34 56 78',
      notes: 'Oversees loan insurance documents and artwork customs clearing.',
    },
    {
      name: 'Henrik Lindqvist',
      role: 'AV & Laser Technical Representative',
      organisation: 'Nordic Audio Visual AB',
      email: 'henrik@nordicav.se',
      phone: '+46 8 123 4567',
      whatsapp: '+46 70 987 6543',
      notes: 'Specialist for high-lumen 3D projector calibration and signal mapping.',
    },
    {
      name: 'Maria Gonzalez',
      role: 'Exhibition Logistics Manager',
      organisation: 'Iberia Freight & Fine Art Cargo',
      email: 'maria.g@iberiacargo.es',
      phone: '+34 91 555 6789',
      whatsapp: '+34 600 112 233',
      notes: 'Coordinates climate-controlled crate transit and customs warehousing.',
    },
  ];

  console.log('Inserting 6 Points of Contact (POCs)...');
  for (const poc of pocData) {
    await prisma.poc.create({
      data: { eventId, ...poc },
    });
  }

  // 3. ADD 12 ARTISTS
  const artistsData = [
    {
      artistName: 'Anish Kapoor',
      artistPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      biography: 'Renowned sculptor known for monumental public art installations exploring optical illusion, mirror surfaces, and deep void spaces.',
      country: 'United Kingdom',
      city: 'London',
      email: 'studio@kapoor.art',
      phone: '+44 20 7226 9900',
      website: 'https://anishkapoor.com',
      status: 'Confirmed',
    },
    {
      artistName: 'Olafur Eliasson',
      artistPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      biography: 'Danish-Icelandic artist known for sculptures and large-scale installation art employing elemental materials such as light, water, and air temperature.',
      country: 'Iceland',
      city: 'Reykjavik',
      email: 'studio@olafureliasson.net',
      phone: '+45 33 11 22 33',
      website: 'https://olafureliasson.net',
      status: 'Confirmed',
    },
    {
      artistName: 'Yayoi Kusama',
      artistPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
      biography: 'Iconic Japanese contemporary artist working in sculpture and installation, noted for polka dots and immersive Infinity Mirror Rooms.',
      country: 'Japan',
      city: 'Tokyo',
      email: 'info@kusama.jp',
      phone: '+81 3 3200 4455',
      website: 'https://yayaoikusama.jp',
      status: 'Confirmed',
    },
    {
      artistName: 'Refik Anadol',
      artistPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      biography: 'Media artist and pioneer in AI data sculpture, transforming architectural facades into fluid algorithmic canvases.',
      country: 'Turkey',
      city: 'Istanbul',
      email: 'studio@refikanadol.com',
      phone: '+1 310 555 0199',
      website: 'https://refikanadol.com',
      status: 'Confirmed',
    },
    {
      artistName: 'teamLab Collective',
      artistPhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
      biography: 'International art collective of artists, programmers, engineers, CG animators, mathematicians, and architects.',
      country: 'Japan',
      city: 'Tokyo',
      email: 'contact@teamlab.art',
      phone: '+81 3 6677 8899',
      website: 'https://teamlab.art',
      status: 'Confirmed',
    },
    {
      artistName: 'James Turrell',
      artistPhoto: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80',
      biography: 'American artist concerned primarily with light and space, creating sky-spaces and saturated LED color fields.',
      country: 'United States',
      city: 'Flagstaff',
      email: 'turrell@lightandspace.org',
      phone: '+1 928 555 0122',
      website: 'https://jamesturrell.com',
      status: 'Confirmed',
    },
    {
      artistName: 'William Kentridge',
      artistPhoto: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
      biography: 'South African draftsperson and filmmaker best known for charcoal drawings converted into animated theatrical films.',
      country: 'South Africa',
      city: 'Johannesburg',
      email: 'studio@kentridge.co.za',
      phone: '+27 11 482 1000',
      website: 'https://kentridge.co.za',
      status: 'Confirmed',
    },
    {
      artistName: 'Hito Steyerl',
      artistPhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      biography: 'German filmmaker, visual artist, writer, and innovator in digital video essays and surveillance critique.',
      country: 'Germany',
      city: 'Berlin',
      email: 'hito@berlin-art.de',
      phone: '+49 30 2000 3344',
      website: 'https://hitosteyerl.net',
      status: 'Confirmed',
    },
    {
      artistName: 'Ryoji Ikeda',
      artistPhoto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
      biography: 'Japanese electronic composer and visual artist focusing on raw data, high frequencies, and mathematical patterns.',
      country: 'Japan',
      city: 'Kyoto',
      email: 'ryoji@ryojiikeda.com',
      phone: '+81 75 555 8899',
      website: 'https://ryojiikeda.com',
      status: 'Confirmed',
    },
    {
      artistName: 'Pipilotti Rist',
      artistPhoto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
      biography: 'Swiss visual artist who creates colorful, sensual, and psychedelic video art installations and immersive projections.',
      country: 'Switzerland',
      city: 'Zurich',
      email: 'studio@pipilottirist.net',
      phone: '+41 44 266 1100',
      website: 'https://pipilottirist.net',
      status: 'Confirmed',
    },
    {
      artistName: 'Sun Xun',
      artistPhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
      biography: 'Beijing-based printmaker and animator creating woodcut prints and mythical stop-motion ink films.',
      country: 'China',
      city: 'Beijing',
      email: 'sunxun@piart.cn',
      phone: '+86 10 6438 8899',
      website: 'https://sunxunstudio.cn',
      status: 'Confirmed',
    },
    {
      artistName: 'Song Dong',
      artistPhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
      biography: 'Chinese conceptual artist exploring themes of memory, family history, and urban transformation through domestic objects.',
      country: 'China',
      city: 'Beijing',
      email: 'songdong@beijing-art.com',
      phone: '+86 10 8877 6655',
      website: 'https://songdongart.com',
      status: 'Confirmed',
    },
  ];

  console.log('Inserting 12 Artists...');
  const createdArtists = [];
  for (const aData of artistsData) {
    const artist = await prisma.artist.create({
      data: { eventId, ...aData },
    });
    createdArtists.push(artist);
  }

  // 4. ADD 12 ARTWORKS (LINKED TO THE ARTISTS)
  const artworksData = [
    {
      artworkName: 'Void & Reflection #09',
      description: 'Monolithic concave mirror sculpture in stainless steel reflecting ambient hall light and audience movement.',
      dimensions: '450cm x 450cm x 180cm',
      medium: 'Polished Stainless Steel & Internal LED Halo',
      installationType: 'Floor',
      notes: 'Requires 4-point heavy ceiling rigging and anti-fingerprint protective coating.',
    },
    {
      artworkName: 'The Solar Weather Horizon',
      description: 'Atmospheric light chamber using artificial mist, yellow frequency lamps, and temperature controls.',
      dimensions: '1200cm x 800cm x 600cm',
      medium: 'Mono-frequency Light, Ultrasonic Atomizers, Haze Generators',
      installationType: 'Outdoor Pavilion',
      notes: 'Requires dedicated water supply pipe and 3-phase 32A power socket.',
    },
    {
      artworkName: 'Infinite Mirror Universe: Polka Polka',
      description: 'Enclosed mirrored room with suspended color-changing LED spheres reflecting to infinity.',
      dimensions: '500cm x 500cm x 350cm',
      medium: 'Mirrored Glass, Micro-LED Spheres, Synchronized DMX Controller',
      installationType: 'Interactive',
      notes: 'Timed entry system. Maximum 6 visitors allowed per 90-second cycle.',
    },
    {
      artworkName: 'Unsupervised: Machine Hallucinations',
      description: 'Real-time generative AI artwork rendering artificial intelligence interpretation of exhibition archives.',
      dimensions: '800cm x 600cm Wall Display',
      medium: 'Multi-GPU Server, 4K Laser Projection Array',
      installationType: 'Projection',
      notes: 'Requires liquid-cooled media server with ultra-low latency optical HDMI cables.',
    },
    {
      artworkName: 'Flowers and People, Cannot be Controlled',
      description: 'Interactive digital ecosystem where flowers continuously bloom and wither based on audience touch.',
      dimensions: '1000cm x 1000cm Floor & Wall Room',
      medium: '3D Real-time Render Engine, Infrared Depth Camera Sensors',
      installationType: 'Interactive',
      notes: 'Darkened room required. Light lux level must remain under 5 lux.',
    },
    {
      artworkName: 'Ganzfeld Sky Domain #4',
      description: 'Immersive light field environment where visual depth perception dissolves into pure colored space.',
      dimensions: '700cm x 700cm x 450cm',
      medium: 'Seamless Plasterboard Enclosure, Programmable RGB LED Strips',
      installationType: 'Floor',
      notes: 'Requires curved seamless walls and concealed indirect LED cove lighting.',
    },
    {
      artworkName: 'More Sweetly Play the Dance',
      description: 'Eight-screen panoramic shadow procession depicting brass bands, dancers, and political figures.',
      dimensions: '4000cm Curved Projection Screen',
      medium: '8-Channel Video Projection & Synchronized Megaphone Audio',
      installationType: 'Projection',
      notes: 'Audio levels calibrated to 85dB SPL. Requires acoustically dampening curtains.',
    },
    {
      artworkName: 'Factory of the Sun',
      description: 'Grid-lined immersive video environment simulating virtual reality worlds, video games, and surveillance.',
      dimensions: '600cm x 600cm x 300cm Grid Room',
      medium: 'Blue Luminescent Grid Tape, HD Projectors, Deck Chairs',
      installationType: 'Projection',
      notes: 'Deck chair arrangement facing 45-degree angled screen.',
    },
    {
      artworkName: 'datamatics [ver.2.0]',
      description: 'Ultrafast black and white data stream projection exploring the threshold between human perception and computational data.',
      dimensions: '1400cm Screen Width',
      medium: 'Synchronized Pure Sine Wave Audio, High Frame-rate DLP Projection',
      installationType: 'Projection',
      notes: 'High volume subwoofers required for sub-bass sound frequencies (20Hz-60Hz).',
    },
    {
      artworkName: 'Pixel Forest & Underwater Bloom',
      description: 'Hanging forest of 3,000 hand-blown resin crystals containing LED lights suspended from room ceiling.',
      dimensions: '600cm x 600cm x 400cm',
      medium: 'Resin Crystals, Signal Cables, DMX Matrix Board',
      installationType: 'Hanging',
      notes: 'Requires 80 individual ceiling suspension grid points.',
    },
    {
      artworkName: 'Mythological Time Scroll',
      description: 'Hand-carved woodcut animation projected on parchment scrolls depicting mythical beasts and historical industrialization.',
      dimensions: '1200cm x 300cm',
      medium: 'Woodcut Prints, Stop-motion Animation, Dual 1080p Projectors',
      installationType: 'Projection',
      notes: 'Custom wooden hanging frame required.',
    },
    {
      artworkName: 'Waste Not: Memory Architecture',
      description: 'Massive installation layout of 10,000 domestic items collected over 50 years arranged in geometric grids.',
      dimensions: '1500cm x 1000cm Floor Grid',
      medium: 'Collected Household Artifacts, Shoes, Books, Kitchenware',
      installationType: 'Floor',
      notes: 'Requires surrounding elevated viewing platform for audience safety.',
    },
  ];

  console.log('Inserting 12 Artworks...');
  for (let i = 0; i < artworksData.length; i++) {
    const artworkInfo = artworksData[i];
    const assignedArtist = createdArtists[i % createdArtists.length];
    await prisma.artwork.create({
      data: {
        eventId,
        artistId: assignedArtist.id,
        ...artworkInfo,
      },
    });
  }

  console.log('✅ SEEDING COMPLETE!');
  console.log('Summary of added records:');
  console.log('- 8 Programming Team Members');
  console.log('- 6 Points of Contact (POCs)');
  console.log('- 12 Artists');
  console.log('- 12 Artworks');
}

seedBulkData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
