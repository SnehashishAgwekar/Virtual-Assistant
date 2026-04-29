import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  assistantName: {
    type: String,
    default: "Assistant",
  },
  assistantImage: {
    type: String,
    default: "",
  },
  history: [
    {
      type: String,
    }
  ],
  // ✅ NEW — saved contacts for WhatsApp
  contacts: [
    {
      name: { type: String },
      phone: { type: String }, // international format without +: 919876543210
    }
  ]
});

const User = mongoose.model("User", userSchema);
export default User;