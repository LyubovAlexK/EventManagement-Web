// public/js/app.js
// Главный файл приложения - Режим реального времени
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Event Management System initialized');
    initApp();
});

// Глобальные переменные
let socket = null;
let eventsManager = null; // Делаем глобальной, чтобы events.js мог к ней обращаться

function initApp() {
    initWebSocket();
    initGlobalHandlers();
    checkConnectionStatus();
    // Убираем автоматические уведомления
    // showWelcomeNotifications();

    // Инициализируем EventsManager
    eventsManager = new EventsManager();
}

// Инициализация WebSocket соединения
function initWebSocket() {
    try {
        socket = io();

        socket.on('connect', () => {
            console.log('✅ Connected to server');
            updateConnectionStatus(true);
            showRealtimeNotification('✅ Подключение к серверу установлено');
        });

        socket.on('disconnect', () => {
            console.log('❌ Disconnected from server');
            updateConnectionStatus(false);
            showRealtimeNotification('❌ Потеряно соединение с сервером');
        });

        socket.on('connect_error', (error) => {
            console.log('❌ Connection error:', error);
            updateConnectionStatus(false);
            showRealtimeNotification('❌ Ошибка подключения к серверу');
        });

        // Реальное время - обновление данных
        socket.on('eventsUpdated', (data) => {
            console.log('🔄 Real-time events update:', data);
            showRealtimeNotification('📊 Данные мероприятий обновлены!');

            // Автоматически обновляем список мероприятий
            if (eventsManager) {
                eventsManager.loadEvents();
            }
        });

        socket.on('dataChanged', (data) => {
            console.log('📊 Data changed:', data);
            showRealtimeNotification(`🔄 Изменения в ${data.table}: ${data.action}`);
        });

        // Уведомления о приближающихся мероприятиях
        socket.on('eventReminder', (data) => {
            console.log('⏰ Event reminder:', data);
            showEventReminder(data);
        });

    } catch (error) {
        console.error('WebSocket initialization error:', error);
        showRealtimeNotification('⚠️ Режим офлайн: демо-данные');
    }
}

// Показ приветственных уведомлений при загрузке
function showWelcomeNotifications() {

}

// Показ уведомлений реального времени
function showRealtimeNotification(message) {
    // Создаем контейнер для уведомлений если его нет
    let notificationsContainer = document.getElementById('notifications-container');
    if (!notificationsContainer) {
        notificationsContainer = document.createElement('div');
        notificationsContainer.id = 'notifications-container';
        notificationsContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 400px;
        `;
        document.body.appendChild(notificationsContainer);
    }

    const notification = document.createElement('div');
    notification.className = 'realtime-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-text">${message}</span>
            <button class="notification-close">×</button>
        </div>
    `;

    notification.style.cssText = `
        background: #10B981;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        animation: slideInRight 0.3s ease-out;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
    `;

    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        margin-left: 10px;
    `;

    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    });

    notificationsContainer.appendChild(notification);

    // Автоматическое скрытие через 5 секунд
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Уведомление о напоминании мероприятия
function showEventReminder(eventData) {
    let remindersContainer = document.getElementById('reminders-container');
    if (!remindersContainer) {
        remindersContainer = document.createElement('div');
        remindersContainer.id = 'reminders-container';
        remindersContainer.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 400px;
        `;
        document.body.appendChild(remindersContainer);
    }

    const reminder = document.createElement('div');
    reminder.className = 'event-reminder';

    let icon = '⏰';
    let bgColor = '#F59E0B';

    if (eventData.daysLeft === 1) {
        icon = '🚨';
        bgColor = '#EF4444';
    } else if (eventData.daysLeft === 2) {
        icon = '⚠️';
        bgColor = '#F59E0B';
    } else if (eventData.daysLeft === 3) {
        icon = '📅';
        bgColor = '#3B82F6';
    }

    reminder.innerHTML = `
        <div class="reminder-content">
            <span class="reminder-icon">${icon}</span>
            <div class="reminder-text">
                <strong>${eventData.message}</strong>
                <div style="margin: 5px 0; font-size: 13px;">${eventData.eventName}</div>
                <small>Начинается: ${new Date(eventData.startTime).toLocaleString('ru-RU')}</small>
            </div>
            <button class="reminder-close">×</button>
        </div>
    `;

    reminder.style.cssText = `
        background: ${bgColor};
        color: white;
        padding: 15px;
        border-radius: 8px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        animation: slideInLeft 0.3s ease-out;
        max-width: 350px;
    `;

    const closeBtn = reminder.querySelector('.reminder-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        margin-left: 10px;
    `;

    closeBtn.addEventListener('click', () => {
        reminder.style.animation = 'slideOutLeft 0.3s ease-in';
        setTimeout(() => reminder.remove(), 300);
    });

    remindersContainer.appendChild(reminder);

    // Автоматическое скрытие через 10 секунд
    setTimeout(() => {
        if (reminder.parentElement) {
            reminder.style.animation = 'slideOutLeft 0.3s ease-in';
            setTimeout(() => reminder.remove(), 300);
        }
    }, 10000);
}

// Обновление статуса подключения
function updateConnectionStatus(connected) {
    const statusElement = document.getElementById('connection-status');
    if (!statusElement) {
        const statusDiv = document.createElement('div');
        statusDiv.id = 'connection-status';
        statusDiv.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            padding: 8px 12px;
            border-radius: 6px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            z-index: 1000;
            background: ${connected ? '#10B981' : '#EF4444'};
            color: white;
            font-weight: 500;
        `;
        statusDiv.textContent = connected ? '✅ Онлайн' : '❌ Офлайн';
        document.body.appendChild(statusDiv);
    } else {
        statusElement.textContent = connected ? '✅ Онлайн' : '❌ Офлайн';
        statusElement.style.background = connected ? '#10B981' : '#EF4444';
    }
}

