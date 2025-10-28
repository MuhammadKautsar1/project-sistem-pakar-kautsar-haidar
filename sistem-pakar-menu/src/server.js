const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");

const knowledgeBase = require("./services/knowledgeBase");
const { InferenceEngine } = require("./services/inferenceEngine");

const app = express();
const PORT = process.env.PORT || 8080;

// ===== Middleware =====
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// ===== API: Ambil seluruh knowledge base =====
app.get("/api/knowledge", async (req, res) => {
  try {
    const kb = await knowledgeBase.getAllRules();
    res.json({
      success: true,
      count: kb.length,
      data: kb,
    });
  } catch (err) {
    console.error("❌ /api/knowledge error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== API: Proses Inferensi =====
// body: { disease: "diabetes", foods: [{ foodId: "M1", preference: 0.8 }] }
app.post("/api/diagnose", async (req, res) => {
  try {
    const { disease, foods } = req.body;

    if (!disease) {
      return res
        .status(400)
        .json({ success: false, error: "Field 'disease' wajib diisi!" });
    }

    // Jalankan inference engine
    const engine = new InferenceEngine();
    const result = await engine.diagnose(disease, foods || []);

    // Kirim hasil
    res.json(result);
  } catch (err) {
    console.error("❌ /api/diagnose error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== Fallback untuk SPA =====
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ===== Jalankan Server =====
app.listen(PORT, () => {
  console.log(`✅ Server berjalan di port ${PORT}`);
  console.log(`🌐 Buka: http://localhost:${PORT}`);
});
