import { PrismaClient } from "@prisma/client";
import redis from "redis";
import util from "util";

// 初始化 Prisma 和 Redis 客戶端
const prisma = new PrismaClient();
const redisClient = redis.createClient();

// 使用 Promisify 將 Redis 的 get/set 方法轉為 promise 形式
const getAsync = util.promisify(redisClient.get).bind(redisClient);
const setAsync = util.promisify(redisClient.set).bind(redisClient);

export const data = async (req, res) => {
    try {
        const email = req.query.email;

        if (!email) {
            return res.status(400).json({ error: "User email not provided" });
        }

        // 首先檢查 Redis 快取中是否有數據
        const cachedData = await getAsync(email);
        if (cachedData) {
            // 如果有快取，直接返回快取的結果
            return res.status(200).json(JSON.parse(cachedData));
        }

        // 如果 Redis 中沒有數據，則從資料庫查詢
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

        // 將結果存入 Redis，設置快取有效期為 1 小時（3600 秒）
        await setAsync(email, JSON.stringify(formattedResult), 'EX', 3600);

        // 返回格式化的结果
        res.status(200).json(formattedResult);
    } catch (error) {
        console.error("Error fetching user counties and towns:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
