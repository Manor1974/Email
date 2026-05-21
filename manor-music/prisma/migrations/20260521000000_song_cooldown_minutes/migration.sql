-- Switch song cooldown from hours to minutes so operators can set
-- sub-hour values (e.g. 45 min). Convert any existing values in-place.
ALTER TABLE "Settings" RENAME COLUMN "songCooldownHours" TO "songCooldownMinutes";
ALTER TABLE "Settings" ALTER COLUMN "songCooldownMinutes" SET DEFAULT 45;
UPDATE "Settings" SET "songCooldownMinutes" = "songCooldownMinutes" * 60;
