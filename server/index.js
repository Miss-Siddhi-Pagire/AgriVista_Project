const { connectDB } = require("./config/db");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const authRoute = require("./Routes/AuthRoute");
const dataRoute = require("./Routes/DataRoute");
const cropRoute = require("./Routes/CropRoute");
const postRoute = require("./Routes/PostRoute");
const commentRoute = require("./Routes/CommentRoute");
const adminRoute = require("./Routes/AdminRoutes");
const plannerRoute = require("./Routes/PlannerRoute");

const { PORT } = process.env;


const app = express();

connectDB();
console.log();
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

app.use(cors({
  origin: ["http://localhost:5173"], // React frontend URL
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true
}));

app.use(cookieParser());

app.use(express.json());
//express.json(): The express.json() will add a body property to the request or req object. This includes the request body's parsed JSON data. req.body in your route handler function will allow you to access this data

// Serve static uploads
app.use("/uploads", express.static("uploads"));

// Move to top to avoid shadowing
app.use("/api/weather", require("./Routes/WeatherRoute"));

app.use("/", authRoute);
app.use("/", dataRoute);
app.use("/", cropRoute);
app.use("/", postRoute);
app.use("/", commentRoute);
app.use("/api/admin", adminRoute);
app.use("/api/season-planner", plannerRoute);
app.use("/api/yield", require("./Routes/YieldRoutes"));

app.use("/api/fertilizer", require("./Routes/FertilizerRoutes"));

app.use("/api/ml", require("./Routes/ML_Routes"));
app.use("/api/voice", require("./Routes/VoiceRoute"));