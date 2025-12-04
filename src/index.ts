import express from "express";
import userRoutes from "./routes/users";
import authRoutes from "./routes/auth";
import articleRoutes from "./routes/articles";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
app.use(cors());

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Development Platform API",
      version: "1.0.0",
      description: "API documentation for my course assignment project",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
  },
  apis: ["./src/routes/*.ts"],
};
const swaggerSpecs = swaggerJSDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.use(express.json());
app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/articles", articleRoutes);
