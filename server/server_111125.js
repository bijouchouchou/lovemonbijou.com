// ============================
// BIJOUX CHOUCHOU - SERVER.JS
// ============================

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname + "/../")); // Sert les fichiers du site

// --- Configuration ---
const GOOGLE_SHEETS_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQfhuvjofIeGugPL69XD_Lf9G3xCylG-fTaaqau8JFbH3n2px13z7XSxSiGrX6D2vlDpPptZe-oCTtk/pub?gid=452020768&single=true&output=csv";

const PORT = process.env.PORT || 4242;
const MODE = process.env.NODE_ENV || "development";

// --- Route d'accueil ---
app.get("/", (req, res) => {
  res.send("🌟 Bijoux ChouChou server actif !");
});

// --- Route proxy pour le CSV ---
app.get("/csv", async (req, res) => {
  try {
    console.log("📦 Requête de CSV reçue...");
    const response = await fetch(GOOGLE_SHEETS_CSV);
    const data = await response.text();
    res.set("Content-Type", "text/csv");
    res.send(data);
  } catch (error) {
    console.error("❌ Erreur de récupération du CSV:", error);
    res.status(500).send("Erreur serveur (CSV)");
  }
});

// --- Simulation Stripe / EmailJS (si besoin plus tard) ---
app.post("/order", (req, res) => {
  console.log("🛍️ Commande reçue:", req.body);
  res.json({ message: "Commande reçue avec succès" });
});

// --- Lancement du serveur ---
const server = app.listen(PORT, () => {
  console.log(`✅ Serveur Bijoux ChouChou démarré en mode ${MODE}`);
  console.log(`🌐 URL locale : http://localhost:${PORT}`);
  console.log("📁 Fichiers statiques servis depuis le dossier racine du projet");
});

// --- Gestion d’erreur de port déjà utilisé ---
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Le port ${PORT} est déjà utilisé. Essaie un autre :`);
    console.log(`👉 Exemple : $env:PORT=${PORT + 1}; npm start`);
  } else {
    console.error("Erreur serveur :", err);
  }
});
