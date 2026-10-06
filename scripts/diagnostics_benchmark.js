const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runBenchmark() {
  console.log('====================================================');
  console.log('🚀 RUNNING DEEP PERFORMANCE & DATABASE LATENCY TEST');
  console.log('====================================================\n');

  // 1. Initial Connection / Cold Start Test
  const t0 = Date.now();
  try {
    await prisma.$connect();
    const connectTime = Date.now() - t0;
    console.log(`[1] Database Connection Handshake: ${connectTime}ms`);
  } catch (err) {
    console.error('[1] Connection Error:', err.message);
  }

  // 2. Simple Ping Test (SELECT 1)
  const pingTimes = [];
  for (let i = 0; i < 5; i++) {
    const pt0 = Date.now();
    await prisma.$queryRaw`SELECT 1 as ping`;
    pingTimes.push(Date.now() - pt0);
  }
  const avgPing = Math.round(pingTimes.reduce((a, b) => a + b, 0) / pingTimes.length);
  console.log(`[2] Raw Query Round-Trip Latency (5 samples): ${pingTimes.join('ms, ')}ms (Avg: ${avgPing}ms)`);

  // 3. Entity Query Benchmarks
  const tests = [
    {
      name: 'Artists with nested artworks & relations',
      fn: () => prisma.artist.findMany({
        include: {
          artworks: true,
          curatorAssignments: { include: { curator: true } },
          _count: { select: { allocations: true } },
        },
      }),
    },
    {
      name: 'Inventory Items (Master Pool & Allocations)',
      fn: () => prisma.inventoryItem.findMany({
        include: {
          allocations: {
            include: { artist: true },
          },
        },
      }),
    },
    {
      name: 'Events & Venues with Rooms',
      fn: () => prisma.venue.findMany({
        include: { rooms: true },
      }),
    },
    {
      name: 'Audit Logs (First 50)',
      fn: () => prisma.auditLog.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
      }),
    },
  ];

  console.log('\n[3] Testing Core Table Query Latency & Payload Sizes:');
  for (const t of tests) {
    const start = Date.now();
    const data = await t.fn();
    const duration = Date.now() - start;
    const jsonStr = JSON.stringify(data);
    const sizeKb = (Buffer.byteLength(jsonStr, 'utf8') / 1024).toFixed(1);
    console.log(`  - ${t.name}: ${duration}ms | Count: ${data.length} records | Size: ${sizeKb} KB`);
  }

  // 4. Indexing & Table Health Check
  console.log('\n[4] Database Table Counts:');
  const [artistsCount, invCount, allocCount, logsCount, artworksCount] = await Promise.all([
    prisma.artist.count(),
    prisma.inventoryItem.count(),
    prisma.inventoryAllocation.count(),
    prisma.auditLog.count(),
    prisma.artwork.count(),
  ]);
  console.log(`  - Artists: ${artistsCount}`);
  console.log(`  - Artworks: ${artworksCount}`);
  console.log(`  - Inventory Items: ${invCount}`);
  console.log(`  - Active Allocations: ${allocCount}`);
  console.log(`  - Audit Logs: ${logsCount}`);

  await prisma.$disconnect();
  console.log('\n====================================================');
  console.log('✅ BENCHMARK COMPLETE');
  console.log('====================================================');
}

runBenchmark().catch(console.error);
