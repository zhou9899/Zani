// db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zani_bot';

class Database {
  constructor() {
    this.isConnected = false;
    this.connect();
  }

  async connect() {
    try {
      await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      
      this.isConnected = true;
      console.log('✅ MongoDB connected successfully');
      
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
        this.isConnected = false;
      });
      
      mongoose.connection.on('disconnected', () => {
        console.log('🔌 MongoDB disconnected');
        this.isConnected = false;
      });
      
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('🗄️ MongoDB connection closed');
        process.exit(0);
      });
      
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      this.isConnected = false;
      
      // Retry connection after 5 seconds
      setTimeout(() => this.connect(), 5000);
    }
  }

  async ensureConnection() {
    if (!this.isConnected) {
      await this.connect();
    }
    return this.isConnected;
  }
}

export const database = new Database();
export default database;
