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

        if (!data) {
            return res.status(404).json({ error: "User not found" });
        }

        console.log("Data:", data);

        // 提取并格式化为独特的镇名集合
        const townSet = new Set(data.towns.map(userTown => userTown.town.town));

        // 转换为数组并返回镇名列表
        const formattedResult = {
            towns: Array.from(townSet)  // Convert Set to an array of unique town names
        };

        console.log("Formatted result:", formattedResult);

        // 返回格式化的结果
        res.status(200).json(formattedResult);
    } catch (error) {
        console.error("Error fetching user counties and towns:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
