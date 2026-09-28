import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    const { name, username, password, email, role, department, avatar } = body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        username: username !== undefined ? username.trim() : existing.username,
        password: password || existing.password,
        email: email !== undefined ? email.trim().toLowerCase() : existing.email,
        role: role || existing.role,
        department: department || existing.department,
        avatar: avatar || existing.avatar,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    // Prevent deleting the primary Admin user
    if (existing.username === 'Admin') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete the primary SUPER ADMIN user.' },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
