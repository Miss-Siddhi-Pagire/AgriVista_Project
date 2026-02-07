const { Post, Postfetch, PostId, DeletePostAndComments, UpdatePost, LikePost } = require('../Controllers/PostController');
const router = require("express").Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

router.post("/Post", upload.single("image"), Post);
router.get("/Postfetch", Postfetch);
router.get("/PostId", PostId);
router.put("/UpdatePost", upload.single("image"), UpdatePost);
router.patch("/:id/likePost", LikePost);
router.delete('/DeletePostAndComments', DeletePostAndComments);
module.exports = router;