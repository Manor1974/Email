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

const Patch = z.object({
  name: z.string().min(1).max(60).optional(),
  filter: FilterSchema.optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = Patch.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  const station = await db.station.update({
    where: { id },
    data: {
      name: parsed.data.name,
      filter: parsed.data.filter,
      isActive: parsed.data.isActive,
    },
  });
  return NextResponse.json({ ok: true, station });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  await db.$transaction([
    db.settings.updateMany({
      where: { activeStationId: id },
      data: { activeStationId: null },
    }),
    db.station.delete({ where: { id } }),
  ]);
  return NextResponse.json({ ok: true });
}
