const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = 3000; // Узгоджено з BASE_URL у твоїй методичці

// Налаштування для збереження завантажених фото
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Імітація бази даних (в пам'яті)
let inventory = [
    { id: '1', inventory_name: 'Зразок товару', description: 'Це тестовий опис', photo: '' }
];

// --- МАРШРУТИ ЗГІДНО З КОМІТАМИ ---

// 1. Отримати весь список (Коміт 4)
app.get('/inventory', (req, res) => {
    res.json(inventory);
});

// 2. Отримати один товар за ID (Коміт 6 та 11)
app.get('/inventory/:id', (req, res) => {
    const item = inventory.find(i => i.id === req.params.id);
    if (!item) return res.status(404).json({ message: 'Товар не знайдено' });
    res.json(item);
});

// 3. Створити новий товар (Коміт 5)
// Фронтенд шле POST на /register з FormData
app.post('/register', upload.single('photo'), (req, res) => {
    const { inventory_name, description } = req.body;

    if (!inventory_name) {
        return res.status(400).json({ message: "Назва обов'язкова" });
    }

    const newItem = {
        id: Date.now().toString(),
        inventory_name,
        description,
        photo: req.file ? `http://localhost:${PORT}/uploads/${req.file.filename}` : ''
    };

    inventory.push(newItem);
    res.status(201).json(newItem);
});

// 4. Оновити ТЕКСТОВІ дані (Коміт 7)
// Фронтенд шле PUT на /inventory/:id з JSON[cite: 2]
app.put('/inventory/:id', (req, res) => {
    const { id } = req.params;
    const index = inventory.findIndex(i => i.id === id);

    if (index === -1) return res.status(404).json({ message: 'Товар не знайдено' });

    inventory[index] = {
        ...inventory[index],
        inventory_name: req.body.inventory_name,
        description: req.body.description
    };

    res.json(inventory[index]);
});

// 5. Оновити ФОТО (Коміт 7)
// Фронтенд шле PUT на /inventory/:id/photo з FormData[cite: 2]
app.put('/inventory/:id/photo', upload.single('photo'), (req, res) => {
    const { id } = req.params;
    const index = inventory.findIndex(i => i.id === id);

    if (index === -1) return res.status(404).json({ message: 'Товар не знайдено' });
    if (!req.file) return res.status(400).json({ message: 'Фото не надано' });

    inventory[index].photo = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    res.json(inventory[index]);
});

// 6. Видалити товар (Коміт 8)
app.delete('/inventory/:id', (req, res) => {
    const { id } = req.params;
    inventory = inventory.filter(i => i.id !== id);
    res.json({ message: 'Видалено успішно' });
});

// 7. Отримати фото (Коміт 2/4)
// Функція getPhotoUrl у фронтенді очікує посилання на фото[cite: 2]
app.get('/inventory/:id/photo', (req, res) => {
    const item = inventory.find(i => i.id === req.params.id);
    if (!item || !item.photo) return res.status(404).send('Фото відсутнє');
    res.redirect(item.photo);
});

app.listen(PORT, () => {
    console.log(`Сервер працює на http://localhost:${PORT}`);
});