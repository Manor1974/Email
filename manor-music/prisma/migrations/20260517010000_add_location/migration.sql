-- Per-zone request tracking.
-- "location" is a free-text label set by QR-code URL params (?location=Bar,
-- ?location=Volleyball+1, ?location=Lane+7). Recorded on QueueItem at queue
-- time and copied onto Play for historical reporting.

ALTER TABLE "QueueItem" ADD COLUMN "location" TEXT;
ALTER TABLE "Play"      ADD COLUMN "location" TEXT;

CREATE INDEX "QueueItem_location_idx" ON "QueueItem"("location");
CREATE INDEX "Play_location_idx"      ON "Play"("location");
