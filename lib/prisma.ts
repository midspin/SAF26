import { PrismaClient } from '@prisma/client';

const SUPABASE_DB_URL =
  "postgresql://postgres.jfverozexdxztazyodvw:P%40ssc0de_6686@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&pool_timeout=15&connect_timeout=10";

// Ensure connection pooler parameters for high concurrency serverless lambdas
function optimizeDatabaseUrl(rawUrl?: string): string {
  if (!rawUrl || rawUrl.startsWith('file:')) {
    return SUPABASE_DB_URL;
  }
  try {
    const url = new URL(rawUrl);
    // If connecting to Supabase pooler (port 6543 or pooler hostname)
    if (url.port === '6543' || url.hostname.includes('pooler.supabase.com')) {
      if (!url.searchParams.has('pgbouncer')) {
        url.searchParams.set('pgbouncer', 'true');
      }
      if (!url.searchParams.has('connection_limit')) {
        url.searchParams.set('connection_limit', '1');
      }
      if (!url.searchParams.has('pool_timeout')) {
        url.searchParams.set('pool_timeout', '15');
      }
      if (!url.searchParams.has('connect_timeout')) {
        url.searchParams.set('connect_timeout', '10');
      }
      return url.toString();
    }
  } catch (e) {
    // If URL parsing fails, return rawUrl
  }
  return rawUrl;
}

const activeUrl = optimizeDatabaseUrl(process.env.DATABASE_URL);

/**
 * Checks if an error is a transient connection pool bottleneck or network blip
 */
export function isTransientDbError(error: any): boolean {
  if (!error) return false;
  const message = (error.message || '').toLowerCase();
  const code = error.code || '';

  // Prisma transient error codes
  if (['P1001', 'P1002', 'P1008', 'P1017', 'P2024', 'P2028', 'P2034'].includes(code)) {
    return true;
  }

  // Common PostgreSQL & Supabase pooler connection exhaustion messages
  if (
    message.includes('too many connections') ||
    message.includes('remaining connection slots') ||
    message.includes('connection pool') ||
    message.includes('pool timeout') ||
    message.includes('connection closed') ||
    message.includes('connection terminated') ||
    message.includes('econnreset') ||
    message.includes('etimedout') ||
    message.includes('timeout') ||
    message.includes('statement_timeout') ||
    message.includes('can\'t reach database server') ||
    message.includes('server closed the connection')
  ) {
    return true;
  }

  return false;
}

/**
 * Helper to run arbitrary database logic with exponential jittered backoff
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  initialDelayMs = 80
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (err: any) {
      attempt++;
      if (attempt >= maxRetries || !isTransientDbError(err)) {
        throw err;
      }
      // Calculate jittered exponential backoff
      const jitter = Math.random() * 50;
      const delay = initialDelayMs * Math.pow(2, attempt - 1) + jitter;
      console.warn(
        `[DB Concurrency Bottleneck Handled] Retrying query (attempt ${attempt}/${maxRetries}) after ${Math.round(
          delay
        )}ms due to: ${err.message || err.code || 'Transient DB Error'}`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

function createPrismaClient() {
  const baseClient = new PrismaClient({
    datasources: {
      db: {
        url: activeUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

  // Attach query middleware extension for automatic resilient retries on all Prisma operations
  return baseClient.$extends({
    query: {
      $allOperations({ operation, args, query }) {
        return executeWithRetry(() => query(args), 3, 75);
      },
    },
  });
}

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = global as unknown as { prisma: ExtendedPrismaClient };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
} else {
  // In serverless production, cache on global to avoid instantiating multiple clients per warm instance
  globalForPrisma.prisma = prisma;
}
