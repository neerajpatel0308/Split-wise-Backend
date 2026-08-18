import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => {
  console.error("Redis Error :", err);
});

redisClient.on("Connect", () => {
  console.log("Redis Connecting...");
});

redisClient.on("Ready", () => {
  console.log("Redis Connected Succesfully");
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error("Redis Connection Failed:", error);
  }
};

export default redisClient;
