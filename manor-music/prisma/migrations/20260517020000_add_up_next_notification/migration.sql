-- Track when a customer was notified that their queued song is next up.
-- Prevents duplicate SMS if the queue churns around them (e.g. admin skips
-- a track and theirs becomes "up next" again).
ALTER TABLE "QueueItem" ADD COLUMN "notifiedUpNextAt" TIMESTAMP(3);
