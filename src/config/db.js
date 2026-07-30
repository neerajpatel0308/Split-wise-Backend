import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected ! Yeah ");
  } catch (error) {
    console.log("MongoDb not Connected");
    console.error(error.message);
    process.exit(1);
  }
};

export default connectDB;
