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

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account with username, email, and password
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The username for the new account
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The email address for the new account
 *               password:
 *                 type: string
 *                 format: password
 *                 description: The password for the new account
 *             required:
 *               - username
 *               - email
 *               - password
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *       400:
 *         description: User already exists with that email or username
 *       500:
 *         description: Failed to register user
 */
router.post("/register", validateRequiredUserData, async (req, res) => {
  try {
    const { username, email, password } = req.body;

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

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const [result]: [ResultSetHeader, any] = await pool.execute(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
    );

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

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user (full update)
 *     description: Replaces all user data. Requires authentication and user can only update their own account
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The new username
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The new email address
 *             required:
 *               - username
 *               - email
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *       403:
 *         description: Users can only update their own account
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Partially update a user
 *     description: Updates only the provided fields. Requires authentication and user can only update their own account
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The new username (optional)
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The new email address (optional)
 *     responses:
 *       200:
 *         description: User partially updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *       403:
 *         description: Users can only update their own account
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: Deletes a user account. Requires authentication and user can only delete their own account
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *     responses:
 *       204:
 *         description: User deleted successfully
 *       403:
 *         description: Users can only delete their own account
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /users/{id}/articles:
 *   get:
 *     summary: Get all articles by a user
 *     description: Retrieves all articles submitted by a specific user, ordered by creation date
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *     responses:
 *       200:
 *         description: List of articles submitted by the user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   title:
 *                     type: string
 *                   body:
 *                     type: string
 *                   category:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *       400:
 *         description: Invalid user ID
 *       500:
 *         description: Failed to fetch user articles
 */
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

/**
 * @swagger
 * /users/{id}/posts-with-user:
 *   get:
 *     summary: Get articles with user information
 *     description: Retrieves all articles submitted by a user with full user details (username and email)
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *     responses:
 *       200:
 *         description: List of articles with user information
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   title:
 *                     type: string
 *                   body:
 *                     type: string
 *                   category:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   username:
 *                     type: string
 *                   email:
 *                     type: string
 *       500:
 *         description: Internal server error
 */
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
