import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function findPersonInTeams(id: string) {
  const technical = await prisma.technicalPerson.findUnique({ where: { id } });
  if (technical) return { person: technical, teamType: 'TECHNICAL' };

  const production = await prisma.productionPerson.findUnique({ where: { id } });
  if (production) return { person: production, teamType: 'PRODUCTION' };

  const programming = await prisma.programmingPerson.findUnique({ where: { id } });
  if (programming) return { person: programming, teamType: 'PROGRAMMING' };

  const inventory = await prisma.inventoryPerson.findUnique({ where: { id } });
  if (inventory) return { person: inventory, teamType: 'INVENTORY' };

  return null;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await findPersonInTeams(id);
    if (!result) {
      return NextResponse.json({ success: false, error: 'Team member not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, person: result.person, teamType: result.teamType });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const result = await findPersonInTeams(id);
    if (!result) {
      return NextResponse.json({ success: false, error: 'Team member not found' }, { status: 404 });
    }

    const { name, photo, role, systemRole, userRole, organisation, email, phone, whatsapp, notes, responsibilities, skills, artistIds, eventIds } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Member name is required.' }, { status: 400 });
    }

    const teamType = result.teamType;
    let updatedPerson: any;
    const eventIdsJson = Array.isArray(eventIds) ? JSON.stringify(eventIds) : undefined;
    const primaryEventId = Array.isArray(eventIds) && eventIds.length > 0 ? eventIds[0] : undefined;

    if (teamType === 'PROGRAMMING') {
      await prisma.programmingPerson.update({
        where: { id },
        data: {
          name: name.trim(),
          photo: photo || null,
          role: role || null,
          organisation: organisation || null,
          email: email || null,
          phone: phone || null,
          whatsapp: whatsapp || null,
          responsibilities: responsibilities || null,
          notes: notes || null,
          ...(eventIdsJson ? { eventIdsJson } : {}),
          ...(primaryEventId ? { eventId: primaryEventId } : {}),
        },
      });

      if (Array.isArray(artistIds)) {
        await prisma.artistProgrammingAssignment.deleteMany({ where: { programmingPersonId: id } });
        if (artistIds.length > 0) {
          await prisma.artistProgrammingAssignment.createMany({
            data: artistIds.map((artId: string) => ({ programmingPersonId: id, artistId: artId })),
          });
        }
      }

      updatedPerson = await prisma.programmingPerson.findUnique({
        where: { id },
        include: { artistAssignments: { include: { artist: true } } },
      });
    } else if (teamType === 'TECHNICAL') {
      updatedPerson = await prisma.technicalPerson.update({
        where: { id },
        data: {
          name: name.trim(),
          photo: photo || null,
          role: role || 'Technical Engineer',
          organisation: organisation || null,
          email: email || null,
          phone: phone || null,
          whatsapp: whatsapp || null,
          skills: skills || null,
          notes: notes || null,
          ...(eventIdsJson ? { eventIdsJson } : {}),
          ...(primaryEventId ? { eventId: primaryEventId } : {}),
        },
      });
    } else if (teamType === 'PRODUCTION') {
      updatedPerson = await prisma.productionPerson.update({
        where: { id },
        data: {
          name: name.trim(),
          photo: photo || null,
          role: role || 'Production Coordinator',
          organisation: organisation || null,
          email: email || null,
          phone: phone || null,
          whatsapp: whatsapp || null,
          responsibilities: responsibilities || null,
          notes: notes || null,
          ...(eventIdsJson ? { eventIdsJson } : {}),
          ...(primaryEventId ? { eventId: primaryEventId } : {}),
        },
      });
    } else if (teamType === 'INVENTORY') {
      updatedPerson = await prisma.inventoryPerson.update({
        where: { id },
        data: {
          name: name.trim(),
          photo: photo || null,
          role: role || null,
          organisation: organisation || null,
          email: email || null,
          phone: phone || null,
          whatsapp: whatsapp || null,
          notes: notes || null,
          ...(eventIdsJson ? { eventIdsJson } : {}),
          ...(primaryEventId ? { eventId: primaryEventId } : {}),
        },
      });
    }

    // Sync updated role & eventIds to linked User profile
    const targetRole = (systemRole || userRole || '').trim();
    const updateUserData: any = {};
    if (eventIdsJson) updateUserData.assignedEventIds = eventIdsJson;
    if (targetRole) updateUserData.role = targetRole;

    if (Object.keys(updateUserData).length > 0) {
      try {
        await prisma.user.updateMany({
          where: { teamMemberId: id },
          data: updateUserData,
        });
      } catch (uErr) {
        console.error('Error updating user profile:', uErr);
      }
    }

    await prisma.auditLog.create({
      data: {
        eventId: updatedPerson.eventId,
        userName: 'Admin User',
        userRole: 'SUPER ADMIN',
        entityType: teamType,
        entityId: id,
        action: 'UPDATE',
        previousValueJson: JSON.stringify(result.person),
        newValueJson: JSON.stringify(updatedPerson),
      },
    });

    return NextResponse.json({ success: true, person: updatedPerson, teamType });
  } catch (error: any) {
    console.error('Error updating team member:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update team member' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const result = await findPersonInTeams(id);
    if (!result) {
      return NextResponse.json({ success: false, error: 'Team member not found' }, { status: 404 });
    }

    const { person, teamType } = result;

    if (teamType === 'PROGRAMMING') {
      await prisma.programmingPerson.delete({ where: { id } });
    } else if (teamType === 'TECHNICAL') {
      await prisma.technicalPerson.delete({ where: { id } });
    } else if (teamType === 'PRODUCTION') {
      await prisma.productionPerson.delete({ where: { id } });
    } else if (teamType === 'INVENTORY') {
      await prisma.inventoryPerson.delete({ where: { id } });
    }

    await prisma.auditLog.create({
      data: {
        eventId: person.eventId,
        userName: 'Admin User',
        userRole: 'SUPER ADMIN',
        entityType: teamType,
        entityId: id,
        action: 'DELETE',
        previousValueJson: JSON.stringify(person),
      },
    });

    return NextResponse.json({ success: true, id, teamType });
  } catch (error: any) {
    console.error('Error deleting team member:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete team member' }, { status: 500 });
  }
}
