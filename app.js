import cors from 'cors';
import express from 'express';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const app = express();
const API_KEY = process.env.WEATHER_API_KEY;

app.use(cors());
app.use(express.json());

app.post('/weather', async (req, res) => {
    try {
        const { town, apiUrl } = req.body;

        if (!town || !apiUrl) {
            return res.status(400).json({ error: "town或apiUrl缺失" });
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
            return res.status(response.status).json({ error: "无法获取天气数据" });
        }

        const data = await response.json();

        const weatherElement =
            data?.records?.locations?.[0]?.location?.[0]?.weatherElement?.[0];

        if (!weatherElement) {
            return res.status(404).json({ error: "未找到天气信息" });
        }

        const filteredData = weatherElement.time.map((item) => ({
            startTime: item.startTime,
            value: item.elementValue[0].value,
        }));

        console.log("Filtered Weather Data:", filteredData);

        res.status(200).json({ weatherData: filteredData });
    } catch (err) {
        console.error("获取天气数据时发生错误:", err);
        res.status(500).json({ error: "服务器内部错误" });
    }
});

app.post('/add', async (req, res) => {
    try {
        const { username, email, county, town } = req.body;

        if (!username || !email || !county || !town) {
            return res.status(400).json({ error: "All fields are required" });
        }

        console.log("Received data:", { username, email, county, town });

        // 1. 查找是否已存在用户
        let user = await prisma.user.findUnique({
            where: { email },
            include: { countys: true }  // Include related counties
        });

        // 2. 如果用户不存在，创建用户
        if (!user) {
            user = await prisma.user.create({
                data: {
                    username,
                    email
                }
            });
        }

        // 3. 查找是否已存在 county
        let countyRecord = await prisma.county.findUnique({
            where: { county }
        });

        // 4. 如果 county 不存在，创建并关联用户
        if (!countyRecord) {
            countyRecord = await prisma.county.create({
                data: {
                    county,
                    user: { connect: { id: user.id } }  // 使用用户的 ID 进行连接
                }
            });
        }

        // 5. 查找是否已存在 town
        let townRecord = await prisma.town.findUnique({
            where: { town }
        });

        // 6. 如果 town 不存在，创建并关联 county
        if (!townRecord) {
            townRecord = await prisma.town.create({
                data: {
                    town,
                    county: { connect: { id: countyRecord.id } }  // 连接县
                }
            });
        }

        // 7. 查询该用户关联的所有 county 和每个 county 下的所有 town
        const userWithCountiesAndTowns = await prisma.user.findUnique({
            where: { email },
            include: {
                countys: {
                    include: {
                        towns: true
                    }
                }
            }
        });

        // 8. 打印出该用户的所有 county 和 town
        console.log("User's counties and towns:", JSON.stringify(userWithCountiesAndTowns.countys, null, 2));

        // 返回结果
        res.status(200).json({ user, county: countyRecord, town: townRecord, details: userWithCountiesAndTowns });
    } catch (error) {
        console.error("Error in add:", error);
        res.status(500).json({ error: "Server error" });
    }
});

app.get('/data', async (req, res) => {
    try {
        const email = req.query.email;

        if (!email) {
            return res.status(404).json({ error: "User email not found" });
        }

        // Find user and their associated counties and towns
        const data = await prisma.user.findUnique({
            where: { email },
            include: {
                countys: {
                    include: {
                        towns: true,
                    },
                },
            },
        });

        if (!data) {
            return res.status(404).json({ error: "User not found" });
        }

        // Return user's county and town data
        res.status(200).json(data.countys);
    } catch (error) {
        console.error("Error fetching user counties:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});