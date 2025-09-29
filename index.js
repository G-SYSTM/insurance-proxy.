import express from "express";
import fetch from "node-fetch";

const app = express();

app.get("/", async (req, res) => {
  const target = req.query.url;
  if (!target) {
    return res.status(400).send("Falta parámetro ?url=");
  }

  try {
    const response = await fetch(target, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const body = await response.text();

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    // quitamos cabeceras que bloquean iframe
    res.removeHeader?.("X-Frame-Options");
    res.removeHeader?.("Content-Security-Policy");

    res.send(body);
  } catch (err) {
    res.status(500).send("Error al cargar la URL: " + err.message);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Proxy escuchando en puerto " + port));
