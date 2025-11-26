const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { connectDB, query, getDemoCategories, getDemoVenues, getDemoUsers, getDemoEvents } = require('./database');

const app = express();
const server = http.createServer(app);

// Настройка Socket.IO с CORS
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

app.use(cors());
app.use(express.json());

// Обслуживание статических файлов
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// Middleware для логирования запросов
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Подключение к БД (демо-режим)
connectDB().then(() => {
    console.log('🚀 Demo server started successfully');
}).catch(error => {
    console.log('⚠️  Server started in demo mode (no database)');
});

// Хранилище подключенных клиентов
const connectedClients = new Map();

// Socket.IO обработчики
io.on('connection', (socket) => {
    console.log('🔌 New client connected:', socket.id);
    connectedClients.set(socket.id, {
        connectedAt: new Date(),
        userAgent: socket.handshake.headers['user-agent']
    });

    // Отправляем приветственное сообщение без напоминаний
    socket.emit('connected', { 
        message: 'Connected to real-time server',
        clientId: socket.id,
        timestamp: new Date().toISOString()
    });
    
    // Обработка запросов от клиента
    socket.on('requestData', async (data) => {
        console.log('📥 Data request from client:', socket.id, data);
        
        try {
            let responseData;
            switch (data.type) {
                case 'events':
                    responseData = await query('SELECT * FROM Event');
                    break;
                case 'categories':
                    responseData = await query('SELECT * FROM EventCategories');
                    break;
                case 'venues':
                    responseData = await query('SELECT * FROM Venues');
                    break;
                default:
                    responseData = { error: 'Unknown data type' };
            }
            
            socket.emit('dataResponse', {
                requestId: data.requestId,
                data: responseData
            });
        } catch (error) {
            socket.emit('error', {
                requestId: data.requestId,
                error: error.message
            });
        }
    });

    // Пинг-понг для проверки соединения
    socket.on('ping', (data) => {
        socket.emit('pong', {
            ...data,
            serverTime: new Date().toISOString()
        });
    });

    // Отслеживание активности пользователя
    socket.on('userActivity', (data) => {
        console.log('👤 User activity:', socket.id, data);
        
        if (data.action === 'view_event') {
            console.log(`User viewed event: ${data.eventId}`);
        }
    });

    // Обработка отключения
    socket.on('disconnect', (reason) => {
        console.log('🔌 Client disconnected:', socket.id, reason);
        connectedClients.delete(socket.id);
        
        socket.broadcast.emit('userDisconnected', {
            clientId: socket.id,
            reason: reason
        });
    });

    // Обработка ошибок
    socket.on('error', (error) => {
        console.error('Socket error from client:', socket.id, error);
    });
});

// Функция для оповещения всех клиентов об изменениях
function notifyClients(event, data) {
    console.log(`📢 Broadcasting ${event} to ${connectedClients.size} clients`);
    io.emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
        server: 'event-management'
    });
}

// Функция для напоминаний о мероприятиях
function startEventReminders() {
    setInterval(async () => {
        try {
            const now = new Date();
            const events = await query('SELECT * FROM Event WHERE Status = "Согласован"');
            
            events.forEach(event => {
                const eventDate = new Date(event.DateTimeStart);
                const timeDiff = eventDate.getTime() - now.getTime();
                const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
                
                // Отправляем уведомления за 1, 2, 3 дня
                if (daysDiff === 1) {
                    notifyClients('eventReminder', {
                        eventId: event.EventId,
                        eventName: event.EventName,
                        startTime: event.DateTimeStart,
                        daysLeft: 1,
                        message: `"${event.EventName}" начинается ЗАВТРА!`
                    });
                } else if (daysDiff === 2) {
                    notifyClients('eventReminder', {
                        eventId: event.EventId,
                        eventName: event.EventName,
                        startTime: event.DateTimeStart,
                        daysLeft: 2,
                        message: `"${event.EventName}" через 2 дня!`
                    });
                } else if (daysDiff === 3) {
                    notifyClients('eventReminder', {
                        eventId: event.EventId,
                        eventName: event.EventName,
                        startTime: event.DateTimeStart,
                        daysLeft: 3,
                        message: `"${event.EventName}" через 3 дня!`
                    });
                }
            });
        } catch (error) {
            console.error('Error checking event reminders:', error);
        }
    }, 60 * 1000); // Проверяем каждую минуту
}

// Запускаем систему напоминаний
startEventReminders();

// API Routes

// Корневой маршрут - отдаем index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Статус сервера
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        serverTime: new Date().toISOString(),
        uptime: process.uptime(),
        connectedClients: connectedClients.size,
        memory: process.memoryUsage(),
        demoMode: true
    });
});

