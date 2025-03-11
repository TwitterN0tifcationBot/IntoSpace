const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 5000;
const SECRET_KEY = "YOUR_SECRET_KEY";

// Middleware
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/intospace", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Schema
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  boosts: { type: Number, default: 0 },
});

const User = mongoose.model("User", userSchema);

// Server Schema
const serverSchema = new mongoose.Schema({
  name: String,
  owner: String,
  boosts: Number,
});

const Server = mongoose.model("Server", serverSchema);

// Routes
app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({ username, email, password: hashedPassword });
  await user.save();
  res.status(201).send("User created");
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ username }, SECRET_KEY);
    res.json({ token });
  } else {
    res.status(401).send("Invalid credentials");
  }
});

app.get("/user", async (req, res) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).send("Unauthorized");

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await User.findOne({ username: decoded.username });
    res.json(user);
  } catch (err) {
    res.status(401).send("Invalid token");
  }
});

app.post("/boost", async (req, res) => {
  const { username, boosts } = req.body;
  const user = await User.findOne({ username });
  user.boosts += boosts;
  await user.save();
  res.send("Boosts updated");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
