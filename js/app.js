// Главный файл приложения - Демо-режим
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Event Management System initialized - Demo Mode');
    initApp();
});

// Глобальные переменные
let eventsManager = null;

function initApp() {
    initGlobalHandlers();
    
    // Инициализируем EventsManager
    eventsManager = new EventsManager();
}

// Глобальная функция для уведомлений
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
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
        font-family: 'JetBrains Mono', sans-serif;
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
        reminder.remove();
    });

    remindersContainer.appendChild(reminder);

    // Автоматическое скрытие через 10 секунд
    setTimeout(() => {
        if (reminder.parentElement) {
            reminder.remove();
        }
    }, 10000);
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

    // Адаптация для мобильных устройств
    window.addEventListener('resize', handleResize);
    handleResize();
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

console.log('🎯 Event Management System ready in demo mode!');