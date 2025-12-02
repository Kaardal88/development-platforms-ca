import { pool } from "../database.js";
import { Router } from "express";
import { ResultSetHeader } from "mysql2";
import { User, UserResponse } from "../interfaces.js";
import bcrypt from "bcrypt";
import { validateRequiredUserData } from "../middleware/user-validation.js";
import { authenticateToken } from "../middleware/auth-validation";

const router = Router();

router.post("/register", validateRequiredUserData, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const [rows] = await pool.execute(
      "SELECT * FROM users WHERE email = ? OR username = ?",
      [email, username]
    );
    const existingUsers = rows as User[];

    if (existingUsers.length > 0) {
      return res.status(400).json({
        error: "User already exists with that email or username",
      });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create the user in database
    const [result]: [ResultSetHeader, any] = await pool.execute(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
    );

    // Return user info (without password)
    const userResponse: UserResponse = {
      id: result.insertId,
      username,
      email,
    };

    res.status(201).json({
      message: "User registered successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      error: "Failed to register user",
    });
  }
});

router.get("/users", async (req, res) => {
  try {
    // This is the same SQL query you used in Lesson 1
    const [rows] = await pool.execute("SELECT * FROM users");
    const users = rows as User[]; // Type the result for clarity

    // Return the users array to the frontend
    res.json(users);
  } catch (error) {
    console.error("Database query error:", error);
    res.status(500).json({
      error: "Failed to fetch users",
    });
  }
});

export default router;
