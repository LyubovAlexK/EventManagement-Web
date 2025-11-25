const sql = require('mssql');

const dbConfig = {
    server: 'DESKTOP-3HK6G3K\\SQLEXPRESS',
    database: 'PlanningHoldingEvents_Kremlakova', // используй настоящее имя БД
    options: {
        trustServerCertificate: true,
        trustedConnection: true // Windows Authentication
    }
};

let pool;

async function connectDB() {
    try {
        pool = await sql.connect(dbConfig);
        console.log('Connected to SQL Server');
        return pool;
    } catch (err) {
        console.error('Database connection failed:', err);
        console.log('Using mock data for demonstration');
        return createMockData();
    }
}

// Мок данные для демонстрации когда БД недоступна
async function createMockData() {
    return {
        request: () => ({
            query: async () => ({
                recordset: getMockEvents()
            })
        })
    };
}

function getMockEvents() {
    return [
        {
            EventId: 1,
            EventName: "Техническая конференция 2024",
            Description: "Ежегодная конференция для IT-специалистов",
            DateTimeStart: new Date('2024-12-10T10:00:00'),
            DateTimeFinish: new Date('2024-12-12T18:00:00'),
            CategoryName: "Конференция",
            VenueName: "Конференц-зал А",
            UserName: "Иванов Иван",
            Status: "Согласован",
            EstimatedBudget: 150000,
            ActualBudget: 145000,
            MaxNumOfGuests: 200,
            ClientsDisplay: "Петров А., Сидорова М."
        },
        {
            EventId: 2,
            EventName: "Корпоративный тренинг",
            Description: "Тренинг по командообразованию",
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
        }
    ];
}

async function query(sqlQuery) {
    try {
        const result = await pool.request().query(sqlQuery);
        return result.recordset;
    } catch (err) {
        console.error('Query error:', err);
        // Возвращаем мок данные при ошибке
        return getMockEvents();
    }
}

module.exports = { connectDB, query, sql };