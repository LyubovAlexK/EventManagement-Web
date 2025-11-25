const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const { connectDB, query } = require('./database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname + '/public'));

// Подключение к БД
connectDB().then(() => {
    console.log('API server started with database connection');
});

// WebSocket для реального времени
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Функция для оповещения всех клиентов об изменениях
function notifyClients(event, data) {
    io.emit(event, data);
}

// API Routes

// Аутентификация
app.post('/api/auth/login', async (req, res) => {
    try {
        const { login, password } = req.body;
        
        const user = await query(`
            SELECT u.*, r.RoleName 
            FROM Users u 
            INNER JOIN Role r ON u.RoleId = r.RoleId 
            WHERE u.Login = '${login}' AND u.Password = '${password}'
        `);
        
        if (user.length > 0) {
            res.json({
                success: true,
                user: user[0]
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Неверный логин или пароль'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера'
        });
    }
});

// Получение мероприятий
app.get('/api/events', async (req, res) => {
    try {
        const events = await query(`
            SELECT 
                e.EventId,
                e.EventName,
                e.Description,
                e.DateTimeStart,
                e.DateTimeFinish,
                ec.CategoryName,
                v.VenueName,
                u.LastName + ' ' + u.Name as UserName,
                e.Status,
                e.EstimatedBudget,
                e.ActualBudget,
                e.MaxNumOfGuests,
                STUFF((SELECT ', ' + c.LastName + ' ' + c.Name 
                      FROM Clients c 
                      WHERE c.EventId = e.EventId 
                      FOR XML PATH('')), 1, 2, '') as ClientsDisplay
            FROM Event e
            LEFT JOIN EventCategories ec ON e.CategoryId = ec.CategoryId
            LEFT JOIN Venues v ON e.VenueId = v.VenueId
            LEFT JOIN Users u ON e.UserId = u.UserId
            ORDER BY e.DateTimeStart
        `);
        
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Добавление мероприятия
app.post('/api/events', async (req, res) => {
    try {
        const {
            EventName, Description, DateTimeStart, DateTimeFinish,
            Status, EstimatedBudget, MaxNumOfGuests, CategoryId,
            VenueId, UserId
        } = req.body;
        
        await query(`
            INSERT INTO Event (
                EventName, Description, DateTimeStart, DateTimeFinish,
                Status, EstimatedBudget, ActualBudget, MaxNumOfGuests,
                CategoryId, VenueId, UserId
            ) VALUES (
                '${EventName}', '${Description}', '${DateTimeStart}', '${DateTimeFinish}',
                '${Status}', ${EstimatedBudget}, 0, ${MaxNumOfGuests},
                ${CategoryId}, ${VenueId}, ${UserId}
            )
        `);
        
        notifyClients('eventsUpdated', { action: 'added' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Обновление реального бюджета
app.put('/api/events/:id/budget', async (req, res) => {
    try {
        const { id } = req.params;
        const { ActualBudget } = req.body;
        
        await query(`
            UPDATE Event 
            SET ActualBudget = ${ActualBudget} 
            WHERE EventId = ${id}
        `);
        
        notifyClients('eventsUpdated', { action: 'updated', eventId: id });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получение категорий
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await query('SELECT * FROM EventCategories');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получение мест проведения
app.get('/api/venues', async (req, res) => {
    try {
        const venues = await query('SELECT * FROM Venues');
        res.json(venues);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получение менеджеров
app.get('/api/managers', async (req, res) => {
    try {
        const managers = await query(`
            SELECT UserId, LastName + ' ' + Name + ' ' + MiddleName as DisplayName, Specialty
            FROM Users WHERE RoleId = 2
        `);
        res.json(managers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});