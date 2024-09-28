-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "County" (
    "id" SERIAL NOT NULL,
    "county" TEXT NOT NULL,

    CONSTRAINT "County_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Town" (
    "id" SERIAL NOT NULL,
    "town" TEXT NOT NULL,

    CONSTRAINT "Town_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCounty" (
    "userId" INTEGER NOT NULL,
    "countyId" INTEGER NOT NULL,

    CONSTRAINT "UserCounty_pkey" PRIMARY KEY ("userId","countyId")
);

-- CreateTable
CREATE TABLE "CountyTown" (
    "countyId" INTEGER NOT NULL,
    "townId" INTEGER NOT NULL,

    CONSTRAINT "CountyTown_pkey" PRIMARY KEY ("countyId","townId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "County_county_key" ON "County"("county");

-- CreateIndex
CREATE UNIQUE INDEX "Town_town_id_key" ON "Town"("town", "id");

-- AddForeignKey
ALTER TABLE "UserCounty" ADD CONSTRAINT "UserCounty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCounty" ADD CONSTRAINT "UserCounty_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CountyTown" ADD CONSTRAINT "CountyTown_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CountyTown" ADD CONSTRAINT "CountyTown_townId_fkey" FOREIGN KEY ("townId") REFERENCES "Town"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
