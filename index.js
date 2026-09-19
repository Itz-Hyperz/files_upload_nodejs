const path = require("path");
const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const { error } = require("console");

const app = express();
const PORT = 8000;

mongoose
  .connect("mongodb://127.0.0.1:27017/fileUploadDB")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("Mongo Error", err));

const userFileSchema = new mongoose.Schema(
  {
    profileImage: {
      type: String,
      require: true,
    },
    coverImage: {
      type: String,
      require: true,
    },
  },
  { timeseries: true },
);

const FileModel = mongoose.model("UserFile", userFileSchema);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    return cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    return cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const uploads = multer({ storage });

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

// middleware
app.use(express.urlencoded({ extended: false }));

app.use(express.json());

app.get("/", (req, res) => {
  return res.render("homepage");
});

app.post(
  "/upload",
  uploads.fields([{ name: "profileImage" }, { name: "coverImage" }]),
  async (req, res) => {
    try {
      const profileImagePath =
        req.files && req.files["profileImage"]
          ? req.files["profileImage"][0].path
          : null;
      const coverImagePath =
        req.files && req.files["coverImage"]
          ? req.files["coverImage"][0].path
          : null;

      if (!profileImagePath || !coverImagePath)
        return res.status(400).send("Both files are required.");

      const saveData = await FileModel.create({
        profileImage: profileImagePath,
        coverImage: coverImagePath,
      });

      console.log("Successfully save to database: ", saveData);
      return res.redirect("/");
    } catch (error) {
      console.error("Database Insert Error:", error);
      return res.status(500).send("Internal Server Error");
    }
  },
);

app.listen(PORT, () => console.log(`Server Started at port:${PORT}`));
