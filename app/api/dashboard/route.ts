import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const results = await Promise.all([
      prisma.artwork.findMany({
        select: {
          id: true,
          venueId: true,
          _count: { select: { installations: true } },
        },
      }),
      prisma.inventoryItem.findMany({
        select: {
          id: true,
          safCode: true,
          inventoryCategory: true,
          subCategory: true,
          element: true,
          brandProject: true,
          model: true,
          totalQuantity: true,
          allocatedQuantity: true,
          availableQuantity: true,
          inventoryUsageType: true,
        },
      }),
      prisma.venue.findMany({
        select: {
          id: true,
          venueName: true,
          _count: { select: { installations: true } },
          rooms: {
            select: {
              _count: { select: { installations: true } },
            },
          },
        },
      }),
      prisma.artist.findMany({
        select: {
          id: true,
          artistName: true,
          artistPhoto: true,
          status: true,
          artworks: {
            select: {
              id: true,
              artworkName: true,
              installationType: true,
              techProdLayout: true,
              venue: { select: { id: true, venueName: true, venueDocument: true } },
              room: { select: { id: true, roomNumber: true, roomName: true, techProdLayout: true, floorplan: true } },
            },
          },
          productionAssignments: {
            select: {
              productionPerson: {
                select: { name: true },
              },
            },
          },
          allocations: {
            select: {
              artworkId: true,
              department: true,
              inventoryItem: {
                select: {
                  inventoryCategory: true,
                  inventoryUsageType: true,
                },
              },
            },
          },
        },
      }),
      prisma.artistInstallation.findMany({
        select: {
          id: true,
          artistId: true,
          artworkId: true,
          installationStatus: true,
        },
      }),
    ]);

    const artworks = results[0];
    const items = results[1];
    const venues = results[2];
    const allArtists = results[3];
    const allInstallations = results[4];
    const artists = allArtists;

    // 1. Artist stats
    const totalArtists = artists.length;
    const confirmedArtists = artists.filter(
      (a) => !a.status || a.status === 'Confirmed' || a.status === 'ACTIVE'
    ).length;

    // 2. Artwork stats
    const totalArtworks = artworks.length;
    const assignedArtworks = artworks.filter(
      (aw) => aw.venueId || (aw._count?.installations && aw._count.installations > 0)
    ).length;

    // 3. Technical inventory stats
    const techItems = items.filter(
      (i) =>
        (i.inventoryUsageType && i.inventoryUsageType.toUpperCase() === 'TECHNICAL') ||
        (i.inventoryCategory && i.inventoryCategory.toLowerCase().includes('tech'))
    );

    let totalTechnicalInventory = 0;
    let allocatedTechnicalInventory = 0;
    let availableTechnicalInventory = 0;

    techItems.forEach((item) => {
      totalTechnicalInventory += item.totalQuantity || 0;
      allocatedTechnicalInventory += item.allocatedQuantity || 0;
      availableTechnicalInventory += item.availableQuantity || 0;
    });

    // 4. Projectors breakdown (strictly real projectors, excluding OHP, mounts, bases, and screens)
    const projectorItems = items.filter((i) => {
      const element = (i.element || '').toLowerCase();
      const subCat = (i.subCategory || '').toLowerCase();
      const text = `${element} ${i.inventoryCategory || ''} ${subCat} ${i.brandProject || ''} ${i.model || ''}`.toLowerCase();

      if (
        element.includes('ohp') ||
        element.includes('mount') ||
        element.includes('base for projector') ||
        element.includes('claw') ||
        element.includes('screen') ||
        subCat === 'screen' ||
        subCat === 'mount' ||
        subCat === 'stand'
      ) {
        return false;
      }

      return text.includes('projector');
    });

    const projGroupMap: Record<
      string,
      { brand: string; model: string; element: string; total: number; allocated: number; balance: number }
    > = {};

    let totalProjectors = 0;
    let allocatedProjectors = 0;
    let balanceProjectors = 0;

    projectorItems.forEach((item) => {
      const brand = item.brandProject && item.brandProject !== 'Na' ? item.brandProject : '';
      const model = item.model && item.model !== 'Na' ? item.model : '';
      const element = item.element || 'Projector';
      const key = `${element}-${brand}-${model}`;

      const tot = item.totalQuantity || 0;
      const alc = item.allocatedQuantity || 0;
      const bal = item.availableQuantity || 0;

      totalProjectors += tot;
      allocatedProjectors += alc;
      balanceProjectors += bal;

      if (!projGroupMap[key]) {
        projGroupMap[key] = { brand: brand || 'Item', model: model ? ` ${model}` : '', element, total: 0, allocated: 0, balance: 0 };
      }
      projGroupMap[key].total += tot;
      projGroupMap[key].allocated += alc;
      projGroupMap[key].balance += bal;
    });

    const projectorsList = Object.values(projGroupMap);

    // 5. Yamaha Speakers breakdown
    const hsMap = {
      hs5: { model: 'Yamaha HS5 (5" Active Monitor)', total: 0, allocated: 0, balance: 0 },
      hs8: { model: 'Yamaha HS8 (8" Studio Monitor)', total: 0, allocated: 0, balance: 0 },
      hs8s: { model: 'Yamaha HS8S (150W Subwoofer)', total: 0, allocated: 0, balance: 0 },
    };

    items.forEach((item) => {
      const text = `${item.element || ''} ${item.model || ''} ${item.brandProject || ''} ${item.subCategory || ''}`.toUpperCase();
      const tot = item.totalQuantity || 0;
      const alc = item.allocatedQuantity || 0;
      const bal = item.availableQuantity || 0;

      if (text.includes('HS5') || text.includes('HS-5')) {
        hsMap.hs5.total += tot;
        hsMap.hs5.allocated += alc;
        hsMap.hs5.balance += bal;
      } else if (text.includes('HS8S') || text.includes('HS-8S') || text.includes('HS8 SUB')) {
        hsMap.hs8s.total += tot;
        hsMap.hs8s.allocated += alc;
        hsMap.hs8s.balance += bal;
      } else if (text.includes('HS8') || text.includes('HS-8')) {
        hsMap.hs8.total += tot;
        hsMap.hs8.allocated += alc;
        hsMap.hs8.balance += bal;
      }
    });

    const totalHSSpeakers = hsMap.hs5.total + hsMap.hs8.total + hsMap.hs8s.total;
    const allocatedHSSpeakers = hsMap.hs5.allocated + hsMap.hs8.allocated + hsMap.hs8s.allocated;
    const balanceHSSpeakers = hsMap.hs5.balance + hsMap.hs8.balance + hsMap.hs8s.balance;

    // 6. Media Players breakdown
    const mediaPlayerItems = items.filter((i) => {
      const text = `${i.element || ''} ${i.inventoryCategory || ''} ${i.subCategory || ''} ${i.brandProject || ''} ${i.model || ''}`.toLowerCase();
      return text.includes('brightsign') || text.includes('cubetech');
    });

    const mpGroupMap: Record<
      string,
      { brand: string; model: string; element: string; badge: string; total: number; allocated: number; balance: number }
    > = {};

    let totalMediaPlayers = 0;
    let allocatedMediaPlayers = 0;
    let balanceMediaPlayers = 0;

    mediaPlayerItems.forEach((item) => {
      let brand = item.brandProject && item.brandProject !== 'Na' ? item.brandProject : '';
      if (!brand) {
        const text = `${item.element || ''}`.toLowerCase();
        if (text.includes('brightsign')) brand = 'BrightSign';
        else if (text.includes('cubetech')) brand = 'Cubetech';
        else brand = item.element || 'Media Player';
      }

      if (brand.toLowerCase() === 'brightsign') brand = 'BrightSign';
      if (brand.toLowerCase() === 'cubetech' || brand.toLowerCase() === 'cube tech') brand = 'Cubetech';

      let model = item.model && item.model !== 'Na' ? item.model : '';
      if (!model) {
        model = item.element || 'Standard';
      }

      const element =
        item.element &&
        item.element !== 'Na' &&
        item.element.toLowerCase() !== brand.toLowerCase() &&
        !item.element.toLowerCase().includes(model.toLowerCase())
          ? item.element
          : `${brand} ${model} Media Player`;

      const badge = model.toUpperCase();
      const key = `${brand}-${model}`;

      const tot = item.totalQuantity || 0;
      const alc = item.allocatedQuantity || 0;
      const bal = item.availableQuantity || 0;

      totalMediaPlayers += tot;
      allocatedMediaPlayers += alc;
      balanceMediaPlayers += bal;

      if (!mpGroupMap[key]) {
        mpGroupMap[key] = { brand, model, element, badge, total: 0, allocated: 0, balance: 0 };
      }
      mpGroupMap[key].total += tot;
      mpGroupMap[key].allocated += alc;
      mpGroupMap[key].balance += bal;
    });

    const mediaPlayersList = Object.values(mpGroupMap);

    // 3b. Production inventory stats
    const prodItems = items.filter(
      (i) =>
        (i.inventoryUsageType && i.inventoryUsageType.toUpperCase() === 'PRODUCTION') ||
        (i.inventoryCategory && i.inventoryCategory.toLowerCase().includes('prod'))
    );

    let totalProductionInventory = 0;
    let allocatedProductionInventory = 0;
    let availableProductionInventory = 0;

    prodItems.forEach((item) => {
      totalProductionInventory += item.totalQuantity || 0;
      allocatedProductionInventory += item.allocatedQuantity || 0;
      availableProductionInventory += item.availableQuantity || 0;
    });

    // 7. Venue Distribution
    const venueDistribution = venues.map((v) => {
      let count = v._count?.installations || 0;
      if (v.rooms) {
        v.rooms.forEach((r) => {
          count += r._count?.installations || 0;
        });
      }
      return { name: v.venueName || 'Venue', artworkCount: count };
    });

    // 7b. Project Status by Venue
    const projectStatusByVenue = venues.map((v) => {
      const venueArtworks = artworks.filter((aw) => aw.venueId === v.id);
      const venueArtworkIds = new Set(venueArtworks.map((aw) => aw.id));

      const venueInstallations = allInstallations.filter((i) =>
        i.artworkId ? venueArtworkIds.has(i.artworkId) : false
      );

      const totalProjects = Math.max(venueArtworks.length, venueInstallations.length);
      const planned = venueInstallations.filter((i) => i.installationStatus === 'Planned').length;
      const ready = venueInstallations.filter((i) => i.installationStatus === 'Ready').length;
      const inProgress = venueInstallations.filter(
        (i) => i.installationStatus === 'Installation In Progress' || i.installationStatus === 'In Progress'
      ).length;
      const installed = venueInstallations.filter((i) => i.installationStatus === 'Installed').length;
      const completed = venueInstallations.filter((i) => i.installationStatus === 'Completed').length;

      return {
        id: v.id,
        venueName: v.venueName || 'Venue',
        totalProjects,
        planned,
        ready,
        inProgress,
        installed,
        completed,
      };
    });

    // 7c. Active Production Projects (projects in progress / active)
    const activeProductionProjects: any[] = [];
    allArtists.forEach((artist) => {
      (artist.artworks || []).forEach((art: any) => {
        const inst = allInstallations.find((i) => i.artistId === artist.id && i.artworkId === art.id) || allInstallations.find((i) => i.artistId === artist.id);
        const status = inst?.installationStatus || 'Planned';
        const venue = art.venue;
        const room = art.room;
        const prodTeam = (artist.productionAssignments || [])
          .map((p: any) => p.productionPerson?.name)
          .filter(Boolean);

        activeProductionProjects.push({
          id: inst?.id || art.id,
          artistId: artist.id,
          artistName: artist.artistName || 'Unassigned Artist',
          artistPhoto: artist.artistPhoto || null,
          artworkName: art.artworkName || 'Artwork Pending',
          venueName: venue?.venueName || 'Unassigned Venue',
          roomNumber: room?.roomNumber ? `Room ${room.roomNumber}` : room?.roomName || 'Gallery Space',
          status,
          productionTeam: prodTeam.length > 0 ? prodTeam : ['Production Lead'],
        });
      });
    });

    // 8. Progress Tracker Artwork Stages
    let totalTrackedArtworks = 0;
    let stageOnboarded = 0;
    let stageTechAllocated = 0;
    let stageProdAllocated = 0;
    let stageLayoutUploaded = 0;
    let stageFullyCompleted = 0;

    const installationStagesCount: Record<string, number> = {
      Planned: 0,
      Ready: 0,
      'Installation In Progress': 0,
      Installed: 0,
      Completed: 0,
    };

    allArtists.forEach((artist) => {
      const artworksList = artist.artworks && artist.artworks.length > 0 ? artist.artworks : [null];
      artworksList.forEach((art) => {
        totalTrackedArtworks++;
        const inst = allInstallations.find(
          (i) => i.artistId === artist.id && (art ? i.artworkId === art.id : true)
        ) || allInstallations.find((i) => i.artistId === artist.id);

        const status = inst?.installationStatus || 'Planned';
        installationStagesCount[status] = (installationStagesCount[status] || 0) + 1;

        const isOnboarded = Boolean(artist.artistName && art?.artworkName);
        const instType = (art?.installationType || '').toLowerCase();
        const showTechData =
          instType.includes('projection') ||
          instType.includes('interactive') ||
          instType.includes('digital') ||
          instType.includes('sound');

        const allocations = artist.allocations || [];
        const hasTechAlloc = allocations.some((alloc: any) => {
          const isMatch = !alloc.artworkId || alloc.artworkId === art?.id;
          const dept = (alloc.department || '').toUpperCase();
          const cat = (alloc.inventoryItem?.inventoryCategory || '').toUpperCase();
          const usage = (alloc.inventoryItem?.inventoryUsageType || '').toUpperCase();
          return isMatch && (dept === 'TECHNICAL' || cat === 'TECHNICAL' || usage === 'TECHNICAL');
        });

        const hasProdAlloc = allocations.some((alloc: any) => {
          const isMatch = !alloc.artworkId || alloc.artworkId === art?.id;
          const dept = (alloc.department || '').toUpperCase();
          const cat = (alloc.inventoryItem?.inventoryCategory || '').toUpperCase();
          const usage = (alloc.inventoryItem?.inventoryUsageType || '').toUpperCase();
          return isMatch && (dept === 'PRODUCTION' || cat === 'PRODUCTION' || usage === 'PRODUCTION');
        });

        const hasLayout = Boolean(
          art?.techProdLayout || art?.room?.techProdLayout || art?.room?.floorplan || art?.venue?.venueDocument
        );

        if (isOnboarded) stageOnboarded++;
        if (hasTechAlloc) stageTechAllocated++;
        if (hasProdAlloc) stageProdAllocated++;
        if (hasLayout) stageLayoutUploaded++;

        const totalActiveSteps = showTechData ? 4 : 3;
        const completedCount =
          (isOnboarded ? 1 : 0) +
          (showTechData && hasTechAlloc ? 1 : 0) +
          (hasProdAlloc ? 1 : 0) +
          (hasLayout ? 1 : 0);

        if (completedCount === totalActiveSteps) {
          stageFullyCompleted++;
        }
      });
    });

    const progressTrackerData = {
      totalTrackedArtworks,
      milestones: {
        onboarded: stageOnboarded,
        techAllocated: stageTechAllocated,
        prodAllocated: stageProdAllocated,
        layoutUploaded: stageLayoutUploaded,
        fullyCompleted: stageFullyCompleted,
      },
      installationStages: installationStagesCount,
    };

    return NextResponse.json(
      {
        success: true,
        stats: {
          totalArtists,
          confirmedArtists,
          totalArtworks,
          assignedArtworks,
          totalTechnicalInventory,
          allocatedTechnicalInventory,
          availableTechnicalInventory,
          totalProductionInventory,
          allocatedProductionInventory,
          availableProductionInventory,
          totalProjectors,
          allocatedProjectors,
          balanceProjectors,
          totalHSSpeakers,
          allocatedHSSpeakers,
          balanceHSSpeakers,
          totalMediaPlayers,
          allocatedMediaPlayers,
          balanceMediaPlayers,
        },
        projectorsList,
        speakersBreakdown: hsMap,
        mediaPlayersList,
        venueDistribution,
        projectStatusByVenue,
        activeProductionProjects,
        progressTrackerData,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=15, stale-while-revalidate=60',
        },
      }
    );
  } catch (error: any) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
