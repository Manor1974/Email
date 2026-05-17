-- CreateEnum
CREATE TYPE "QueueSource" AS ENUM ('CUSTOMER', 'STAFF', 'STATION');

-- CreateTable
CREATE TABLE "Song" (
    "id" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "videoPath" TEXT,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "album" TEXT,
    "durationSec" INTEGER NOT NULL,
    "isExplicit" BOOLEAN NOT NULL DEFAULT false,
    "cleanPairId" TEXT,
    "genre" TEXT,
    "bpm" INTEGER,
    "year" INTEGER,
    "energy" DOUBLE PRECISION,
    "mood" TEXT,
    "blockedAt" TIMESTAMP(3),
    "blockedReason" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastPlayedAt" TIMESTAMP(3),

    CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "displayName" TEXT,
    "bannedAt" TIMESTAMP(3),
    "banReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmsCode" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "customerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmsCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueueItem" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "customerId" TEXT,
    "source" "QueueSource" NOT NULL,
    "position" INTEGER NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "skippedAt" TIMESTAMP(3),
    "removedAt" TIMESTAMP(3),
    "removedBy" TEXT,

    CONSTRAINT "QueueItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Play" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "customerId" TEXT,
    "source" "QueueSource" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "skipped" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Play_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SongRequest" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "fulfilledSongId" TEXT,
    "fulfilledAt" TIMESTAMP(3),
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SongRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExplicitWindow" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ExplicitWindow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Station" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filter" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Station_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "maxSongsPerCustomer" INTEGER NOT NULL DEFAULT 3,
    "songCooldownHours" INTEGER NOT NULL DEFAULT 4,
    "artistCooldownMinutes" INTEGER NOT NULL DEFAULT 45,
    "customerBlendRatio" INTEGER NOT NULL DEFAULT 1,
    "activeStationId" TEXT,
    "cleanModeOverride" TEXT NOT NULL DEFAULT 'AUTO',

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Song_filePath_key" ON "Song"("filePath");

-- CreateIndex
CREATE INDEX "Song_artist_idx" ON "Song"("artist");

-- CreateIndex
CREATE INDEX "Song_title_idx" ON "Song"("title");

-- CreateIndex
CREATE INDEX "Song_genre_idx" ON "Song"("genre");

-- CreateIndex
CREATE INDEX "Song_blockedAt_idx" ON "Song"("blockedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");

-- CreateIndex
CREATE INDEX "SmsCode_phone_code_idx" ON "SmsCode"("phone", "code");

-- CreateIndex
CREATE INDEX "QueueItem_position_idx" ON "QueueItem"("position");

-- CreateIndex
CREATE INDEX "QueueItem_startedAt_idx" ON "QueueItem"("startedAt");

-- CreateIndex
CREATE INDEX "Play_startedAt_idx" ON "Play"("startedAt");

-- CreateIndex
CREATE INDEX "Play_songId_startedAt_idx" ON "Play"("songId", "startedAt");

-- CreateIndex
CREATE INDEX "SongRequest_createdAt_idx" ON "SongRequest"("createdAt");

-- CreateIndex
CREATE INDEX "SongRequest_fulfilledAt_idx" ON "SongRequest"("fulfilledAt");

-- AddForeignKey
ALTER TABLE "Song" ADD CONSTRAINT "Song_cleanPairId_fkey" FOREIGN KEY ("cleanPairId") REFERENCES "Song"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsCode" ADD CONSTRAINT "SmsCode_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueItem" ADD CONSTRAINT "QueueItem_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueItem" ADD CONSTRAINT "QueueItem_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Play" ADD CONSTRAINT "Play_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Play" ADD CONSTRAINT "Play_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongRequest" ADD CONSTRAINT "SongRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongRequest" ADD CONSTRAINT "SongRequest_fulfilledSongId_fkey" FOREIGN KEY ("fulfilledSongId") REFERENCES "Song"("id") ON DELETE SET NULL ON UPDATE CASCADE;

