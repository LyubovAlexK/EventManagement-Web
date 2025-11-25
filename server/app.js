const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const { connectDB, query, getDemoCategories, getDemoVenues, getDemoUsers } = require('./database');

const app = express();
const server = http.createServer(app);

// Настройка Socket.IO
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname + '/../public'));

// Middleware для логирования
app.use((req, res, next) => {
    console.log(`🕒 ${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);
    next();
});

// Подключение к демо-БД
connectDB().then(() => {
    console.log('🎯 Demo server started successfully');
    console.log('📊 Working in DEMO MODE with sample data');
});

// Socket.IO для реального времени
io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);
    
    socket.emit('connected', { 
        message: 'Connected to DEMO server',
        mode: 'demo',
        timestamp: new Date().toISOString()
    });

    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
    });
});

// Функция для оповещений
function notifyClients(event, data) {
    io.emit(event, {
        ...data,
        demo: true,
        timestamp: new Date().toISOString()
    });
}

// API Routes

// Статус сервера
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        mode: 'demo',
        serverTime: new Date().toISOString(),
        message: 'Working in DEMO MODE with sample data',
        version: '1.0.0'
    });
});

// Аутентификация (всегда успешна в демо-режиме)
app.post('/api/auth/login', async (req, res) => {
    const { login, password } = req.body;
    
    console.log(`🔐 Demo login: ${login}`);
    
    // В демо-режиме любой логин/пароль работает
    const demoUser = getDemoUsers().find(u => u.Login === 'demo') || getDemoUsers()[0];
    
    // Но ограничиваем доступ для Администраторов/Организаторов
    if (demoUser.RoleName === 'Администратор' || demoUser.RoleName === 'Организатор') {
        return res.status(403).json({
            success: false,
            message: 'Доступ ограничен в демо-режиме!'
        });
    }

    res.json({
        success: true,
        user: demoUser,
        demo: true,
        message: 'Демо-авторизация успешна'
    });
});

// Получение мероприятий
app.get('/api/events', async (req, res) => {
    try {
        const events = await query('SELECT * FROM Event ORDER BY DateTimeStart');
        res.json(events);
    } catch (error) {
        res.json(getDemoEvents());
    }
});

// Добавление мероприятия (демо-симуляция)
app.post('/api/events', async (req, res) => {
    const { EventName, Description } = req.body;
    
    console.log(`📝 Demo: Creating event "${EventName}"`);
    
    // Симулируем задержку как в реальной БД
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    notifyClients('eventsUpdated', { 
        action: 'added',
        eventName: EventName,
        message: 'Мероприятие добавлено (демо-режим)'
    });
    
    res.json({ 
        success: true, 
        message: 'Мероприятие успешно добавлено в демо-режиме',
        demo: true,
        eventId: Date.now()
    });
});

// Обновление бюджета (демо-симуляция)
app.put('/api/events/:id/budget', async (req, res) => {
    const { id } = req.params;
    const { ActualBudget } = req.body;
    
    console.log(`💰 Demo: Updating budget for event ${id} to ${ActualBudget}`);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    notifyClients('eventsUpdated', { 
        action: 'budget_updated', 
        eventId: id,
        newBudget: ActualBudget
    });
    
    res.json({ 
        success: true, 
        message: 'Бюджет обновлен в демо-режиме',
        demo: true
    });
});

// Получение категорий
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await query('SELECT * FROM EventCategories');
        res.json(categories);
    } catch (error) {
        res.json(getDemoCategories());
    }
});

// Получение мест проведения
app.get('/api/venues', async (req, res) => {
    try {
        const venues = await query('SELECT * FROM Venues');
        res.json(venues);
    } catch (error) {
        res.json(getDemoVenues());
    }
});

// Получение менеджеров
app.get('/api/managers', async (req, res) => {
    try {
        const managers = await query('SELECT UserId, DisplayName, Specialty FROM Managers');
        res.json(getDemoManagers());
    } catch (error) {
        res.json(getDemoManagers());
    }
});

// Получение пользователей
app.get('/api/users', async (req, res) => {
    try {
        const users = await query('SELECT * FROM Users');
        res.json(getDemoUsers());
    } catch (error) {
        res.json(getDemoUsers());
    }
});

// Демо-страница
app.get('/api/demo', (req, res) => {
    res.json({
        message: '🎯 Event Management System - DEMO MODE',
        features: [
            'Real-time updates',
            'Sample data', 
            'Full functionality',
            'No database required'
        ],
        credentials: [
            { login: 'demo', password: 'demo' },
            { login: 'ivanov', password: '123' },
            { login: 'petrova', password: '123' }
        ],
        data: {
            events: getDemoEvents().length,
            categories: getDemoCategories().length,
            venues: getDemoVenues().length,
            users: getDemoUsers().length
        }
    });
});

// Обработка 404
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        mode: 'demo',
        availableRoutes: [
            '/api/events',
            '/api/categories',
            '/api/venues', 
            '/api/managers',
            '/api/users',
            '/api/auth/login',
            '/api/status',
            '/api/demo'
        ]
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log('🎉 ==================================');
    console.log('🚀 Event Management System - DEMO MODE');
    console.log('📡 Server running on port:', PORT);
    console.log('🌐 Access:', `http://localhost:${PORT}`);
    console.log('🔑 Demo credentials:');
    console.log('   👤 Login: "demo"');
    console.log('   🔐 Password: "demo"');
    console.log('📊 Sample data loaded:', {
        events: getDemoEvents().length,
        categories: getDemoCategories().length, 
        venues: getDemoVenues().length,
        users: getDemoUsers().length
    });
    console.log('🎯 Real-time features: ACTIVE');
    console.log('==================================');
});

// Вспомогательная функция
function getDemoEvents() {
    // Импортируем из database.js
    const { getDemoData } = require('./database');
    return getDemoData('SELECT * FROM Event');
}

function getDemoManagers() {
    const { getDemoUsers } = require('./database');
    return getDemoUsers().map(user => ({
        UserId: user.UserId,
        DisplayName: `${user.LastName} ${user.Name} ${user.MiddleName}`,
        Specialty: user.Specialty
    }));
}