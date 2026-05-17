import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/auth-admin';

const FilterSchema = z
  .object({
    genres: z.array(z.string().max(40)).optional(),
    excludeGenres: z.array(z.string().max(40)).optional(),
    minYear: z.number().int().min(1900).max(2100).optional(),
    maxYear: z.number().int().min(1900).max(2100).optional(),
    minBpm: z.number().int().min(40).max(240).optional(),
    maxBpm: z.number().int().min(40).max(240).optional(),
    moods: z.array(z.string().max(40)).optional(),
  })
  .strict();

const Body = z.object({
  name: z.string().min(1).max(60),
  filter: FilterSchema,
});

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 });
  const station = await db.station.create({
    data: {
      name: parsed.data.name.trim(),
      filter: parsed.data.filter,
    },
  });
  return NextResponse.json({ ok: true, station });
}
