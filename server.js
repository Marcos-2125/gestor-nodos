import express from "express";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Para rutas absolutas con ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Rutas Cloudinary
app.delete("/delete/:publicId", async (req, res) => {
  const { publicId } = req.params;
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result === "ok") {
      return res.json({ success: true, message: "Imagen eliminada" });
    } else {
      return res.json({ success: false, error: "No se pudo eliminar. Verifica el public_id." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/list-images", async (req, res) => {
  try {
    const resources = await cloudinary.api.resources({ type: "upload", max_results: 100 });
    res.json(resources.resources);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Servir frontend en cualquier otra ruta
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Servidor
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));

