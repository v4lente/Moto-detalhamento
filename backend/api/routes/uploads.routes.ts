import type { Express } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { requireAuth } from "../middleware/auth";

/**
 * File upload routes
 */
export function registerUploadsRoutes(app: Express) {
  const uploadsDir = path.resolve(process.cwd(), "public/uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, uploadsDir),
      filename: (_req, _file, cb) => cb(null, `${randomUUID()}.jpg`),
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Apenas imagens são permitidas"));
      }
    },
  });

  // Protected upload route - requires admin authentication
  app.post("/api/uploads/local", requireAuth, upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }
    const filePath = `/uploads/${req.file.filename}`;
    res.json({ filePath });
  });
}
