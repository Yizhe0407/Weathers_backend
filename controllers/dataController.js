import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const data = async (req, res) => {
    try {
        const email = req.query.email;

        if (!email) {
            return res.status(400).json({ error: "User email not provided" });
        }

        // 查找 user 相关的县和镇
        const data = await prisma.user.findUnique({
            where: { email },
            include: {
                towns: {
                    include: {
                        town: true  // 获取与用户关联的 town 信息
                    }
                }
            }
        });

        // 格式化返回的结果
        const formattedResult = {
            towns: data.towns.map(userTown => ({
                town: userTown.town.town
            }))
        };

        // 返回格式化的结果
        res.status(200).json(formattedResult);
    } catch (error) {
        console.error("Error fetching user counties and towns:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
