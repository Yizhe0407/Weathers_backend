import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const data = async (req, res) => {
    try {
        const email = req.query.email;

        if (!email) {
            return res.status(400).json({ error: "User email not provided" });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true },
        });

        const userId = user.id;

        console.log("userId:", userId);

        // Find user and their associated counties and towns
        const data = await prisma.userCounty.findMany({
            where: {
                userId: userId,
            },
            include: {
                county: {
                    include: {
                        towns: { // 查找與 County 關聯的 Town
                            include: {
                                town: true, // 取出 Town 名稱
                            },
                        },
                    },
                },
            },
        });

        if (!data) {
            return res.status(404).json({ error: "User not found" });
        }

        // Return user's counties and associated towns
        const formattedResult = userCounties.map(userCounty => ({
            county: userCounty.county.county,
            towns: userCounty.county.towns.map(countyTown => countyTown.town.town),
        }));

        // 4. 回傳正確的資料
        res.status(200).json(formattedResult);
    } catch (error) {
        console.error("Error fetching user counties and towns:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
