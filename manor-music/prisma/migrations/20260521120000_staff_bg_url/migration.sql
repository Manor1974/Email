-- Optional background image URL for the staff DJ console. Nullable so it's
-- safe to add to a running production schema without affecting existing code.
ALTER TABLE "Settings" ADD COLUMN "staffBackgroundUrl" TEXT;
