import { Router } from "express";
import bcrypt from "bcrypt";
import { ResultSetHeader } from "mysql2";
import { pool } from "../database";
import {
  validateRegistration,
  validateLogin,
} from "../middleware/auth-validation";
import { User, UserResponse } from "../interfaces";
import { generateToken } from "../utils/jwt";

const router = Router();

router.post("/register", validateRegistration, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const [rows] = await pool.execute(
      "SELECT * FROM users WHERE email = ? OR username = ?",
      [username, email]
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

router.post("/login", validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.execute(
      "SELECT id, username, email, password FROM users WHERE email = ?",
      [email]
    );
    const users = rows as User[];

    if (users.length === 0) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const user = users[0];

    const validPassword = await bcrypt.compare(password, user.password!);

    if (!validPassword) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const token = generateToken(user.id);

    const userResponse: UserResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
    };

    res.json({
      message: "Login successful",
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Failed to log in",
    });
  }
});

export default router;
