// server.js
import express from "express";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // permite peticiones desde cualquier origen
app.use(express.json());
app.use(express.static("public")); // sirve tu frontend si lo pones en /public

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Ruta para eliminar imagen por public_id
app.delete("/delete/:publicId", async (req, res) => {
  const { publicId } = req.params;
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result === "ok") {
      return res.json({ success: true, message: "Imagen eliminada de Cloudinary" });
    } else {
      return res.json({ success: false, error: "No se pudo eliminar. Verifica el public_id." });
    }
  } catch (error) {
    console.error("Error al eliminar en Cloudinary:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Ruta opcional para listar imágenes en Cloudinary
app.get("/list-images", async (req, res) => {
  try {
    const resources = await cloudinary.api.resources({ type: "upload", max_results: 100 });
    res.json(resources.resources);
  } catch (error) {
    console.error("Error al listar imágenes:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Servidor
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
