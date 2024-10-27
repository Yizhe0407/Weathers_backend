// models/Town.js
import mongoose from "mongoose";

const townSchema = new mongoose.Schema({
    town: { type: String, required: true },
});

const Town = mongoose.model("Town", townSchema);
export default Town;