// Проверка статуса подключения
function checkConnectionStatus() {
    setInterval(() => {
        if (socket && socket.connected) {
            updateConnectionStatus(true);
        } else {
            updateConnectionStatus(false);
        }
    }, 5000);
}

// Глобальные обработчики
function initGlobalHandlers() {
    // Закрытие модальных окон по клику вне области
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            if (eventsManager) {
                eventsManager.closeModals();
            }
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
            e.target.alt = 'Изображение не загружено';
        }
    }, true);

    // Глобальная обработка ошибок
    window.addEventListener('error', (e) => {
        console.error('Global error:', e.error);
    });

    // Обработка обещаний без catch
    window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled promise rejection:', e.reason);
    });

    // Адаптация для мобильных устройств
    window.addEventListener('resize', handleResize);
    handleResize();
}

// Обработка изменения размера окна
function handleResize() {
    const isMobile = window.innerWidth <= 768;
    document.body.classList.toggle('mobile-view', isMobile);

    // Адаптируем позиции уведомлений для мобильных
    const notificationsContainer = document.getElementById('notifications-container');
    const remindersContainer = document.getElementById('reminders-container');

    if (isMobile) {
        if (notificationsContainer) {
            notificationsContainer.style.top = '10px';
            notificationsContainer.style.right = '10px';
            notificationsContainer.style.left = '10px';
            notificationsContainer.style.maxWidth = 'calc(100% - 20px)';
        }
        if (remindersContainer) {
            remindersContainer.style.top = '10px';
            remindersContainer.style.left = '10px';
            remindersContainer.style.right = '10px';
            remindersContainer.style.maxWidth = 'calc(100% - 20px)';
        }
    } else {
        if (notificationsContainer) {
            notificationsContainer.style.top = '20px';
            notificationsContainer.style.right = '20px';
            notificationsContainer.style.left = 'auto';
            notificationsContainer.style.maxWidth = '400px';
        }
        if (remindersContainer) {
            remindersContainer.style.top = '20px';
            remindersContainer.style.left = '20px';
            remindersContainer.style.right = 'auto';
            remindersContainer.style.maxWidth = '400px';
        }
    }
}

// Глобальные вспомогательные функции
function formatDate(dateString) {
    if (!dateString) return 'Не указана';
    try {
        return new Date(dateString).toLocaleDateString('ru-RU');
    } catch {
        return 'Неверная дата';
    }
}

function formatTime(dateString) {
    if (!dateString) return 'Не указано';
    try {
        return new Date(dateString).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return 'Неверное время';
    }
}

function formatDateTime(dateString) {
    if (!dateString) return 'Не указано';
    try {
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU');
    } catch {
        return 'Неверная дата/время';
    }
}

function formatCurrency(amount) {
    if (!amount && amount !== 0) return 'Не указан';
    try {
        return new Intl.NumberFormat('ru-RU', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount) + ' ₽';
    } catch {
        return 'Неверная сумма';
    }
}

// Функция для проверки подключения к API
async function checkApiHealth() {
    try {
        const response = await fetch('/api/events');
        return response.ok;
    } catch (error) {
        return false;
    }
}

// Периодическая проверка здоровья приложения
setInterval(async () => {
    const isHealthy = await checkApiHealth();
    if (!isHealthy) {
        console.warn('API health check failed');
    }
}, 30000);

// Добавляем CSS анимации
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    @keyframes slideInLeft {
        from {
            transform: translateX(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutLeft {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(-100%);
            opacity: 0;
        }
    }

    .notification-content,
    .reminder-content {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        width: 100%;
    }

    .reminder-text {
        flex: 1;
    }

    .reminder-text strong {
        display: block;
        margin-bottom: 5px;
        font-size: 13px;
    }

    .reminder-text small {
        opacity: 0.9;
        font-size: 11px;
    }

    /* Мобильные стили для уведомлений */
    @media (max-width: 768px) {
        #notifications-container,
        #reminders-container {
            top: 10px !important;
            left: 10px !important;
            right: 10px !important;
            max-width: calc(100% - 20px) !important;
        }

        .realtime-notification,
        .event-reminder {
            max-width: 100% !important;
            font-size: 12px !important;
            padding: 12px 15px !important;
        }
    }
`;
document.head.appendChild(style);

console.log('🎯 Event Management System ready for real-time updates!');