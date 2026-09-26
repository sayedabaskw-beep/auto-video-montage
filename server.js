const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegStatic = require("ffmpeg-static");
const cors = require("cors");

ffmpeg.setFfmpegPath(ffmpegStatic);

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const UPLOADS_DIR = path.join(ROOT_DIR, "uploads");
const OUTPUT_DIR = path.join(ROOT_DIR, "output");

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/output", express.static(OUTPUT_DIR));
app.use(express.static(path.join(ROOT_DIR, "public")));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024
  }
});

function mergeVideos({ introPath, videoPath, logoPath, outputPath }) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(introPath)
      .input(videoPath)
      .input(logoPath)
      .complexFilter([
        "[0:v]scale=1280:720,setsar=1[v0]",
        "[1:v]scale=1280:720,setsar=1[v1]",
        "[2:v]scale=200:200,format=rgba,setsar=1[logo]",
        "[v0][0:a][v1][1:a]concat=n=2:v=1:a=1[vout][aout]",
        "[vout][logo]overlay=main_w-overlay_w-20:20"
      ])
      .outputOptions([
        "-map [vout]",
        "-map [aout]",
        "-c:v libx264",
        "-c:a aac",
        "-movflags +faststart",
        "-shortest",
        "-pix_fmt yuv420p"
      ])
      .on("error", (err) => reject(err))
      .on("end", () => resolve(outputPath))
      .save(outputPath);
  });
}

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "الخادم يعمل بشكل طبيعي" });
});

app.post(
  "/api/merge",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "intro", maxCount: 1 },
    { name: "video", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const logoFile = req.files?.logo?.[0];
      const introFile = req.files?.intro?.[0];
      const videoFile = req.files?.video?.[0];

      if (!logoFile || !introFile || !videoFile) {
        return res.status(400).json({
          success: false,
          message: "يجب رفع اللوجو، الفيديو التعريفي، والفيديو الأساسي جميعاً."
        });
      }

      const outputName = `result-${Date.now()}.mp4`;
      const outputPath = path.join(OUTPUT_DIR, outputName);

      await mergeVideos({
        introPath: introFile.path,
        videoPath: videoFile.path,
        logoPath: logoFile.path,
        outputPath
      });

      res.json({
        success: true,
        message: "تم دمج الفيديو بنجاح.",
        url: `/output/${outputName}`
      });
    } catch (error) {
      console.error("merge error:", error);
      res.status(500).json({
        success: false,
        message: "حدث خطأ أثناء دمج الفيديوهات.",
        error: error.message
      });
    }
  }
);

app.get("*", (req, res) => {
  res.sendFile(path.join(ROOT_DIR, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`الخادم يعمل على http://localhost:${PORT}`);
});
