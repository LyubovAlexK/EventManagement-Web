// server/database.js - Только демо-режим
console.log('🚀 Database: Demo mode activated');

// Демо-функции для совместимости
async function connectDB() {
    console.log('✅ Demo database connected');
    return {
        request: () => ({
            query: async (sqlQuery) => { 
                console.log('📊 Demo query:', sqlQuery.substring(0, 100) + '...');
                return { recordset: getDemoData(sqlQuery) };
            }
        })
    };
}

async function query(sqlQuery) {
    console.log('📊 Executing demo query:', sqlQuery.substring(0, 100) + '...');
    return getDemoData(sqlQuery);
}

// Определяем какие данные возвращать в зависимости от запроса
function getDemoData(sqlQuery) {
    if (sqlQuery.includes('FROM Users') && sqlQuery.includes('Login')) {
        return getDemoUsers().filter(u => 
            sqlQuery.includes(`Login = '${u.Login}'`) || 
            u.Login === 'demo'
        );
    } else if (sqlQuery.includes('FROM Event')) {
        return getDemoEvents();
    } else if (sqlQuery.includes('FROM EventCategories')) {
        return getDemoCategories();
    } else if (sqlQuery.includes('FROM Venues')) {
        return getDemoVenues();
    } else if (sqlQuery.includes('FROM Users') && sqlQuery.includes('RoleId = 2')) {
        return getDemoManagers();
    } else if (sqlQuery.includes('FROM Users')) {
        return getDemoUsers();
    } else if (sqlQuery.includes('INSERT INTO') || sqlQuery.includes('UPDATE')) {
        console.log('✅ Demo: Data operation simulated');
        return [];
    }
    
    return getDemoEvents();
}

// Демо данные мероприятий
function getDemoEvents() {
    return [
        {
            EventId: 1,
            EventName: "Техническая конференция 2024",
            Description: "Ежегодная конференция для IT-специалистов с докладами и воркшопами",
            DateTimeStart: new Date('2024-12-10T09:00:00'),
            DateTimeFinish: new Date('2024-12-12T18:00:00'),
            CategoryName: "Конференция",
            VenueName: "Конференц-зал А",
            UserName: "Иванов Иван",
            Status: "Согласован",
            EstimatedBudget: 150000,
            ActualBudget: 145000,
            MaxNumOfGuests: 200,
            ClientsDisplay: "Петров А., Сидорова М., ООО 'ТехноПро'"
        },
        {
            EventId: 2,
            EventName: "Корпоративный тренинг",
            Description: "Тренинг по командообразованию и эффективной коммуникации для сотрудников",
            DateTimeStart: new Date('2024-12-15T09:00:00'),
            DateTimeFinish: new Date('2024-12-15T17:00:00'),
            CategoryName: "Тренинг", 
            VenueName: "Переговорная Б",
            UserName: "Петрова Анна",
            Status: "В обработке",
            EstimatedBudget: 50000,
            ActualBudget: 0,
            MaxNumOfGuests: 25,
            ClientsDisplay: "ООО 'ТехноПро'"
        },
        {
            EventId: 3,
            EventName: "Веб-приложение для управления мероприятиями",
            Description: "Демонстрация курсового проекта - система управления мероприятиями с реальным временем обновления данных",
            DateTimeStart: new Date('2024-12-01T10:00:00'),
            DateTimeFinish: new Date('2024-12-01T12:00:00'),
            CategoryName: "Презентация",
            VenueName: "Онлайн",
            UserName: "Кремлакова Любовь",
            Status: "Согласован",
            EstimatedBudget: 0,
            ActualBudget: 0,
            MaxNumOfGuests: 1,
            ClientsDisplay: "Курсовая работа"
        },
        {
            EventId: 4,
            EventName: "Новогодний корпоратив",
            Description: "Ежегодное новогоднее мероприятие для сотрудников компании",
            DateTimeStart: new Date('2024-12-28T19:00:00'),
            DateTimeFinish: new Date('2024-12-29T02:00:00'),
            CategoryName: "Корпоратив",
            VenueName: "Актовый зал",
            UserName: "Иванов Иван",
            Status: "Ждет утверждения",
            EstimatedBudget: 200000,
            ActualBudget: 0,
            MaxNumOfGuests: 150,
            ClientsDisplay: "ООО 'ТехноПро', ИП Сидоров"
        }
    ];
}

