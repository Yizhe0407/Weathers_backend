import User from '../models/User.js';

export const data = async (req, res) => {
    const { email } = req.params;

    try {
        const user = await User.findOne({ email }).populate("towns", "town -_id"); // 查詢並 populate towns
        if (user) {
            res.json(user.towns);
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.log("Error:", error.message);
        res.status(500).json({ message: "Error fetching user" });
    }
};