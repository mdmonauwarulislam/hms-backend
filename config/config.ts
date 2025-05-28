import dotenv from "dotenv"

dotenv.config()

export default {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoURI: process.env.MONGODB_URI || "mongodb+srv://mdmonauwarulIslam:Mannu%40123@cluster0.z564imh.mongodb.net/",
  jwtSecret: process.env.JWT_SECRET || "your-secret-key",
  jwtExpire: process.env.JWT_EXPIRE || "1d",
}
