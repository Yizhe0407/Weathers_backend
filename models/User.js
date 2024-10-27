// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    towns: [{ type: mongoose.Schema.Types.ObjectId, ref: "Town" }] // 引用 Town 模型
});

const User = mongoose.model("User", userSchema);
export default User;
