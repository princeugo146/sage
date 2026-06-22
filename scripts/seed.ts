import { db } from '@/db/drizzle';
import { users, companions, relationships } from '@/db/schema';
import { relationshipEngine } from '@/lib/relationship-engine';

/**
 * Seed database with initial data
 */
async function seed() {
  try {
    console.log('Seeding database...');

    // Create test user
    const testUser = await db
      .insert(users)
      .values({
        id: undefined as any,
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/F7O', // bcrypt hash of 'password'
        subscriptionTier: 'free',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const userId = testUser[0].id;

    // Create test companions
    const testCompanion = await db
      .insert(companions)
      .values({
        id: undefined as any,
        userId: userId as any,
        name: 'Alex',
        gender: 'male',
        ageStyle: 26,
        avatarModel: 'default',
        voiceModel: 'young_male',
        personalityId: 'alex' as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const companionId = testCompanion[0].id;

    // Initialize relationship
    await relationshipEngine.initializeRelationship(userId, companionId);

    console.log('✓ Database seeded successfully');
    console.log(`  - User: test@example.com`);
    console.log(`  - Companion: Alex`);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
