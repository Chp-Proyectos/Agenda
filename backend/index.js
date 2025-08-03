// index.js
const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: "https://chp-proyectos.github.io"
}));
app.use(bodyParser.json());

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET
);

oauth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN
});

const calendar = google.calendar({ version: "v3", auth: oauth2Client });

app.post("/api/agendar", async (req, res) => {
  const { nombre, direccion, fecha, hora, duracion } = req.body;

  const [h, m] = hora.split(":").map(Number);
  const start = new Date(`${fecha}T${hora}:00`);
  const end = new Date(start.getTime() + duracion * 60 * 60 * 1000);

  const evento = {
    summary: `${nombre}${direccion ? " - " + direccion : ""}`,
    start: { dateTime: start.toISOString(), timeZone: "America/Mexico_City" },
    end: { dateTime: end.toISOString(), timeZone: "America/Mexico_City" },
  };

  try {
    await calendar.events.insert({
      calendarId: process.env.CALENDAR_ID,
      requestBody: evento
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al crear el evento en Google Calendar", details: err.message });
  }
});

app.post("/api/cancelar", async (req, res) => {
  const { nombre, fecha } = req.body;
  try {
    const events = await calendar.events.list({
      calendarId: process.env.CALENDAR_ID,
      timeMin: new Date(`${fecha}T00:00:00`).toISOString(),
      timeMax: new Date(`${fecha}T23:59:59`).toISOString(),
      singleEvents: true,
      orderBy: "startTime"
    });

    const evento = events.data.items.find(ev => ev.summary.includes(nombre));
    if (!evento) return res.status(404).json({ error: "No se encontró una cita con ese nombre en esa fecha." });

    await calendar.events.delete({
      calendarId: process.env.CALENDAR_ID,
      eventId: evento.id
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al cancelar cita", details: err.message });
  }
});

app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
