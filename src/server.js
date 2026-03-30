const express = require("express");
const path = require("path");
const routes = require("./routes");

const app = express();
const PORT = process.env.PORT || 8990;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.use("/api", routes);

app.listen(PORT, () => {
  console.log(`Kafka Message Producer running on http://localhost:${PORT}`);
});
