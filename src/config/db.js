import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI, {
            dbName: DB_NAME,
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log(`\n MongoDB connection successful !! DB Host: ${connectionInstance.connection.host}`)
        console.log('Connecting to Mongo at host from MONGODB_URI with dbName:', DB_NAME);
    } catch (error) {
        console.error("MongoDB connection Failed: " + error);
        process.exit(1)
    }   
}

export { connectDB }
