import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/middleware/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, username, password } = await req.json();

    // Validate input
    if (!email || !username || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        id: undefined as any,
        email,
        username,
        passwordHash: hashedPassword,
        subscriptionTier: 'free',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const user = newUser[0];

    // Generate token
    const token = generateToken(user.id, user.email);

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
        token,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
