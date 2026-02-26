require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Conectado a MongoDB'))
    .catch(err => console.error('❌ Error conectando a MongoDB:', err));

const donacionSchema = new mongoose.Schema({
    transaccion: Object,
    donante: Object,
    certificado: Object
}, { timestamps: true });

const Donacion = mongoose.model('Donacion', donacionSchema);

app.post('/api/guardar-donacion', async (req, res) => {
    try {
        const nuevaDonacion = new Donacion(req.body);
        await nuevaDonacion.save();
        res.status(200).json({ mensaje: "Donación guardada en MongoDB" });
    } catch (error) {
        res.status(500).json({ error: "Error al guardar en la base de datos" });
    }
});

app.get('/api/donaciones', async (req, res) => {
    try {
        const donaciones = await Donacion.find().sort({ createdAt: -1 });
        res.status(200).json(donaciones);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener los datos" });
    }
});

app.listen(PORT, () => console.log(`🚀 API corriendo en http://localhost:${PORT}`));