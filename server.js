const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

/* Sert index.html + assets */
app.use(express.static(__dirname));

/* Page d’accueil */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* 404 */
app.use((req, res) => {
  res.status(404).send("Page non trouvée");
});

app.listen(PORT, () => {
  console.log(`Serveur lancé : http://localhost:${PORT}`);
});
