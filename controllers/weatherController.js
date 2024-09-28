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
                },
            });
        }

        await prisma.userCounty.upsert({
            where: { userId_countyId: { userId: user.id, countyId: countyRecord.id } },
            update: {},
            create: {
                userId: user.id,
                countyId: countyRecord.id,
            }
        });

        // 4. Find or create town with composite unique constraint (town, countyId)
        let townRecord = await prisma.town.findUnique({
            where: {
                town_countyId: { town, countyId: countyRecord.id }
            },
        });

        if (!townRecord) {
            townRecord = await prisma.town.create({
                data: {
                    town,
                    countyId: countyRecord.id, // 需要确保 town 记录与相应 county 关联
                },
            });
        }

        // Upsert county-town 关系（多对多关联）
        await prisma.countyTown.upsert({
            where: { countyId_townId: { countyId: countyRecord.id, townId: townRecord.id } },
            update: {},
            create: {
                countyId: countyRecord.id,
                townId: townRecord.id,
            },
        });

        // 5. Return user along with counties and towns
        const userWithCountiesAndTowns = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
                counties: {
                    include: {
                        county: {
                            include: {
                                towns: true, // 包含 county 下所有的 towns
                            },
                        },
                    },
                },
            },
        });

        res.status(200).json({ user, county: countyRecord, town: townRecord, details: userWithCountiesAndTowns });
    } catch (error) {
        console.error("Error in add:", error);
        res.status(500).json({ error: "Server error" });
    }
};