import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/middleware/auth';
import { db } from '@/db/drizzle';
import { companions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { relationshipEngine } from '@/lib/relationship-engine';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userCompanions = await db.query.companions.findMany({
      where: eq(companions.userId, decoded.userId as any),
    });

    return NextResponse.json({ companions: userCompanions });
  } catch (error) {
    console.error('Companions retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { name, gender, ageStyle, avatarModel, voiceModel, personalityId } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newCompanion = await db
      .insert(companions)
      .values({
        id: undefined as any,
        userId: decoded.userId as any,
        name,
        gender,
        ageStyle,
        avatarModel,
        voiceModel,
        personalityId: personalityId as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const companion = newCompanion[0];

    // Initialize relationship
    await relationshipEngine.initializeRelationship(decoded.userId, companion.id);

    return NextResponse.json(companion, { status: 201 });
  } catch (error) {
    console.error('Companion creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
