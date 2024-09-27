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
        const { username, email } = req.body;

        if (!username || !email) {
            return res.status(400).json({ error: "All fields are required" });
        }

        let user = await prisma.user.findUnique({
            where: { email },
        });
    
        // 如果用户不存在则创建
        if (!user) {
            user = await prisma.user.create({
                data: { username, email }
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
        const { username, email, county, town } = req.body;

        if (!username || !email || !county || !town) {
            return res.status(400).json({ error: "All fields are required" });
        }

        console.log("Received data:", { username, email, county, town });

        // 1. 查找用户
        const user = await prisma.user.findUnique({
            where: { email },
        });

        // 2. 查找或创建县（county）
        let countyRecord = await prisma.county.findUnique({
            where: { county },
        });

        if (!countyRecord) {
            countyRecord = await prisma.county.create({
                data: {
                    county,
                    user: { connect: { id: user.id } }, // 关联用户
                },
            });
        }

        // 3. 查找或创建镇（town）
        let townRecord = await prisma.town.findUnique({
            where: { town },
        });

        if (!townRecord) {
            townRecord = await prisma.town.create({
                data: {
                    town,
                    county: { connect: { id: countyRecord.id } }, // 关联县
                },
            });
        }

        // 4. 查询用户及其关联的县和镇
        const userWithCountiesAndTowns = await prisma.user.findUnique({
            where: { email },
            include: {
                countys: {
                    include: {
                        towns: true,
                    },
                },
            },
        });

        // 5. 返回结果
        res.status(200).json({ user, county: countyRecord, town: townRecord, details: userWithCountiesAndTowns });
    } catch (error) {
        console.error("Error in add:", error);
        res.status(500).json({ error: "Server error" });
    }
};