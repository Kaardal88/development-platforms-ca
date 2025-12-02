import express from "express";
import userRoutes from "./routes/users";
import authRoutes from "./routes/auth";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
app.use(cors());

app.get("/", (req, res) => {
  res.json({ message: "Hallaien verda" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.use(express.json());
app.use("/users", userRoutes);
app.use("/auth", authRoutes);
