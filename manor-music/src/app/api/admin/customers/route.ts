import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/auth-admin';
import type { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  const filter = req.nextUrl.searchParams.get('filter');

  const where: Prisma.CustomerWhereInput = {};
  if (q) {
    where.OR = [
      { phone: { contains: q, mode: 'insensitive' } },
      { displayName: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (filter === 'banned') where.bannedAt = { not: null };
  if (filter === 'active') where.bannedAt = null;

  const customers = await db.customer.findMany({
    where,
    orderBy: { lastSeenAt: 'desc' },
    take: 100,
    include: {
      _count: {
        select: {
          queueItems: { where: { startedAt: null, removedAt: null } },
          plays: true,
        },
      },
    },
  });

  return NextResponse.json({
    results: customers.map((c) => ({
      id: c.id,
      phone: c.phone,
      displayName: c.displayName,
      bannedAt: c.bannedAt?.toISOString() ?? null,
      banReason: c.banReason,
      createdAt: c.createdAt.toISOString(),
      lastSeenAt: c.lastSeenAt.toISOString(),
      queuedCount: c._count.queueItems,
      playedCount: c._count.plays,
    })),
  });
}
