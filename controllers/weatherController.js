import Redis from "ioredis";
import { PrismaClient } from "@prisma/client";

const redis = new Redis();
const prisma = new PrismaClient();

const API_KEY = process.env.WEATHER_API_KEY;

export const weather = async (req, res) => {
    try {
        const { town, apiUrl } = req.body;

        if (!town || !apiUrl) {
            return res.status(400).json({ error: "town or apiUrl is missing" });
        }

        const response = await fetch(
            `${apiUrl}?Authorization=${API_KEY}&locationName=${town}&elementName=WeatherDescription`,
            {
                headers: {
                    accept: "application/json",
                },
            }
        );

        if (!response.ok) {
            return res.status(response.status).json({ error: "Unable to get weather data" });
        }

        const data = await response.json();

        const weatherElement =
            data?.records?.locations?.[0]?.location?.[0]?.weatherElement?.[0];

        if (!weatherElement) {
            return res.status(404).json({ error: "No weather information found" });
        }

        const filteredData = weatherElement.time.map((item) => ({
            startTime: item.startTime,
            value: item.elementValue[0].value,
        }));

        res.status(200).json({ weatherData: filteredData });
    } catch (err) {
        console.error("An error occurred while getting weather data:", err);
        res.status(500).json({ error: "Server error" });
    }
};

export const createUser = async (req, res) => {
    try {
        const { email, username } = req.body;  // 从 req.body 中解构出 email 和 username

        if (!email || !username) {  // 检查 email 和 username 是否都存在
            return res.status(400).json({ error: "Email and username are required" });
        }

        // 查找用户是否存在
        let user = await prisma.user.findUnique({
            where: { email },  // email 应该是字符串
        });

        // 如果用户不存在则创建
        if (!user) {
            user = await prisma.user.create({
                data: { username, email }  // 创建时需要提供 username 和 email
            });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Error in createUser:", error);
        res.status(500).json({ error: "Server error" });
    }
};

export const deleteTown = async (req, res) => {
    try {
        const { email, town } = req.body;

        // 檢查請求中是否提供了 email 和 town
        if (!email || !town) {
            return res.status(400).json({ error: "Email and town are required" });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ error: "User not found" });

        const townRecord = await prisma.town.findFirst({ where: { town } });
        if (!townRecord) return res.status(404).json({ error: "Town not found" });

        // 查找 User 和 Town 的關聯
        const userTown = await prisma.userTown.findUnique({
            where: {
                userId_townId: {
                    userId: user.id,
                    townId: townRecord.id,
                },
            },
        });

        if (!userTown) {
            return res.status(404).json({ error: "User is not associated with this town" });
        }

        // 使用事务处理删除操作
        await prisma.$transaction([
            prisma.userTown.delete({
                where: { userId_townId: { userId: user.id, townId: townRecord.id } },
            }),
        ]);

        // 清除相关的 Redis 缓存
        await redis.del(`user:${email}:towns`);

        res.status(200).json("Town association deleted successfully");
    } catch (error) {
        console.error("Error in deleteTown:", error);
        res.status(500).json({ error: "Server error" });
    }
};



export const add = async (req, res) => {
    try {
        const { username, email, town } = req.body;

        if (!username || !email || !town) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // 1. 查找用户
        const user = await prisma.user.findUnique({
            where: { email },
        });

        // 2. 查找或创建镇并同时创建关联
        await prisma.userTown.upsert({
            where: {
                userId_townId: {
                    userId: user.id,
                    townId: (await prisma.town.upsert({
                        where: { town },
                        update: {},  // 如果镇已存在，不做更新
                        create: { town },  // 如果镇不存在，创建新镇
                    })).id,  // 返回新创建或找到的镇的 id
                },
            },
            update: {},  // 如果关联已存在，不做更新
            create: { userId: user.id, townId: (await prisma.town.findUnique({ where: { town } })).id },  // 创建新关联
        });

        res.status(200).json("Add successful");
    } catch (error) {
        console.error("Error in add:", error);
        res.status(500).json({ error: "Server error" });
    }
};