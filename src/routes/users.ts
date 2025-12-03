import { pool } from "../database.js";
import { Router } from "express";
import { ResultSetHeader } from "mysql2";
import { Article, User, UserResponse, PostWithUser } from "../interfaces.js";
import bcrypt from "bcrypt";
import {
  validateRequiredUserData,
  validateUserId,
  validatePartialUserData,
} from "../middleware/user-validation.js";
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

router.put(
  "/:id",
  authenticateToken,
  validateUserId,
  validateRequiredUserData,
  async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const { username, email } = req.body;

      if (req.user!.id !== userId) {
        return res.status(403).json({
          error: "Users can only update their own account",
        });
      }

      const [result]: [ResultSetHeader, any] = await pool.execute(
        "UPDATE users SET username = ?, email = ? WHERE id = ?",
        [username, email, userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      const user: User = { id: userId, username, email };
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.patch(
  "/:id",
  authenticateToken,
  validateUserId,
  validatePartialUserData,
  async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const { username, email } = req.body;

      if (req.user!.id !== userId) {
        return res.status(403).json({
          error: "Users can only update their own account",
        });
      }
      const fieldsToUpdate = [];
      const values = [];
      if (username) {
        fieldsToUpdate.push("username = ?");
        values.push(username);
      }
      if (email) {
        fieldsToUpdate.push("email = ?");
        values.push(email);
      }
      values.push(userId);

      const query = `UPDATE users SET ${fieldsToUpdate.join(
        ", "
      )} WHERE id = ?`;
      const [result]: [ResultSetHeader, any] = await pool.execute(
        query,
        values
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const [rows] = await pool.execute("SELECT * FROM users WHERE id = ?", [
        userId,
      ]);
      const users = rows as User[];
      res.json(users[0]);
    } catch (error) {
      console.error("Error partially updating user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.delete("/:id", authenticateToken, validateUserId, async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (req.user!.id !== userId) {
      return res.status(403).json({
        error: "Users can only update their own account",
      });
    }

    const [result]: [ResultSetHeader, any] = await pool.execute(
      "DELETE FROM users WHERE id = ?",
      [userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id/articles", async (req, res) => {
  try {
    const submitted_by = Number(req.params.id);

    if (isNaN(submitted_by)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const [rows] = await pool.execute(
      `SELECT articles.id, articles.title, articles.body, articles.category, articles.created_at FROM articles WHERE articles.submitted_by= ? ORDER BY articles.created_at DESC`,
      [submitted_by]
    );

    const articles = rows as Article[];
    res.json(articles);
  } catch (error) {
    console.error("Error fetching user article", error);
    return res.status(500).json({ error: "Failed to fetch user article" });
  }
});

router.get("/:id/posts-with-user", async (req, res) => {
  const submitted_by = Number(req.params.id);

  const [rows] = await pool.execute(
    `
    SELECT articles.id, articles.title, articles.body, articles.category, articles.created_at,
           users.username, users.email
    FROM articles
    INNER JOIN users ON articles.submitted_by = users.id
    WHERE users.id = ?
  `,
    [submitted_by]
  );

  const articles = rows as PostWithUser[];
  res.json(articles);
});

export default router;
