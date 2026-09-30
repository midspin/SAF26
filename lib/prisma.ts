import { PrismaClient } from '@prisma/client';

const SUPABASE_DB_URL =
  "postgresql://postgres.jfverozexdxztazyodvw:P%40ssc0de_6686@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const activeUrl =
  !process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:')
    ? SUPABASE_DB_URL
    : process.env.DATABASE_URL;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: activeUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

