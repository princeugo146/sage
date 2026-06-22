import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/middleware/auth';
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

    const { searchParams } = new URL(req.url);
    const companionId = searchParams.get('companionId');

    if (!companionId) {
      return NextResponse.json(
        { error: 'Missing companionId' },
        { status: 400 }
      );
    }

    const summary = await relationshipEngine.getRelationshipSummary(
      decoded.userId,
      companionId
    );

    if (!summary) {
      return NextResponse.json(
        { error: 'Relationship not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Relationship retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
