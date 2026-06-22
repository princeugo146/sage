import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Test Anthropic Claude API connection
 */
async function testClaudeConnection() {
  try {
    console.log('Testing Claude API connection...');
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Say hello briefly',
        },
      ],
    });
    console.log('✓ Claude API connected successfully');
    return true;
  } catch (error) {
    console.error('✗ Claude API connection failed:', error);
    return false;
  }
}

/**
 * Test PostgreSQL connection
 */
async function testPostgresConnection() {
  try {
    console.log('Testing PostgreSQL connection...');
    const postgres = (await import('postgres')).default;
    const sql = postgres(process.env.DATABASE_URL || '');
    await sql`SELECT 1`;
    console.log('✓ PostgreSQL connected successfully');
    await sql.end();
    return true;
  } catch (error) {
    console.error('✗ PostgreSQL connection failed:', error);
    return false;
  }
}

/**
 * Test Qdrant connection
 */
async function testQdrantConnection() {
  try {
    console.log('Testing Qdrant connection...');
    const response = await fetch(
      `${process.env.QDRANT_URL || 'http://localhost:6333'}/health`
    );
    if (response.ok) {
      console.log('✓ Qdrant connected successfully');
      return true;
    } else {
      throw new Error('Qdrant health check failed');
    }
  } catch (error) {
    console.error('✗ Qdrant connection failed:', error);
    return false;
  }
}

/**
 * Test Redis connection
 */
async function testRedisConnection() {
  try {
    console.log('Testing Redis connection...');
    const redis = (await import('redis')).createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    await redis.connect();
    await redis.ping();
    await redis.disconnect();
    console.log('✓ Redis connected successfully');
    return true;
  } catch (error) {
    console.error('✗ Redis connection failed:', error);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('\n=== SAGE System Health Check ===\n');

  const results = {
    claude: false,
    postgres: false,
    qdrant: false,
    redis: false,
  };

  results.claude = await testClaudeConnection();
  results.postgres = await testPostgresConnection();
  results.qdrant = await testQdrantConnection();
  results.redis = await testRedisConnection();

  console.log('\n=== Test Results ===');
  const allPassed = Object.values(results).every((r) => r);
  console.log(`Status: ${allPassed ? '✓ All systems operational' : '✗ Some systems failed'}\n`);

  process.exit(allPassed ? 0 : 1);
}

runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
