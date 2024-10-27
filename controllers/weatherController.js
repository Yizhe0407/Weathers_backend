import User from '../models/User.js';
import Town from '../models/Town.js';

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
            console.log("API Key:", API_KEY);
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
    const { username, email, towns } = req.body; // 從請求中獲取用戶資料與城鎮

    try {
        // 確保 towns 是一個數組
        const townsArray = Array.isArray(towns) ? towns : [towns];

        // 確保每個 town 都存在或創建
        const townIds = await Promise.all(townsArray.map(async (townName) => {
            let town = await Town.findOne({ town: townName });
            if (!town) {
                town = await Town.create({ town: townName });
            }
            return town._id;
        }));

        // 檢查是否存在用戶
        let user = await User.findOne({ username });
        if (!user) {
            // 創建新的 User 並關聯 Town
            user = await User.create({
                username,
                email,
                towns: townIds, // 關聯 Town 的 ObjectId
            });
            return res.status(201).json({ message: "User created", user });
        } else {
            // 用戶存在：更新 Town 列表
            const existingTownIds = new Set(user.towns.map(id => id.toString()));
            const newTownIds = townIds.filter(id => !existingTownIds.has(id.toString()));

            if (newTownIds.length > 0) {
                user.towns.push(...newTownIds);
                await user.save();
            }

            return res.status(200).json({ message: "User updated with new towns", user });
        }
    } catch (error) {
        console.log("Error:", error.message);
        res.status(500).json({ message: "Error creating or updating user" });
    }
}

export const del = async (req, res) => {
    const { email, town } = req.body;

    try {
        // 查找指定的 user，不使用 populate
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // 查找指定的 town 的 ObjectId
        const townToRemove = await Town.findOne({ town });
        if (!townToRemove) {
            return res.status(404).json({ message: "Town not found" });
        }

        // 确保对 ObjectId 的直接引用进行过滤
        const townIdToRemove = townToRemove._id;
        user.towns = user.towns.filter(
            (userTownId) => !userTownId.equals(townIdToRemove)
        );

        // 保存用戶的更新信息
        await user.save();
        res.status(200).json({ message: "Town removed from user", user });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ message: "Error removing town from user" });
    }
}