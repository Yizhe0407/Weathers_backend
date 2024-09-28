import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const data = async (req, res) => {
    try {
        const email = req.query.email;

        if (!email) {
            return res.status(400).json({ error: "User email not provided" });
        }

        // 查找用户，并获取其 ID
        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, username: true },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        console.log("User:", user);

        // 查找 user 相关的县和镇
        const userCounties = await prisma.userCounty.findMany({
            where: {
                userId: user.id,  // 根据 userId 查询
            },
            include: {
                county: {  // 查找关联的县 (修正: 使用 county 而不是 counties)
                    include: {
                        towns: true,  // 包含县关联的所有镇
                    },
                },
            },
        });

        console.log("User counties and towns:", userCounties);

        if (!userCounties || userCounties.length === 0) {
            return res.status(404).json({ error: "No counties found for the user" });
        }

        // 格式化结果，将县和其关联的镇返回
        const formattedResult = userCounties.map(userCounty => ({
            county: userCounty.county.county,
            towns: userCounty.county.towns.map(town => town.town),
        }));

        // 返回格式化的结果
        res.status(200).json(formattedResult);
    } catch (error) {
        console.error("Error fetching user counties and towns:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
