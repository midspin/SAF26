import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, newPassword, password, newUsername, username, email, phone, avatar } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return NextResponse.json({ success: false, error: 'User profile not found.' }, { status: 404 });
    }

    const updatedPassword = (newPassword || password || '').trim();
    const updatedUsername = (newUsername || username || '').trim();

    // If changing username, check uniqueness
    if (updatedUsername && updatedUsername.toLowerCase() !== (existingUser.username || '').toLowerCase()) {
      const allUsers = await prisma.user.findMany();
      const takenUser = allUsers.find(
        (u) => u.id !== userId && u.username && u.username.toLowerCase() === updatedUsername.toLowerCase()
      );
      if (takenUser) {
        return NextResponse.json(
          { success: false, error: `Username "${updatedUsername}" is already taken by another profile.` },
          { status: 400 }
        );
      }
    }

    // If changing email, check uniqueness
    if (email && email.trim().toLowerCase() !== (existingUser.email || '').toLowerCase()) {
      const trimmedEmail = email.trim().toLowerCase();
      const allUsers = await prisma.user.findMany();
      const takenEmail = allUsers.find(
        (u) => u.id !== userId && u.email && u.email.toLowerCase() === trimmedEmail
      );
      if (takenEmail) {
        return NextResponse.json(
          { success: false, error: `Email "${trimmedEmail}" is already registered.` },
          { status: 400 }
        );
      }
    }

    // Update User record
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        password: updatedPassword ? updatedPassword : existingUser.password,
        username: updatedUsername ? updatedUsername : existingUser.username,
        email: email && email.trim() ? email.trim().toLowerCase() : existingUser.email,
        phone: phone !== undefined ? phone : existingUser.phone,
        avatar: avatar !== undefined ? avatar : existingUser.avatar,
        mustChangePassword: false,
      },
    });

    // If linked to a Team Member, sync updated details back to the Team table
    if (existingUser.teamMemberId) {
      const tId = existingUser.teamMemberId;
      try {
        const updateData: any = {};
        if (updatedUser.email) updateData.email = updatedUser.email;
        if (updatedUser.phone) updateData.phone = updatedUser.phone;
        if (updatedUser.avatar) updateData.photo = updatedUser.avatar;

        if (Object.keys(updateData).length > 0) {
          const tech = await prisma.technicalPerson.findUnique({ where: { id: tId } });
          if (tech) {
            await prisma.technicalPerson.update({ where: { id: tId }, data: updateData });
          } else {
            const prod = await prisma.productionPerson.findUnique({ where: { id: tId } });
            if (prod) {
              await prisma.productionPerson.update({ where: { id: tId }, data: updateData });
            } else {
              const prog = await prisma.programmingPerson.findUnique({ where: { id: tId } });
              if (prog) {
                await prisma.programmingPerson.update({ where: { id: tId }, data: updateData });
              } else {
                const inv = await prisma.inventoryPerson.findUnique({ where: { id: tId } });
                if (inv) {
                  await prisma.inventoryPerson.update({ where: { id: tId }, data: updateData });
                }
              }
            }
          }
        }
      } catch (tErr) {
        console.error('Error syncing team member details:', tErr);
      }
    }

    const sessionUser = {
      id: updatedUser.id,
      name: updatedUser.name,
      username: updatedUser.username,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      department: updatedUser.department,
      avatar: updatedUser.avatar,
      mustChangePassword: false,
    };

    return NextResponse.json({
      success: true,
      message: 'Profile setup & password updated successfully.',
      user: sessionUser,
    });
  } catch (error: any) {
    console.error('Error in profile setup API:', error);
    return NextResponse.json({ success: false, error: error.message || 'Profile setup failed.' }, { status: 500 });
  }
}
