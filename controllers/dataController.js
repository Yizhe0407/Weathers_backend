import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const data = async (req, res) => {
    try {
        const email = req.query.email;

        if (!email) {
            return res.status(400).json({ error: "User email not provided" });
        }

        // Find user and their associated counties and towns
        const data = await prisma.user.findUnique({
            where: { email },
            include: {
                counties: {
                    include: {
                        county: {
                            include: {
                                towns: true,
                            },
                        },
                    },
                },
            },
        });

        if (!data) {
            return res.status(404).json({ error: "User not found" });
        }

        console.log(data);

        // Return user's counties and associated towns
        res.status(200).json(data.counties.map((userCounty) => ({
            county: userCounty.county.county,
            towns: userCounty.county.towns.map((town) => town.town),
        })));
    } catch (error) {
        console.error("Error fetching user counties and towns:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
