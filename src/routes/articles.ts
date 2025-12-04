import { Router } from "express";
import { pool } from "../database.js";
import { PostWithUser } from "../interfaces.js";
import { authenticateToken } from "../middleware/auth-validation.js";

const router = Router();

/**
 * @swagger
 * /articles:
 *   get:
 *     summary: Get all articles
 *     description: Retrieves all articles from all users, ordered by creation date (newest first)
 *     tags:
 *       - Articles
 *     responses:
 *       200:
 *         description: List of all articles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                   body:
 *                     type: string
 *                   category:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Failed to fetch articles
 */
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT   articles.title, articles.body, articles.category,  articles.created_at FROM articles INNER JOIN users ON articles.submitted_by = users.id ORDER BY articles.created_at DESC`
    );

    const articles = rows as PostWithUser[];
    res.json(articles);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Failed to fetch articles" });
  }
});

/**
 * @swagger
 * /articles:
 *   post:
 *     summary: Create a new article
 *     description: Creates a new article. Requires authentication
 *     tags:
 *       - Articles
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: The title of the article
 *               body:
 *                 type: string
 *                 description: The content of the article
 *               category:
 *                 type: string
 *                 description: The category of the article
 *             required:
 *               - title
 *               - body
 *               - category
 *     responses:
 *       201:
 *         description: Article created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 article:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     title:
 *                       type: string
 *                     body:
 *                       type: string
 *                     category:
 *                       type: string
 *                     user_id:
 *                       type: integer
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Failed to create article
 */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { title, body, category } = req.body;

    if (!title || !body || !category) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const submitted_by = req.user!.id;

    const [result]: any = await pool.execute(
      `INSERT INTO articles (title, body, category, submitted_by)
       VALUES (?, ?, ?, ?)`,
      [title, body, category, submitted_by]
    );

    res.status(201).json({
      message: "Article created",
      article: {
        id: result.insertId,
        title,
        body,
        category,
        user_id: submitted_by,
      },
    });
  } catch (error) {
    console.error("Error creating article:", error);
    res.status(500).json({ error: "Failed to create article" });
  }
});

export default router;
