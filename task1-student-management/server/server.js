require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const Student = mongoose.model(
  "Student",
  new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, unique: true, trim: true },
      age: { type: Number, min: 1 },
      course: { type: String, required: true, trim: true },
    },
    { timestamps: true }
  )
);

// Create
app.post("/api/students", async (req, res) => {
  try {
    res.status(201).json(await Student.create(req.body));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Read all
app.get("/api/students", async (req, res) => {
  res.json(await Student.find().sort({ createdAt: -1 }));
});

// Update
app.put("/api/students/:id", async (req, res) => {
  try {
    const s = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    s ? res.json(s) : res.status(404).json({ error: "Not found" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Delete
app.delete("/api/students/:id", async (req, res) => {
  await Student.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(process.env.PORT || 5000, () =>
      console.log("Server running on port " + (process.env.PORT || 5000))
    );
  })
  .catch((err) => console.error("DB connection failed:", err.message));