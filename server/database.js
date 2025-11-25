// server/database.js - Демонстрационная версия
let useMockData = true;

async function connectDB() {
    console.log('🚀 Demo mode: Using mock data');
    return {
        request: () => ({
            query: async (sqlQuery) => { 
                console.log('Demo query:', sqlQuery);
                
                // Определяем тип запроса и возвращаем соответствующие данные
                if (sqlQuery.includes('FROM Users') && sqlQuery.includes('Login')) {
                    return { recordset: getMockUsers().filter(u => u.Login === 'demo') };
                } else if (sqlQuery.includes('FROM Event')) {
                    return { recordset: getMockData() };
                } else if (sqlQuery.includes('FROM EventCategories')) {
                    return { recordset: getMockCategories() };
                } else if (sqlQuery.includes('FROM Venues')) {
                    return { recordset: getMockVenues() };
                } else if (sqlQuery.includes('FROM Users') && sqlQuery.includes('RoleId = 2')) {
                    return { recordset: getMockManagers() };
                } else if (sqlQuery.includes('FROM Users') && sqlQuery.includes('RoleName')) {
                    return { recordset: getMockUsers() };
                } else {
                    return { recordset: [] };
                }
            }
        })
    };
}

async function query(sqlQuery) {
    console.log('📊 Demo query executed:', sqlQuery.substring(0, 100) + '...');
    
    // Обрабатываем INSERT/UPDATE запросы для демо
    if (sqlQuery.includes('INSERT INTO') || sqlQuery.includes('UPDATE ')) {
        console.log('✅ Demo: Data operation simulated successfully');
        return [];
    }
    
    // Возвращаем данные в зависимости от запроса
    if (sqlQuery.includes('FROM Users') && sqlQuery.includes('Login')) {
        return getMockUsers().filter(u => u.Login === 'demo');
    } else if (sqlQuery.includes('FROM Event')) {
        return getMockData();
    } else if (sqlQuery.includes('FROM EventCategories')) {
        return getMockCategories();
    } else if (sqlQuery.includes('FROM Venues')) {
        return getMockVenues();
    } else if (sqlQuery.includes('FROM Users') && sqlQuery.includes('RoleId = 2')) {
        return getMockManagers();
    } else if (sqlQuery.includes('FROM Users') && sqlQuery.includes('RoleName')) {
        return getMockUsers();
    }
    
    return getMockData();
}

function getMockData() {
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
        }
    ];
}

function getMockCategories() {
    return [
        { CategoryId: 1, CategoryName: "Конференция" },
        { CategoryId: 2, CategoryName: "Семинар" },
        { CategoryId: 3, CategoryName: "Тренинг" },
        { CategoryId: 4, CategoryName: "Корпоратив" },
        { CategoryId: 5, CategoryName: "Презентация" }
    ];
}

function getMockVenues() {
    return [
        { VenueId: 1, VenueName: "Конференц-зал А", Address: "ул. Главная, 1", Capacity: 200, Description: "Основной конференц-зал" },
        { VenueId: 2, VenueName: "Переговорная Б", Address: "ул. Главная, 1", Capacity: 25, Description: "Малая переговорная" },
        { VenueId: 3, VenueName: "Актовый зал", Address: "ул. Центральная, 15", Capacity: 500, Description: "Большой актовый зал" },
        { VenueId: 4, VenueName: "Онлайн", Address: "Zoom/Teams", Capacity: 1000, Description: "Виртуальное мероприятие" }
    ];
}

function getMockUsers() {
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
        }
    ];
}

function getMockManagers() {
    return getMockUsers().map(user => ({
        UserId: user.UserId,
        DisplayName: `${user.LastName} ${user.Name} ${user.MiddleName}`,
        Specialty: user.Specialty
    }));
}

module.exports = { 
    connectDB, 
    query,
    getMockCategories,
    getMockVenues,
    getMockUsers
};