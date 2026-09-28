import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and Password are required.' },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim().toLowerCase();
    const trimmedPassword = password.trim();

    // Query all users to match username, email, or display name case-insensitively
    const allUsers = await prisma.user.findMany();
    const user = allUsers.find(
      (u) =>
        (u.username && u.username.trim().toLowerCase() === trimmedUsername) ||
        (u.email && u.email.trim().toLowerCase() === trimmedUsername) ||
        (u.name && u.name.trim().toLowerCase() === trimmedUsername)
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    // Verify password
    if (user.password && user.password.trim() !== trimmedPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      username: user.username || user.email.split('@')[0],
      email: user.email,
      phone: user.phone || null,
      role: user.role,
      department: user.department,
      avatar: user.avatar,
      mustChangePassword: user.mustChangePassword || user.password === 'pass',
    };

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: sessionUser,
    });
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Authentication failed.' },
      { status: 500 }
    );
  }
}
