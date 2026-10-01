const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function wipeAllDataExceptUsersAndTeams() {
  console.log('--------------------------------------------------');
  console.log('STARTING DATABASE PURGE (Preserving Users & Teams/Staff)...');
  console.log('--------------------------------------------------');

  // 1. Delete assignments & dependent junction records
  const delArtistCurator = await prisma.artistCuratorAssignment.deleteMany({});
  console.log(`✓ Deleted ${delArtistCurator.count} Artist-Curator Assignments.`);

  const delArtistPoc = await prisma.artistPocAssignment.deleteMany({});
  console.log(`✓ Deleted ${delArtistPoc.count} Artist-POC Assignments.`);

  const delArtistProg = await prisma.artistProgrammingAssignment.deleteMany({});
  console.log(`✓ Deleted ${delArtistProg.count} Artist-Programming Assignments.`);

  const delInstallations = await prisma.artistInstallation.deleteMany({});
  console.log(`✓ Deleted ${delInstallations.count} Artist Installations.`);

  // 2. Delete Requirements, Allocations, Movements, Rentals & Purchase Requests
  const delTechReq = await prisma.technicalRequirement.deleteMany({});
  console.log(`✓ Deleted ${delTechReq.count} Technical Requirements.`);

  const delProdReq = await prisma.productionRequirement.deleteMany({});
  console.log(`✓ Deleted ${delProdReq.count} Production Requirements.`);

  const delPurchases = await prisma.purchaseRequest.deleteMany({});
  console.log(`✓ Deleted ${delPurchases.count} Purchase Requests.`);

  const delRentals = await prisma.rentalRecord.deleteMany({});
  console.log(`✓ Deleted ${delRentals.count} Rental Records.`);

  const delAllocations = await prisma.inventoryAllocation.deleteMany({});
  console.log(`✓ Deleted ${delAllocations.count} Inventory Allocations.`);

  const delMovements = await prisma.inventoryMovement.deleteMany({});
  console.log(`✓ Deleted ${delMovements.count} Inventory Movements.`);

  // 3. Delete Master Inventory Pool & Batches
  const delInventoryItems = await prisma.inventoryItem.deleteMany({});
  console.log(`✓ Deleted ${delInventoryItems.count} Master Inventory Items (Technical & Production).`);

  const delBatches = await prisma.inventoryImportBatch.deleteMany({});
  console.log(`✓ Deleted ${delBatches.count} Inventory Import Batches.`);

  try {
    const delHistory = await prisma.excelImportHistory.deleteMany({});
    console.log(`✓ Deleted ${delHistory.count} Excel Import History records.`);
  } catch (e) {
    // Ignore if model does not exist
  }

  // 4. Delete Artworks & Artists
  const delArtworks = await prisma.artwork.deleteMany({});
  console.log(`✓ Deleted ${delArtworks.count} Artworks.`);

  const delArtists = await prisma.artist.deleteMany({});
  console.log(`✓ Deleted ${delArtists.count} Artists.`);

  // 5. Delete Curators
  const delCurators = await prisma.curator.deleteMany({});
  console.log(`✓ Deleted ${delCurators.count} Curators.`);

  // 6. Delete Rooms & Venues
  const delRooms = await prisma.room.deleteMany({});
  console.log(`✓ Deleted ${delRooms.count} Rooms.`);

  const delVenues = await prisma.venue.deleteMany({});
  console.log(`✓ Deleted ${delVenues.count} Venues.`);

  // 7. Delete Vendors, Audit Logs & Notifications
  const delVendors = await prisma.vendor.deleteMany({});
  console.log(`✓ Deleted ${delVendors.count} Vendors.`);

  const delLogs = await prisma.auditLog.deleteMany({});
  console.log(`✓ Deleted ${delLogs.count} Audit Logs.`);

  const delNotifs = await prisma.notification.deleteMany({});
  console.log(`✓ Deleted ${delNotifs.count} Notifications.`);

  console.log('--------------------------------------------------');
  console.log('SUCCESS: Database successfully purged!');
  console.log('Preserved Tables: Users, Teams & Staff (Programming, Technical, Production, POCs) & Active Events.');
  console.log('Cleared Tables: Artists, Artworks, Curators, Venues, Rooms, Master Inventory, Technical & Production Inventory.');
  console.log('--------------------------------------------------');
}

wipeAllDataExceptUsersAndTeams()
  .catch((e) => {
    console.error('❌ Error executing database wipe:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