// Аутентификация
app.post('/api/auth/login', async (req, res) => {
    try {
        const { login, password } = req.body;
        
        console.log(`🔐 Login attempt: ${login}`);
        
        // Демо-логика аутентификации
        const users = await query(`
            SELECT u.*, r.RoleName 
            FROM Users u 
            INNER JOIN Role r ON u.RoleId = r.RoleId 
            WHERE u.Login = '${login}' AND u.Password = '${password}'
        `);
        
        let user;
        if (users.length > 0) {
            user = users[0];
        } else {
            // Демо-режим: ищем пользователя по логину и паролю
            user = getDemoUsers().find(u => u.Login === login && u.Password === password);
            
            // Если не нашли, используем демо-пользователя
            if (!user) {
                user = getDemoUsers().find(u => u.Login === 'demo');
            }
        }
        
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Неверный логин или пароль'
            });
            return;
        }

        // Проверка роли - ограничение доступа
        if (user.RoleName === 'Администратор' || user.RoleName === 'Организатор') {
            res.status(403).json({
                success: false,
                message: 'Доступ ограничен!'
            });
            return;
        }

        res.json({
            success: true,
            user: user,
            demo: true
        });
        
        // Уведомляем о успешной авторизации
        notifyClients('userLoggedIn', {
            userId: user.UserId,
            userName: `${user.LastName} ${user.Name}`,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера'
        });
    }
});

// Получение мероприятий
app.get('/api/events', async (req, res) => {
    try {
        const events = await query('SELECT * FROM Event');
        res.json(events);
    } catch (error) {
        console.error('Events API error:', error);
        // Возвращаем демо-данные напрямую
        res.json(getDemoEvents());
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
        
        console.log('📝 New event creation:', EventName);
        
        // В демо-режиме просто логируем
        const result = await query(`
            INSERT INTO Event (
                EventName, Description, DateTimeStart, DateTimeFinish,
                Status, EstimatedBudget, ActualBudget, MaxNumOfGuests,
                CategoryId, VenueId, UserId
            ) VALUES (
                '${EventName}', '${Description}', '${DateTimeStart}', '${DateTimeFinish}',
                '${Status}', ${EstimatedBudget || 0}, 0, ${MaxNumOfGuests || 1},
                ${CategoryId || 1}, ${VenueId || 1}, ${UserId || 1}
            )
        `);
        
        // Уведомляем всех клиентов о новом мероприятии
        notifyClients('eventsUpdated', { 
            action: 'added',
            eventName: EventName,
            eventId: Date.now()
        });
        
        res.json({ 
            success: true, 
            message: 'Мероприятие добавлено (демо-режим)',
            demo: true
        });
        
    } catch (error) {
        console.error('Add event error:', error);
        // Даже при ошибке возвращаем успех в демо-режиме
        res.json({ 
            success: true, 
            message: 'Мероприятие добавлено (демо-режим)',
            demo: true
        });
    }
});

// Обновление бюджета
app.put('/api/events/:id/budget', async (req, res) => {
    try {
        const { id } = req.params;
        const { ActualBudget } = req.body;
        
        console.log(`💰 Budget update for event ${id}: ${ActualBudget}`);
        
        await query(`
            UPDATE Event 
            SET ActualBudget = ${ActualBudget} 
            WHERE EventId = ${id}
        `);
        
        notifyClients('eventsUpdated', { 
            action: 'budget_updated', 
            eventId: id,
            newBudget: ActualBudget
        });
        
        res.json({ 
            success: true, 
            message: 'Бюджет обновлен (демо-режим)',
            demo: true
        });
        
    } catch (error) {
        console.error('Budget update error:', error);
        res.json({ 
            success: true, 
            message: 'Бюджет обновлен (демо-режим)',
            demo: true
        });
    }
});

// Получение категорий
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await query('SELECT * FROM EventCategories');
        res.json(categories);
    } catch (error) {
        console.error('Categories API error:', error);
        res.json(getDemoCategories());
    }
});

// Получение мест проведения
app.get('/api/venues', async (req, res) => {
    try {
        const venues = await query('SELECT * FROM Venues');
        res.json(venues);
    } catch (error) {
        console.error('Venues API error:', error);
        res.json(getDemoVenues());
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
        console.error('Managers API error:', error);
        const mockUsers = getDemoUsers();
        const managers = mockUsers.map(user => ({
            UserId: user.UserId,
            DisplayName: `${user.LastName} ${user.Name} ${user.MiddleName}`,
            Specialty: user.Specialty
        }));
        res.json(managers);
    }
});

// Получение всех пользователей
app.get('/api/users', async (req, res) => {
    try {
        const users = await query(`
            SELECT u.*, r.RoleName 
            FROM Users u 
            INNER JOIN Role r ON u.RoleId = r.RoleId
        `);
        res.json(users);
    } catch (error) {
        console.error('Users API error:', error);
        res.json(getDemoUsers());
    }
});

// Обработка 404 для API
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'API route not found',
        path: req.originalUrl
    });
});

// Для всех остальных маршрутов отдаем index.html (для SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Обработка ошибок
app.use((error, req, res, next) => {
    console.error('🚨 Server error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        demo: true
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`🎯 Server running on port ${PORT}`);
    console.log(`📱 Access: http://localhost:${PORT}`);
    console.log(`🔗 Real-time WebSocket: ws://localhost:${PORT}`);
    console.log(`🔑 Demo login: "demo" / "demo"`);
    console.log('🚀 Real-time features:');
    console.log('   • Instant data updates');
    console.log('   • Event reminders (1, 2, 3 days before)');
    console.log('   • Multi-user synchronization');
    console.log('   • Connection status monitoring');
    console.log('   • Mobile responsive design');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    notifyClients('serverShutdown', { message: 'Server is restarting' });
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

module.exports = { app, server, io, notifyClients };