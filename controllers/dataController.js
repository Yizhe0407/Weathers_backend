import Redis from "ioredis";
import { PrismaClient } from "@prisma/client";

const redis = new Redis();
const prisma = new PrismaClient();

export const data = async (req, res) => {
    try {
        const email = req.query.email;

        if (!email) {
            return res.status(400).json({ error: "User email not provided" });
        }
        // 检查缓存中是否已有结果
        const cachedResult = await redis.get(`user:${email}:towns`);
        if (cachedResult) {
            return res.status(200).json(JSON.parse(cachedResult));
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

        // 提取并格式化为独特的镇名集合
        const townSet = new Set(data.towns.map(userTown => userTown.town.town));

        // 转换为数组并返回镇名列表
        const formattedResult = {
            towns: Array.from(townSet)  // 将集合转换为数组
        };

        // 将结果存储到 Redis 中，设置过期时间（例如：1 小时）
        await redis.set(`user:${email}:towns`, JSON.stringify(formattedResult), 'EX', 3600);

        // 返回格式化的结果
        res.status(200).json(formattedResult);
    } catch (error) {
        console.error("Error fetching user counties and towns:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
