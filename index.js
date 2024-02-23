const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const { PassThrough } = require("stream");
const cors = require("cors");

const app = express();

app.use("*", cors({ origin: true, credentials: true }));
// Set up multer for file uploads
const upload = multer();

// Ensure the compressed_videos directory exists
const compressedVideosDir = "compressed_videos";
if (!fs.existsSync(compressedVideosDir)) {
  fs.mkdirSync(compressedVideosDir);
}
app.get("/", async (req, res) => {
  res.status(200).json({ name: "shubham sinha, thailesh sinha" });
});
// Endpoint for uploading and compressing a video
app.post("/compress", upload.single("video"), async (req, res) => {
  try {
    const buffer = req.file.buffer;

    // Compress the video buffer
    const compressedVideoBuffer = await compressVideo(buffer);

    // Log the size of the compressed video buffer
    console.log(
      "Compressed video size:",
      compressedVideoBuffer.length,
      "bytes"
    );
    console.log(" video size:", req.file.buffer.length, "bytes");

    // Respond with a success message
    res.status(200).json({
      message: "Compression successful",
      length: compressedVideoBuffer.length,
      compressedVideoBuffer,
    });
  } catch (err) {
    console.error("Error during compression:", err);
    res.status(500).json({ error: "Error during compression" });
  }
});

// Function to compress video buffer using fluent-ffmpeg
const compressVideo = (inputBuffer) => {
  return new Promise((resolve, reject) => {
    const outputFilePath =
      "compressed_videos/compressed_" + Date.now() + ".mp4"; // Define the output file path

    // Use PassThrough to create a readable stream from the input buffer
    const inputStream = new PassThrough();
    inputStream.end(inputBuffer);

    ffmpeg(inputStream)
      .outputOptions([
        "-c:v libx264", // Use H.264 codec for video compression
        "-crf 28", // Constant Rate Factor (CRF) for controlling quality (higher values mean more compression)
        "-preset fast", // Use the fast preset for faster compression
        "-vf scale=-2:480", // Scale the video to a maximum height of 480 pixels while preserving the aspect ratio
        "-movflags +faststart", // Optimize the video for streaming by moving the metadata to the beginning
      ])
      .format("mp4") // Set the output format to mp4
      .on("end", () => {
        console.log("Compression finished");
        const compressedVideoBuffer = fs.readFileSync(outputFilePath); // Read the compressed video buffer from the output file
        resolve(compressedVideoBuffer);
        fs.unlinkSync(outputFilePath); // Delete the temporary output file
      })
      .on("error", (err) => {
        console.error("Error during compression:", err);
        reject(err);
      })
      .save(outputFilePath); // Save the compressed video to a temporary file
  });
};

// Start the server
app.listen(4000, () => {
  console.log("Server is running on port 4000");
});
