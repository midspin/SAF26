const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Master Event Database...');

  // 1. Create Events
  const event2026 = await prisma.event.upsert({
    where: { code: 'SAF2026' },
    update: {},
    create: {
      name: '2026 Exhibition - Cultural Arts Festival',
      code: 'SAF2026',
      year: 2026,
      description: 'Annual International Contemporary Art & Cultural Exhibition',
      startDate: '2026-11-15',
      endDate: '2026-12-28',
      status: 'Active',
    },
  });

  const event2027 = await prisma.event.upsert({
    where: { code: 'SAF2027' },
    update: {},
    create: {
      name: '2027 Exhibition - Media & Digital Installations',
      code: 'SAF2027',
      year: 2027,
      description: 'Futuristic Digital & Immersive Art Triennale',
      startDate: '2027-11-10',
      endDate: '2027-12-30',
      status: 'Planning',
    },
  });

  const eventId = event2026.id;

  // 2. Create Users
  const usersData = [
    { name: 'Admin Operations', email: 'admin@saf.org', role: 'SUPER ADMIN', department: 'Management' },
    { name: 'Sarah Jenkins', email: 's.jenkins@saf.org', role: 'TECHNICAL TEAM', department: 'Technical' },
    { name: 'Marcus Chen', email: 'm.chen@saf.org', role: 'PRODUCTION TEAM', department: 'Production' },
    { name: 'Elena Rostova', email: 'e.rostova@saf.org', role: 'PROGRAMMING TEAM', department: 'Curatorial' },
    { name: 'David Miller', email: 'd.miller@saf.org', role: 'INVENTORY TEAM', department: 'Inventory' },
    { name: 'Guest Observer', email: 'viewer@saf.org', role: 'VIEWER', department: 'Management' },
  ];

  for (const u of usersData) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
  }

  // 3. Create Curators & POCs
  const curator1 = await prisma.curator.create({
    data: {
      eventId,
      name: 'Elena Rostova',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      profile: 'Senior Curator specializing in New Media & Kinetic Sculptures',
      organisation: 'Global Art Foundation',
      email: 'e.rostova@saf.org',
      phone: '+44 20 7946 0912',
      website: 'https://elenarostova.curator.art',
    },
  });

  const poc1 = await prisma.poc.create({
    data: {
      eventId,
      name: 'Julian Vance',
      photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
      organisation: 'Vance Studio Liaison',
      role: 'Studio Manager & Technical Liaison',
      email: 'julian@vancestudio.io',
      phone: '+1 415 555 0198',
      whatsapp: '+1 415 555 0198',
    },
  });

  // 4. Create Staff Teams (Programming Team from Serendipity Arts)
  const progPerson1 = await prisma.programmingPerson.create({
    data: {
      eventId,
      name: 'Prerna Jaiswal',
      photo: 'https://serendipityarts.org/wp-content/uploads/2020/10/Prerna-team.jpg',
      role: 'Programming Head',
      organisation: 'Serendipity Arts',
      email: 'prerna.jaiswal@serendipityarts.org',
      phone: '+91 98200 11223',
      responsibilities: 'Overall festival curatorial & programming management',
    },
  });

  await prisma.programmingPerson.createMany({
    data: [
      {
        eventId,
        name: 'Nitya Iyer',
        photo: 'https://serendipityarts.org/wp-content/uploads/2020/10/Nitya-team.jpg',
        role: 'Programming & Production',
        organisation: 'Serendipity Arts',
        email: 'nitya.iyer@serendipityarts.org',
        responsibilities: 'Stage programming & production liaisons',
      },
      {
        eventId,
        name: 'Keith Peter',
        photo: 'https://serendipityarts.org/wp-content/uploads/2020/10/Keith-team.jpg',
        role: 'Programming Lead',
        organisation: 'Serendipity Arts',
        email: 'keith.peter@serendipityarts.org',
        responsibilities: 'Artist relations & performance schedule management',
      },
      {
        eventId,
        name: 'Deeksha Vats',
        photo: 'https://serendipityarts.org/wp-content/uploads/2022/08/Deeksha-team.jpg',
        role: 'Programming Manager',
        organisation: 'Serendipity Arts',
        email: 'deeksha.vats@serendipityarts.org',
        responsibilities: 'Visual arts & installation programming',
      },
      {
        eventId,
        name: 'Ruchi Manchekar',
        photo: 'https://serendipityarts.org/wp-content/uploads/2022/08/Ruchi-team.jpg',
        role: 'Programming Officer',
        organisation: 'Serendipity Arts',
        email: 'ruchi.m@serendipityarts.org',
        responsibilities: 'Curatorial coordination & artist liaison',
      },
      {
        eventId,
        name: 'Priyanka Tagore',
        photo: 'https://serendipityarts.org/wp-content/uploads/2022/10/Priyanka-Tagore-scaled-e1666948346661-500x500.jpg',
        role: 'Programming Coordinator',
        organisation: 'Serendipity Arts',
        email: 'priyanka.t@serendipityarts.org',
        responsibilities: 'Workshop & special project programming',
      },
      {
        eventId,
        name: 'Krupa Gagwani',
        photo: 'https://serendipityarts.org/wp-content/uploads/2022/10/Krupa-team.jpg',
        role: 'Programming Assistant',
        organisation: 'Serendipity Arts',
        email: 'krupa.g@serendipityarts.org',
        responsibilities: 'Artist POC & hospitality coordination',
      },
      {
        eventId,
        name: 'Shreya Nair',
        photo: 'https://serendipityarts.org/wp-content/uploads/2025/04/Shreya-team.jpg',
        role: 'Programming Executive',
        organisation: 'Serendipity Arts',
        email: 'shreya.n@serendipityarts.org',
        responsibilities: 'Music & performing arts coordination',
      },
      {
        eventId,
        name: 'Ananya',
        photo: 'https://serendipityarts.org/wp-content/uploads/2025/04/Ananya-team.jpg',
        role: 'Programming Associate',
        organisation: 'Serendipity Arts',
        email: 'ananya@serendipityarts.org',
        responsibilities: 'Culinary & craft pavilion coordination',
      },
      {
        eventId,
        name: 'Moakshaa Vohra',
        photo: 'https://serendipityarts.org/wp-content/uploads/2020/10/Moaksha-team.jpg',
        role: 'Programming Specialist',
        organisation: 'Serendipity Arts',
        email: 'moakshaa.v@serendipityarts.org',
        responsibilities: 'Interdisciplinary projects & venue programming',
      },
      {
        eventId,
        name: 'Jogita',
        photo: 'https://serendipityarts.org/wp-content/uploads/2026/04/Jogita-team.jpg',
        role: 'Programming Liaison',
        organisation: 'Serendipity Arts',
        email: 'jogita@serendipityarts.org',
        responsibilities: 'On-site programming support & artist POC',
      },
      {
        eventId,
        name: 'Gaurav Kumar',
        photo: 'https://serendipityarts.org/wp-content/uploads/2026/09/gaurav-1.jpg',
        role: 'Programme Officer',
        organisation: 'Serendipity Arts',
        email: 'gaurav.k@serendipityarts.org',
        responsibilities: 'Theatre & dance pavilion programming',
      },
    ],
  });

  const techPerson1 = await prisma.technicalPerson.create({
    data: {
      eventId,
      name: 'Sarah Jenkins',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      role: 'Technical Head',
      organisation: 'SAF Technical Operations',
      email: 's.jenkins@saf.org',
      phone: '+91 98765 43210',
      skills: 'Projection Mapping, DMX Lighting Control, Network Architecture, Laser Safety',
    },
  });

  const prodPerson1 = await prisma.productionPerson.create({
    data: {
      eventId,
      name: 'Marcus Chen',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      role: 'Production Head',
      organisation: 'SAF Production Unit',
      email: 'm.chen@saf.org',
      phone: '+91 98765 99887',
      responsibilities: 'Fabrication oversight, rigging logistics, structural engineering safety',
    },
  });

  // 5. Create Venues & Rooms
  const venue1 = await prisma.venue.create({
    data: {
      eventId,
      venueName: 'Old GMC Complex',
      mainVenueImage: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&auto=format&fit=crop&q=80',
      address: 'Panaji Heritage Zone, Goa, India',
      contactName: 'Ramesh Naidu',
      contactPhone: '+91 832 242 1100',
      contactEmail: 'gmc.facility@gov.in',
      description: 'Historic colonial building adapted for indoor multi-sensory immersive installations.',
      openingHours: '10:00 AM - 08:00 PM',
      accessInfo: 'High-clearance double door freight access from East Gate.',
      powerInfo: '3-Phase 100A main connection with automatic 125kVA generator fallback.',
      internetInfo: 'Dedicated 1Gbps Fiber Line with 12 Dual-Band Access Points.',
    },
  });

  const room1 = await prisma.room.create({
    data: {
      eventId,
      venueId: venue1.id,
      roomNumber: 'GMC-101',
      roomName: 'Main Courtyard Gallery',
      floor: 'Ground Floor',
      area: '240 sq.m',
      height: '6.5 m',
      capacity: '150 visitors',
      roomImage: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=80',
      powerInfo: '16A distribution points every 3m along perimeter',
      lightingInfo: 'DMX controllable track light system',
    },
  });

  const room2 = await prisma.room.create({
    data: {
      eventId,
      venueId: venue1.id,
      roomNumber: 'GMC-204',
      roomName: 'Blackbox Media Room',
      floor: 'First Floor',
      area: '180 sq.m',
      height: '4.2 m',
      capacity: '80 visitors',
      roomImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
      powerInfo: 'Isolated clean audio ground power supply',
      lightingInfo: 'Complete light lock blackout acoustic curtains',
    },
  });

  // 6. Create Artists & Artworks
  const artist1 = await prisma.artist.create({
    data: {
      eventId,
      artistName: 'Hiroshi Tanimoto',
      artistPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      biography: 'Tokyo-based kinetic artist exploring acoustic resonance and spatial illumination.',
      country: 'Japan',
      city: 'Tokyo',
      email: 'tanimoto.hiroshi@arttokyo.jp',
      phone: '+81 3 5555 0143',
      website: 'https://hiroshitanimoto.com',
      status: 'Confirmed',
    },
  });

  await prisma.artistCuratorAssignment.create({
    data: { artistId: artist1.id, curatorId: curator1.id },
  });

  await prisma.artistPocAssignment.create({
    data: { artistId: artist1.id, pocId: poc1.id },
  });

  await prisma.artistProgrammingAssignment.create({
    data: { artistId: artist1.id, programmingPersonId: progPerson1.id },
  });

  const artwork1 = await prisma.artwork.create({
    data: {
      eventId,
      artistId: artist1.id,
      artworkName: 'Resonance of Light & Water',
      description: 'Interactive multi-projection water reflection sculpture with reactive sound synthesizer.',
      dimensions: '400cm x 300cm x 250cm',
      weight: '450 kg',
      medium: 'Water basin, laser galvo, ultra-short throw laser projectors, 8-channel audio',
      installationType: 'Projection',
    },
  });

  // 7. Create Artist Installation
  await prisma.artistInstallation.create({
    data: {
      eventId,
      artistId: artist1.id,
      artworkId: artwork1.id,
      venueId: venue1.id,
      roomId: room1.id,
      installationNotes: 'Requires overhead truss rigging for projectors and precise water temperature control.',
      installationStatus: 'Installation In Progress',
      startDate: '2026-11-01',
      endDate: '2026-11-14',
    },
  });

  // 8. Create Technical & Production Requirements
  const techReq1 = await prisma.technicalRequirement.create({
    data: {
      eventId,
      artistId: artist1.id,
      artworkId: artwork1.id,
      requirementType: 'Projection',
      description: 'Ultra Short Throw 4K Laser Projector (Minimum 10,000 Lumens)',
      quantity: 4,
      specification: 'Throw Ratio 0.35:1, HDMI 2.1, DMX Control Enabled',
      priority: 'High',
      status: 'Allocated',
    },
  });

  const prodReq1 = await prisma.productionRequirement.create({
    data: {
      eventId,
      artistId: artist1.id,
      artworkId: artwork1.id,
      requirementType: 'Fabrication',
      description: 'Custom Black Anodized Aluminum Water Basin (4m x 3m)',
      quantity: 1,
      specification: 'Waterproof lined, internal drain valve, quiet submersible pump mount',
      priority: 'High',
      status: 'Procurement Requested',
    },
  });

  // 9. Create Vendors
  const vendor1 = await prisma.vendor.create({
    data: {
      name: 'Goa Pro Audio Visuals',
      company: 'Goa Pro AV Solutions Pvt Ltd',
      category: 'AV & Lighting',
      contactPerson: 'Vikram Salgaonkar',
      email: 'sales@goaproav.in',
      phone: '+91 98221 44556',
      website: 'https://goaproav.in',
      address: 'Plot 42, Verna Industrial Estate, Goa',
    },
  });

  const vendor2 = await prisma.vendor.create({
    data: {
      name: 'Apex Structural Fabrication',
      company: 'Apex Metal Crafts',
      category: 'Fabrication',
      contactPerson: 'Sanjay Naik',
      email: 'info@apexmetal.co.in',
      phone: '+91 98230 77889',
      address: 'Corlim Industrial Zone, Goa',
    },
  });

  // 10. Seed Authentic Inventory Items matching Inventory TECH 2026.xlsx format
  const inventoryItemsData = [
    {
      safCode: 'Ac-1',
      inventoryCategory: 'Technical',
      subCategory: 'Cables',
      element: 'HDMI Cable',
      yearOfPurchase: '2023',
      brandProject: 'Kramer',
      model: 'C-HM/HM/PRO-30',
      sizeLwh: '10M',
      uom: 'Mtr',
      serialNo: 'Na',
      totalQuantity: 25,
      reservedQuantity: 2,
      allocatedQuantity: 7,
      damagedQuantity: 0,
      maintenanceQuantity: 0,
      availableQuantity: 16,
      location: 'Delhi Warehouse',
      condition: 'OK',
      throwRatio: 'Na',
      remarks: 'High speed 4K optical HDMI cable',
      inventoryUsageType: 'TECHNICAL',
      inventorySource: 'Owned',
      ownershipType: 'SAF',
      assetId: 'INV-000001',
    },
    {
      safCode: 'Ac-2',
      inventoryCategory: 'Technical',
      subCategory: 'Cables',
      element: 'SDI Cable',
      yearOfPurchase: '2024',
      brandProject: 'Canare',
      model: 'L-5CFB',
      sizeLwh: '25M',
      uom: 'Mtr',
      serialNo: 'Na',
      totalQuantity: 40,
      reservedQuantity: 0,
      allocatedQuantity: 12,
      damagedQuantity: 2,
      maintenanceQuantity: 0,
      availableQuantity: 26,
      location: 'Delhi Warehouse',
      condition: 'OK',
      throwRatio: 'Na',
      remarks: '12G-SDI heavy duty reel cable',
      inventoryUsageType: 'TECHNICAL',
      inventorySource: 'Owned',
      ownershipType: 'SAF',
      assetId: 'INV-000002',
    },
    {
      safCode: 'Pj-101',
      inventoryCategory: 'Technical',
      subCategory: 'Projection',
      element: 'Laser Projector 10K Lumens',
      yearOfPurchase: '2025',
      brandProject: 'Epson',
      model: 'EB-PU2010W',
      sizeLwh: '545 x 436 x 189 mm',
      uom: 'Nos',
      serialNo: 'EP-994821',
      totalQuantity: 6,
      reservedQuantity: 1,
      allocatedQuantity: 4,
      damagedQuantity: 0,
      maintenanceQuantity: 0,
      availableQuantity: 1,
      location: 'Goa Venue Central Warehouse',
      condition: 'OK',
      throwRatio: '0.35:1',
      remarks: 'Includes ultra short throw lens ELPLX02S',
      inventoryUsageType: 'TECHNICAL',
      inventorySource: 'Owned',
      ownershipType: 'SAF',
      assetId: 'INV-000003',
      vendorId: vendor1.id,
      purchaseCost: 8500.0,
    },
    {
      safCode: 'Ac-15',
      inventoryCategory: 'Technical',
      subCategory: 'Audio',
      element: 'Active Monitor Speaker',
      yearOfPurchase: '2024',
      brandProject: 'Genelec',
      model: '8040B',
      sizeLwh: '350 x 237 x 223 mm',
      uom: 'Nos',
      serialNo: 'GEN-44102',
      totalQuantity: 12,
      reservedQuantity: 0,
      allocatedQuantity: 6,
      damagedQuantity: 1,
      maintenanceQuantity: 0,
      availableQuantity: 5,
      location: 'Goa Venue Central Warehouse',
      condition: 'OK',
      throwRatio: 'Na',
      remarks: 'Studio monitor speaker with wall mounting bracket',
      inventoryUsageType: 'TECHNICAL',
      inventorySource: 'Owned',
      ownershipType: 'SAF',
      assetId: 'INV-000004',
    },
    {
      safCode: 'Prd-01',
      inventoryCategory: 'Production',
      subCategory: 'Furniture',
      element: 'Modular Exhibition Display Plinth',
      yearOfPurchase: '2025',
      brandProject: 'Custom SAF',
      model: 'PL-100',
      sizeLwh: '100x100x90 cm',
      uom: 'Pcs',
      serialNo: 'Na',
      totalQuantity: 30,
      reservedQuantity: 5,
      allocatedQuantity: 15,
      damagedQuantity: 0,
      maintenanceQuantity: 0,
      availableQuantity: 10,
      location: 'Verna Storage Depot',
      condition: 'OK',
      throwRatio: 'Na',
      remarks: 'White satin finish matte painted plinths',
      inventoryUsageType: 'PRODUCTION',
      inventorySource: 'Owned',
      ownershipType: 'SAF',
      assetId: 'INV-000005',
    },
  ];

  for (const itemData of inventoryItemsData) {
    const item = await prisma.inventoryItem.create({
      data: {
        eventId,
        ...itemData,
      },
    });

    // Create Initial Stock Movement
    await prisma.inventoryMovement.create({
      data: {
        eventId,
        inventoryItemId: item.id,
        movementType: 'Opening Stock',
        quantity: item.totalQuantity,
        previousTotal: 0,
        newTotal: item.totalQuantity,
        previousAvailable: 0,
        newAvailable: item.availableQuantity,
        performedBy: 'System Seed',
        reason: 'Initial 2026 Inventory Import Baseline',
      },
    });
  }

  // 11. Create Sample Allocation
  const invItemPj = await prisma.inventoryItem.findFirst({ where: { safCode: 'Pj-101' } });
  if (invItemPj) {
    const alloc = await prisma.inventoryAllocation.create({
      data: {
        eventId,
        inventoryItemId: invItemPj.id,
        artistId: artist1.id,
        artworkId: artwork1.id,
        venueId: venue1.id,
        roomId: room1.id,
        department: 'TECHNICAL',
        requestedQuantity: 4,
        approvedQuantity: 4,
        issuedQuantity: 4,
        returnedQuantity: 0,
        status: 'Issued',
        requestedBy: 'Sarah Jenkins',
        approvedBy: 'Admin Operations',
        issuedBy: 'David Miller',
        allocationDate: '2026-11-02',
        requiredDate: '2026-11-14',
        returnDueDate: '2026-12-29',
        notes: 'Allocated for Hiroshi Tanimoto main water installation',
      },
    });

    await prisma.inventoryMovement.create({
      data: {
        eventId,
        inventoryItemId: invItemPj.id,
        movementType: 'Allocated',
        quantity: 4,
        previousTotal: 6,
        newTotal: 6,
        previousAvailable: 5,
        newAvailable: 1,
        performedBy: 'David Miller',
        reason: 'Allocated to Hiroshi Tanimoto GMC-101',
        allocationId: alloc.id,
      },
    });
  }

  // 12. Create Sample Purchase & Rental Requests
  await prisma.purchaseRequest.create({
    data: {
      eventId,
      department: 'PRODUCTION',
      artistId: artist1.id,
      artworkId: artwork1.id,
      venueId: venue1.id,
      roomId: room1.id,
      itemName: 'Custom Anodized Aluminum Water Basin (4m x 3m)',
      category: 'Fabrication',
      specification: 'Grade 6061 Aluminum, Black Matte Coating, Submersible Drainage',
      quantity: 1,
      uom: 'Pcs',
      priority: 'Urgent',
      requiredDate: '2026-10-25',
      vendorId: vendor2.id,
      purchaseLink: 'https://apexmetal.co.in/quotes/REQ-2026-904',
      estimatedUnitCost: 3200.0,
      estimatedTotal: 3200.0,
      approvedCost: 3200.0,
      tax: 576.0,
      finalCost: 3776.0,
      status: 'Approved',
      requestedBy: 'Marcus Chen',
      approvedBy: 'Admin Operations',
      notes: 'Custom fabrication required for water reflection installation',
    },
  });

  await prisma.rentalRecord.create({
    data: {
      eventId,
      department: 'TECHNICAL',
      artistId: artist1.id,
      artworkId: artwork1.id,
      venueId: venue1.id,
      roomId: room1.id,
      itemName: 'Kvant Spectrum 20W RGB Laser System',
      category: 'Lighting',
      specification: '20W RGB Laser, FB4 Control Internal, DMX + Ethernet',
      quantity: 2,
      uom: 'Nos',
      vendorId: vendor1.id,
      rentalLink: 'https://goaproav.in/rentals/kvant-20w-laser',
      rentalRate: 450.0,
      rateType: 'Daily',
      rentalStart: '2026-11-12',
      rentalEnd: '2026-12-28',
      estimatedTotal: 18000.0,
      status: 'Rental Booked',
      requestedBy: 'Sarah Jenkins',
      approvedBy: 'Admin Operations',
    },
  });

  // 13. Create Google Sheet Sync Initial Log
  await prisma.googleSheetSyncLog.create({
    data: {
      eventId,
      workbookId: '1AbcXyz987_TechnicalWorkbook_2026',
      tabName: 'FULL INVENTORY',
      entityType: 'INVENTORY',
      entityId: invItemPj ? invItemPj.id : 'SEED-1',
      operation: 'INSERT',
      status: 'Synced',
      syncedAt: new Date(),
    },
  });

  // 14. Create Audit Log
  await prisma.auditLog.create({
    data: {
      eventId,
      userName: 'System Init',
      userRole: 'SUPER ADMIN',
      entityType: 'EVENT',
      entityId: eventId,
      action: 'CREATE',
      newValueJson: JSON.stringify({ name: '2026 Exhibition - Cultural Arts Festival', code: 'SAF2026' }),
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
