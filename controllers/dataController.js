import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const data = async (req, res) => {
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
};
