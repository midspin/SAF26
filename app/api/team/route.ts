import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');

    let programming: any[] = [];
    if (eventId) {
      programming = await prisma.programmingPerson.findMany({
        where: { eventId },
        include: { artistAssignments: { include: { artist: true } } },
      });
    }

    if (!eventId || programming.length === 0) {
      programming = await prisma.programmingPerson.findMany({
        include: { artistAssignments: { include: { artist: true } } },
      });
    }

    const where: any = {};
    if (eventId) where.eventId = eventId;
    const technical = await prisma.technicalPerson.findMany({ where, orderBy: { name: 'asc' } });
    const production = await prisma.productionPerson.findMany({ where, orderBy: { name: 'asc' } });
    const inventory = await prisma.inventoryPerson.findMany({ where, orderBy: { name: 'asc' } });
    const spatial = await prisma.spatialDesigner.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { artistAssignments: { include: { artist: true } } },
    });

    return NextResponse.json({
      success: true,
      teams: {
        programming,
        technical,
        production,
        inventory,
        spatial,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { teamType, eventId, eventIds, name, photo, role, systemRole, userRole, organisation, email, phone, whatsapp, notes, responsibilities, skills } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Member name is required.' }, { status: 400 });
    }

    if (!teamType || !['TECHNICAL', 'PRODUCTION', 'PROGRAMMING', 'INVENTORY', 'SPATIAL', 'SPATIAL DESIGNER', 'SPATIAL DESIGNERS'].includes(teamType.toUpperCase())) {
      return NextResponse.json({ success: false, error: 'Valid teamType is required.' }, { status: 400 });
    }

    const targetEventIds: string[] = Array.isArray(eventIds) && eventIds.length > 0 ? eventIds : (eventId ? [eventId] : []);
    let primaryEventId: string | undefined = targetEventIds[0];

    if (!primaryEventId) {
      const activeEvent =
        (await prisma.event.findFirst({ where: { status: 'Active' } })) ||
        (await prisma.event.findFirst());
      primaryEventId = activeEvent?.id;
    }

    if (!primaryEventId) {
      return NextResponse.json(
        { success: false, error: 'No active event found. Please create an event first.' },
        { status: 400 }
      );
    }

    const finalEventIds = targetEventIds.length > 0 ? targetEventIds : [primaryEventId];
    const eventIdsJson = JSON.stringify(finalEventIds);

    const upperTeam = teamType.toUpperCase();
    let person: any;

    if (upperTeam === 'PROGRAMMING') {
      person = await prisma.programmingPerson.create({
        data: {
          eventId: primaryEventId,
          eventIdsJson,
          name: name.trim(),
          photo: photo || null,
          role: role || 'Programming Head',
          organisation: organisation || null,
          email: email || null,
          phone: phone || null,
          whatsapp: whatsapp || null,
          responsibilities: responsibilities || null,
          notes: notes || null,
        },
      });
    } else if (upperTeam === 'TECHNICAL') {
      person = await prisma.technicalPerson.create({
        data: {
          eventId: primaryEventId,
          eventIdsJson,
          name: name.trim(),
          photo: photo || null,
          role: role || 'Technical Engineer',
          organisation: organisation || null,
          email: email || null,
          phone: phone || null,
          whatsapp: whatsapp || null,
          skills: skills || null,
          notes: notes || null,
        },
      });
    } else if (upperTeam === 'PRODUCTION') {
      person = await prisma.productionPerson.create({
        data: {
          eventId: primaryEventId,
          eventIdsJson,
          name: name.trim(),
          photo: photo || null,
          role: role || 'Production Coordinator',
          organisation: organisation || null,
          email: email || null,
          phone: phone || null,
          whatsapp: whatsapp || null,
          responsibilities: responsibilities || null,
          notes: notes || null,
        },
      });
    } else if (upperTeam === 'INVENTORY') {
      person = await prisma.inventoryPerson.create({
        data: {
          eventId: primaryEventId,
          eventIdsJson,
          name: name.trim(),
          photo: photo || null,
          role: role || 'Inventory Manager',
          organisation: organisation || null,
          email: email || null,
          phone: phone || null,
          whatsapp: whatsapp || null,
          notes: notes || null,
        },
      });
    } else if (['SPATIAL', 'SPATIAL DESIGNER', 'SPATIAL DESIGNERS'].includes(upperTeam)) {
      person = await prisma.spatialDesigner.create({
        data: {
          eventId: primaryEventId,
          eventIdsJson,
          name: name.trim(),
          photo: photo || null,
          role: role || 'Spatial Designer',
          organisation: organisation || null,
          email: email || null,
          phone: phone || null,
          whatsapp: whatsapp || null,
          responsibilities: responsibilities || null,
          notes: notes || null,
        },
      });
    }

    // Determine mapped User Role based on designation or explicit systemRole
    let mappedRole = (systemRole || userRole || '').trim();
    if (!mappedRole) {
      if (upperTeam === 'TECHNICAL') {
        mappedRole = 'TECHNICAL TEAM';
      } else if (upperTeam === 'PRODUCTION') {
        mappedRole = 'PRODUCTION TEAM';
      } else if (upperTeam === 'PROGRAMMING') {
        mappedRole = 'PROGRAMMING TEAM';
      } else if (upperTeam === 'INVENTORY') {
        mappedRole = 'INVENTORY TEAM';
      } else if (['SPATIAL', 'SPATIAL DESIGNER', 'SPATIAL DESIGNERS'].includes(upperTeam)) {
        mappedRole = 'SPATIAL DESIGNER';
      }
    }

    // Generate unique default username and email
    const baseUsername = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') || `user_${Date.now()}`;
    let generatedUsername = baseUsername;
    let count = 1;
    while (await prisma.user.findFirst({ where: { username: generatedUsername } })) {
      generatedUsername = `${baseUsername}_${count}`;
      count++;
    }

    const defaultEmail = email && email.trim() ? email.trim().toLowerCase() : `${generatedUsername}@saf2026.org`;
    let finalEmail = defaultEmail;
    let emailCount = 1;
    while (await prisma.user.findFirst({ where: { email: finalEmail } })) {
      finalEmail = `${generatedUsername}_${emailCount}@saf2026.org`;
      emailCount++;
    }

    // Create user login account with default password "pass" and mustChangePassword: true
    let loginUser: any = null;
    try {
      loginUser = await prisma.user.create({
        data: {
          name: name.trim(),
          username: generatedUsername,
          password: 'pass',
          email: finalEmail,
          phone: phone || null,
          role: mappedRole,
          department: upperTeam === 'TECHNICAL' ? 'Technical' : upperTeam === 'PRODUCTION' ? 'Production' : upperTeam === 'PROGRAMMING' ? 'Programming' : 'Inventory',
          avatar: photo || null,
          mustChangePassword: true,
          teamMemberId: person.id,
          assignedEventIds: eventIdsJson,
        },
      });
    } catch (uErr) {
      console.error('Error auto-creating login user:', uErr);
    }

    await prisma.auditLog.create({
      data: {
        eventId: primaryEventId,
        userName: 'Admin User',
        userRole: 'SUPER ADMIN',
        entityType: upperTeam,
        entityId: person.id,
        action: 'CREATE',
        newValueJson: JSON.stringify(person),
      },
    });

    return NextResponse.json({
      success: true,
      person,
      teamType: upperTeam,
      generatedAccount: loginUser
        ? {
            username: loginUser.username,
            password: 'pass',
            role: loginUser.role,
            email: loginUser.email,
          }
        : null,
    });
  } catch (error: any) {
    console.error('Error creating team member:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create team member' }, { status: 500 });
  }
}
