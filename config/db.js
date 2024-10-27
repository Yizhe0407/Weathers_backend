import mongoose from 'mongoose';

export const ConnectDB = async () => {
    await mongoose.connect("mongodb+srv://Yizhe:RASeBkq9niHDFUcV@cluster0.y5zpn.mongodb.net/weather?retryWrites=true&w=majority&appName=Cluster0");
    console.log("Database connected");
}