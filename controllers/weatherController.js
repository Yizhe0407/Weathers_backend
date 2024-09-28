import { PrismaClient } from "@prisma/client";

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

        console.log("Filtered Weather Data:", filteredData);

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


export const add = async (req, res) => {
    try {
        const { username, email, town } = req.body;

        if (!username || !email || !town) {
            return res.status(400).json({ error: "All fields are required" });
        }

        console.log("Received data:", { username, email, town });

        // 1. 查找用户
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // 2. 查找或创建镇
        const townRecord = await prisma.town.findFirst({
            where: { town },
        });

        if (!townRecord) {
            townRecord = await prisma.town.create({
                data: { town },
            });
        }

        // 3. 创建 User 和 Town 的关联
        const userTown = await prisma.userTown.findUnique({
            where: {
                userId_townId: {
                    userId: user.id,
                    townId: townRecord.id,
                },
            },
        });

        if (!userTown) {
            await prisma.userTown.create({
                data: {
                    userId: user.id,
                    townId: townRecord.id,
                },
            });
        }

        res.status(200).json("Add successful");
    } catch (error) {
        console.error("Error in add:", error);
        res.status(500).json({ error: "Server error" });
    }
};