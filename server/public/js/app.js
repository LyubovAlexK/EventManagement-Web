// Главный файл приложения
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация менеджеров уже происходит в их классах
    
    // Дополнительная инициализация
    initApp();
});

function initApp() {
    // Проверка подключения к базе данных
    checkDatabaseConnection();
    
    // Инициализация обработчиков
    initGlobalHandlers();
}

function checkDatabaseConnection() {
    // Можно добавить периодическую проверку подключения
    setInterval(async () => {
        try {
            await fetch('/api/events');
            // Если запрос успешен, подключение активно
        } catch (error) {
            authManager.showMessage('Потеряно подключение к серверу', 'error');
        }
    }, 30000); // Проверка каждые 30 секунд
}

function initGlobalHandlers() {
    // Закрытие модальных окон по клику вне области
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            eventsManager.closeModals();
        }
    });
    
    // Предотвращение закрытия при клике внутри модального окна
    document.querySelectorAll('.modal-content').forEach(content => {
        content.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });
    
    // Обработка ошибок загрузки изображений
    document.addEventListener('error', (e) => {
        if (e.target.tagName === 'IMG') {
            console.warn('Image failed to load:', e.target.src);
            // Можно установить placeholder изображение
            e.target.style.display = 'none';
        }
    }, true);
}

// Глобальные вспомогательные функции
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('ru-RU');
}

function formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });
}