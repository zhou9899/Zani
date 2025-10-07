import mongoose from "mongoose";

const ProfileSchema = new mongoose.Schema({
  number: { type: String, required: true },
  chatId: { type: String, required: true },
  name: { type: String, default: "Unknown" },
  age: { type: String, default: "N/A" },
  bio: { type: String, default: "No bio set" },
});

ProfileSchema.index({ number: 1, chatId: 1 }, { unique: true });

export default mongoose.model("Profile", ProfileSchema);
