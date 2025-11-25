// Главный файл приложения - Режим реального времени
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Event Management System initialized');
    initApp();
});

// Глобальные переменные
let socket = null;

function initApp() {
    initWebSocket();
    initGlobalHandlers();
    checkConnectionStatus();
}

// Инициализация WebSocket соединения
function initWebSocket() {
    try {
        socket = io();
        
        socket.on('connect', () => {
            console.log('✅ Connected to server');
            updateConnectionStatus(true);
        });
        
        socket.on('disconnect', () => {
            console.log('❌ Disconnected from server');
            updateConnectionStatus(false);
        });
        
        socket.on('connect_error', (error) => {
            console.log('❌ Connection error:', error);
            updateConnectionStatus(false);
        });
        
        // Реальное время - обновление данных
        socket.on('eventsUpdated', (data) => {
            console.log('🔄 Real-time events update:', data);
            showRealtimeNotification('Данные мероприятий обновлены!');
            
            // Автоматически обновляем список мероприятий
            if (window.eventsManager) {
                eventsManager.loadEvents();
            }
        });
        
        socket.on('dataChanged', (data) => {
            console.log('📊 Data changed:', data);
            showRealtimeNotification(`Изменения в ${data.table}: ${data.action}`);
        });
        
        // Уведомления о приближающихся мероприятиях
        socket.on('eventReminder', (data) => {
            console.log('⏰ Event reminder:', data);
            showEventReminder(data);
        });
        
    } catch (error) {
        console.error('WebSocket initialization error:', error);
    }
}

// Показ уведомлений реального времени
function showRealtimeNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'realtime-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">🔄</span>
            <span class="notification-text">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Автоматическое скрытие через 5 секунд
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Уведомление о напоминании мероприятия
function showEventReminder(eventData) {
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
                <div>${eventData.eventName}</div>
                <small>Начинается: ${new Date(eventData.startTime).toLocaleString('ru-RU')}</small>
            </div>
            <button class="reminder-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    reminder.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 15px;
        border-radius: 8px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        animation: slideIn 0.3s ease-out;
        max-width: 350px;
    `;
    
    document.body.appendChild(reminder);
    
    setTimeout(() => {
        if (reminder.parentElement) {
            reminder.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => reminder.remove(), 300);
        }
    }, 10000);
}

// Обновление статуса подключения
function updateConnectionStatus(connected) {
    const statusElement = document.getElementById('connection-status');
    if (!statusElement) {
        // Создаем элемент статуса если его нет
        const statusDiv = document.createElement('div');
        statusDiv.id = 'connection-status';
        statusDiv.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            padding: 5px 10px;
            border-radius: 4px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            z-index: 1000;
        `;
        document.body.appendChild(statusDiv);
    }
    
    const element = document.getElementById('connection-status');
    if (connected) {
        element.textContent = '✅ Онлайн';
        element.style.background = '#10B981';
        element.style.color = 'white';
    } else {
        element.textContent = '❌ Офлайн';
        element.style.background = '#EF4444';
        element.style.color = 'white';
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
            if (window.eventsManager) {
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
            // Заменяем на текстовый плейсхолдер
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
    handleResize(); // Вызываем сразу при загрузке
}

// Обработка изменения размера окна
function handleResize() {
    const isMobile = window.innerWidth <= 768;
    document.body.classList.toggle('mobile-view', isMobile);
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

console.log('🎯 Event Management System ready for real-time updates!');