// Демо категории
function getDemoCategories() {
    return [
        { CategoryId: 1, CategoryName: "Конференция", Description: "Крупные мероприятия с докладами" },
        { CategoryId: 2, CategoryName: "Семинар", Description: "Обучающие мероприятия" },
        { CategoryId: 3, CategoryName: "Тренинг", Description: "Практические занятия" },
        { CategoryId: 4, CategoryName: "Корпоратив", Description: "Внутренние мероприятия компании" },
        { CategoryId: 5, CategoryName: "Презентация", Description: "Презентации продуктов и услуг" }
    ];
}

// Демо места проведения
function getDemoVenues() {
    return [
        { VenueId: 1, VenueName: "Конференц-зал А", Address: "ул. Главная, 1", Capacity: 200, Description: "Основной конференц-зал с современным оборудованием" },
        { VenueId: 2, VenueName: "Переговорная Б", Address: "ул. Главная, 1", Capacity: 25, Description: "Малая переговорная для совещаний" },
        { VenueId: 3, VenueName: "Актовый зал", Address: "ул. Центральная, 15", Capacity: 500, Description: "Большой актовый зал для масштабных мероприятий" },
        { VenueId: 4, VenueName: "Онлайн", Address: "Zoom/Teams", Capacity: 1000, Description: "Виртуальное мероприятие" },
        { VenueId: 5, VenueName: "Банкетный зал", Address: "ул. Праздничная, 10", Capacity: 100, Description: "Зал для торжественных мероприятий" }
    ];
}

// Демо пользователи
function getDemoUsers() {
    return [
        { 
            UserId: 1, 
            LastName: "Демо", 
            Name: "Пользователь", 
            MiddleName: "Тестовый", 
            Phone: "+7 (999) 000-00-00", 
            Specialty: "Менеджер мероприятий", 
            Login: "demo", 
            Password: "demo", 
            RoleId: 2, 
            RoleName: "Менеджер" 
        },
        { 
            UserId: 2, 
            LastName: "Иванов", 
            Name: "Иван", 
            MiddleName: "Иванович", 
            Phone: "+7 (999) 111-11-11", 
            Specialty: "Старший менеджер", 
            Login: "ivanov", 
            Password: "123", 
            RoleId: 2, 
            RoleName: "Менеджер" 
        },
        { 
            UserId: 3, 
            LastName: "Петрова", 
            Name: "Анна", 
            MiddleName: "Сергеевна", 
            Phone: "+7 (999) 222-22-22", 
            Specialty: "Менеджер мероприятий", 
            Login: "petrova", 
            Password: "123", 
            RoleId: 2, 
            RoleName: "Менеджер" 
        },
        { 
            UserId: 4, 
            LastName: "Кремлакова", 
            Name: "Любовь", 
            MiddleName: "Александровна", 
            Phone: "+7 (999) 333-33-33", 
            Specialty: "Разработчик системы", 
            Login: "kremlakova", 
            Password: "123", 
            RoleId: 2, 
            RoleName: "Менеджер" 
        }
    ];
}

function getDemoManagers() {
    return getDemoUsers().map(user => ({
        UserId: user.UserId,
        DisplayName: `${user.LastName} ${user.Name} ${user.MiddleName}`,
        Specialty: user.Specialty
    }));
}

module.exports = { 
    connectDB, 
    query,
    getDemoCategories: getDemoCategories,
    getDemoVenues: getDemoVenues,
    getDemoUsers: getDemoUsers
};