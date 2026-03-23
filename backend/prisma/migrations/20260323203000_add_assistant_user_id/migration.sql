ALTER TABLE "Assistant" ADD COLUMN "userId" TEXT;

UPDATE "Assistant" a
SET "userId" = u."id"
FROM (
  SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1
) u
WHERE a."userId" IS NULL;

DELETE FROM "Assistant" WHERE "userId" IS NULL;

ALTER TABLE "Assistant" ALTER COLUMN "userId" SET NOT NULL;

CREATE INDEX "Assistant_userId_idx" ON "Assistant"("userId");

ALTER TABLE "Assistant"
ADD CONSTRAINT "Assistant_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
