const mongoose = require("mongoose");
require("dotenv").config();
const colors = require("colors");

const app = require("./app");

app.use(
  cors({
    origin: "https://bistro-boss-0f21d5.netlify.app/", // Restrict to your frontend domain
    methods: ["POST", "GET"], // Limit allowed HTTP methods
  })
);

mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database connection is successful".red.bold);
  })
  .catch((err) => {
    console.error(`Database connection error: ${err.message}`.red.bold);
  });

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`App is running on port ${port}`.yellow.bold);
});
