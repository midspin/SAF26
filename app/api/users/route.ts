import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        department: true,
        avatar: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, username, password, email, role, department, avatar } = body;

    if (!name || !username || !password || !email) {
      return NextResponse.json(
        { success: false, error: 'Name, Username, Password, and Email are required fields.' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: email.trim().toLowerCase() }, { username: username.trim() }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'A user with this username or email already exists.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        username: username.trim(),
        password: password,
        email: email.trim().toLowerCase(),
        role: role || 'VIEWER',
        department: department || 'General',
        avatar: avatar || null,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
