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

export const add = async (req, res) => {
    try {
        const { username, email, county, town } = req.body;

        // 输入验证
        if (!username || !email || !county || !town) {
            return res.status(400).json({ error: "All fields are required" });
        }

        console.log("Received data:", { username, email, county, town });

        // 1. 使用 upsert 查找或创建用户
        const user = await prisma.user.upsert({
            where: { email },
            update: {},  // 不需要更新，只查找或创建
            create: { username, email },
            include: {
                countys: {
                    include: {
                        towns: true
                    }
                }
            }
        });

        // 2. 使用 upsert 查找或创建县（county），并与用户关联
        const countyRecord = await prisma.county.upsert({
            where: { county },
            update: {},  // 不需要更新
            create: {
                county,
                user: { connect: { id: user.id } }
            },
            include: { towns: true }
        });

        // 3. 使用 upsert 查找或创建镇（town），并与县（county）关联
        const townRecord = await prisma.town.upsert({
            where: { town },
            update: {},  // 不需要更新
            create: {
                town,
                county: { connect: { id: countyRecord.id } }
            }
        });

        // 4. 查询该用户及其关联的县和镇信息
        const userWithDetails = await prisma.user.findUnique({
            where: { email },
            include: {
                countys: {
                    include: { towns: true }
                }
            }
        });

        // 返回结果
        res.status(200).json({ user: userWithDetails, county: countyRecord, town: townRecord });
    } catch (error) {
        console.error("Error in add:", error);
        res.status(500).json({ error: "Server error" });
    }
};
