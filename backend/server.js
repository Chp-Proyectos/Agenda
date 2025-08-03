const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

// Configura el cliente OAuth2 con datos de .env
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Carga token con refresh token de .env
oAuth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN
});

const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

// Endpoint para agendar cita
app.post('/agendar', async (req, res) => {
  const { nombre, direccion, fecha, hora, minutos, duracion } = req.body;

  if (!nombre || !fecha || !hora || !minutos || !duracion) {
    return res.status(400).json({ message: 'Faltan datos obligatorios' });
  }

  const startDateTime = new Date(`${fecha}T${hora.padStart(2, '0')}:${minutos.padStart(2, '0')}:00`);
  const endDateTime = new Date(startDateTime.getTime() + duracion * 60 * 60 * 1000);

  const evento = {
    summary: `${nombre}${direccion ? ' - ' + direccion : ''}`,
    start: { dateTime: startDateTime.toISOString(), timeZone: 'America/Mexico_City' },
    end: { dateTime: endDateTime.toISOString(), timeZone: 'America/Mexico_City' },
  };

  try {
    await calendar.events.insert({
      calendarId: 'primary',
      resource: evento,
    });
    res.status(200).json({ message: 'Cita agendada exitosamente' });
  } catch (error) {
    console.error('Error al crear evento:', error);
    res.status(500).json({ message: 'Error al agendar la cita' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));
