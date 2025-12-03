import { Router } from "express";
import { pool } from "../database.js";
import { PostWithUser } from "../interfaces.js";
import { authenticateToken } from "../middleware/auth-validation.js";

const router = Router();

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
