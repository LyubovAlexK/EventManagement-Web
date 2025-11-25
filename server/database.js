const sql = require('mssql');

// Настройки для базы данных
const dbConfig = {
    server: 'DESKTOP-3HK6G3K\\SQLEXPRESS',
    database: 'PlanningHoldingEvents_Kremlakova',
    options: {
        trustServerCertificate: true,
        trustedConnection: true // Windows Authentication
    }
};

let pool;
let useMockData = false;

async function connectDB() {
    try {
        pool = await sql.connect(dbConfig);
        console.log('✅ Connected to SQL Server');
        return pool;
    } catch (err) {
        console.log('❌ Database connection failed, using mock data');
        console.log('Error details:', err.message);
        useMockData = true;
        // Возвращаем объект с методом request для совместимости
        return {
            request: () => ({
                query: async () => ({ recordset: getMockData() })
            })
        };
    }
}

async function query(sqlQuery) {
    // Если используем мок данные
    if (useMockData) {
        console.log('Using mock data for query:', sqlQuery);
        return getMockData();
    }
    
    // Если pool не определен, возвращаем мок данные
    if (!pool) {
        console.log('Database pool not available, using mock data');
        return getMockData();
    }
    
    try {
        const result = await pool.request().query(sqlQuery);
        return result.recordset;
    } catch (err) {
        console.error('Query error, using mock data:', err.message);
        return getMockData();
    }
}

function getMockData() {
    // Возвращаем реалистичные тестовые данные
    return [
        {
            EventId: 1,
            EventName: "Веб-приложение для управления мероприятиями",
            Description: "Демонстрация курсового проекта - система управления мероприятиями с реальным временем обновления данных",
            DateTimeStart: new Date('2024-12-01T10:00:00'),
            DateTimeFinish: new Date('2024-12-01T12:00:00'),
            CategoryName: "Презентация",
            VenueName: "Онлайн",
            UserName: "Кремлакова Л.А.",
            Status: "Согласован",
            EstimatedBudget: 0,
            ActualBudget: 0,
            MaxNumOfGuests: 1,
            ClientsDisplay: "Курсовая работа"
        },
        {
            EventId: 2,
            EventName: "Техническая конференция 2024",
            Description: "Ежегодная конференция для IT-специалистов с докладами и воркшопами",
            DateTimeStart: new Date('2024-12-10T09:00:00'),
            DateTimeFinish: new Date('2024-12-12T18:00:00'),
            CategoryName: "Конференция",
            VenueName: "Конференц-зал А",
            UserName: "Иванов Иван",
            Status: "В обработке",
            EstimatedBudget: 150000,
            ActualBudget: 145000,
            MaxNumOfGuests: 200,
            ClientsDisplay: "Петров А., Сидорова М."
        },
        {
            EventId: 3,
            EventName: "Корпоративный тренинг",
            Description: "Тренинг по командообразованию и эффективной коммуникации",
            DateTimeStart: new Date('2024-12-15T09:00:00'),
            DateTimeFinish: new Date('2024-12-15T17:00:00'),
            CategoryName: "Тренинг", 
            VenueName: "Переговорная Б",
            UserName: "Петрова Анна",
            Status: "Ждет утверждения",
            EstimatedBudget: 50000,
            ActualBudget: 0,
            MaxNumOfGuests: 25,
            ClientsDisplay: "ООО 'ТехноПро'"
        }
    ];
}

// Мок данные для категорий
function getMockCategories() {
    return [
        { CategoryId: 1, CategoryName: "Конференция" },
        { CategoryId: 2, CategoryName: "Семинар" },
        { CategoryId: 3, CategoryName: "Тренинг" },
        { CategoryId: 4, CategoryName: "Корпоратив" },
        { CategoryId: 5, CategoryName: "Презентация" }
    ];
}

// Мок данные для мест проведения
function getMockVenues() {
    return [
        { VenueId: 1, VenueName: "Конференц-зал А", Address: "ул. Главная, 1", Capacity: 200, Description: "Основной конференц-зал" },
        { VenueId: 2, VenueName: "Переговорная Б", Address: "ул. Главная, 1", Capacity: 25, Description: "Малая переговорная" },
        { VenueId: 3, VenueName: "Актовый зал", Address: "ул. Центральная, 15", Capacity: 500, Description: "Большой актовый зал" },
        { VenueId: 4, VenueName: "Онлайн", Address: "Zoom/Teams", Capacity: 1000, Description: "Виртуальное мероприятие" }
    ];
}

// Мок данные для пользователей
function getMockUsers() {
    return [
        { UserId: 1, LastName: "Иванов", Name: "Иван", MiddleName: "Иванович", Phone: "+79990001111", Specialty: "Старший менеджер", Login: "ivanov", Password: "123", RoleId: 2, RoleName: "Менеджер" },
        { UserId: 2, LastName: "Петрова", Name: "Анна", MiddleName: "Сергеевна", Phone: "+79990002222", Specialty: "Менеджер мероприятий", Login: "petrova", Password: "123", RoleId: 2, RoleName: "Менеджер" },
        { UserId: 3, LastName: "Кремлакова", Name: "Любовь", MiddleName: "Александровна", Phone: "+79990003333", Specialty: "Разработчик", Login: "kremlakova", Password: "123", RoleId: 2, RoleName: "Менеджер" }
    ];
}

module.exports = { 
    connectDB, 
    query, 
    sql,
    getMockCategories,
    getMockVenues,
    getMockUsers
};