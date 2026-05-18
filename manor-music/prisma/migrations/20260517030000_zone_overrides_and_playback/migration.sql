-- Per-zone explicit-lyrics overrides (bar can be always-explicit, courts
-- always-clean, lanes follow the schedule).
CREATE TABLE "ZoneOverride" (
    "id"        TEXT NOT NULL,
    "zone"      TEXT NOT NULL,
    "mode"      TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ZoneOverride_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ZoneOverride_zone_key" ON "ZoneOverride"("zone");

-- Playback state lives on the singleton Settings row so the player can poll
-- one endpoint to get everything it needs.
ALTER TABLE "Settings" ADD COLUMN "playbackState" TEXT NOT NULL DEFAULT 'PLAYING';
ALTER TABLE "Settings" ADD COLUMN "playbackVolume" INTEGER NOT NULL DEFAULT 80;
