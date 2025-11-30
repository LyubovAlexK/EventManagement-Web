class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthStatus();
    }

    bindEvents() {
        document.getElementById('login-btn').addEventListener('click', () => this.login());
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
        
        document.getElementById('password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
    }

    login() {
        const login = document.getElementById('login').value;
        const password = document.getElementById('password').value;

        if (!login || !password) {
            this.showMessage('Заполните все поля!', 'error');
            return;
        }

        // Демо-режим аутентификации
        this.useDemoMode(login, password);
    }

    // Демо-режим аутентификации
    useDemoMode(login, password) {
        const demoUsers = [
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
            }
        ];

        const user = demoUsers.find(u => u.Login === login && u.Password === password);
        
        if (user) {
            this.currentUser = user;
            this.showApp();
            this.showMessage('Успешный вход в демо-режиме!', 'success');
        } else {
            this.showMessage('Неверный логин или пароль!', 'error');
        }
    }

    logout() {
        this.currentUser = null;
        this.showAuth();
        this.showMessage('Вы вышли из системы', 'info');
        this.clearAllNotifications();
        
        // Сбрасываем выбранное мероприятие
        if (window.eventsManager) {
            window.eventsManager.selectedEvent = null;
            window.eventsManager.updateEditButton();
        }
    }

    clearAllNotifications() {
        const notifications = document.querySelectorAll('.notification, .event-reminder, #reminders-container');
        notifications.forEach(notification => {
            notification.remove();
        });
    }

    checkAuthStatus() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                this.currentUser = user;
                this.showApp();
            } catch (e) {
                console.error('Error parsing saved user:', e);
                localStorage.removeItem('currentUser');
                this.showAuth();
            }
        }
    }

    showAuth() {
        document.getElementById('auth-page').classList.add('active');
        document.getElementById('app-page').classList.remove('active');
        localStorage.removeItem('currentUser');
        
        // Очищаем поля формы
        document.getElementById('login').value = 'demo';
        document.getElementById('password').value = 'demo';
    }

    showApp() {
        document.getElementById('auth-page').classList.remove('active');
        document.getElementById('app-page').classList.add('active');
        
        if (this.currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        }
        
        this.updateUI();
        
        // Загружаем мероприятия после инициализации eventsManager
        if (window.eventsManager) {
            window.eventsManager.loadEvents();
        }
        
        this.showEventsCardsPanel(); // Теперь по умолчанию открываем карточки
    }

    updateUI() {
        this.updateUserProfile();
        this.updateButtonText();
        this.checkUserRole();
    }

    // Теперь по умолчанию открываем панель с карточками
    showEventsCardsPanel() {
        const eventsPanel = document.getElementById('events-panel');
        const eventsCardsPanel = document.getElementById('events-cards-panel');
        const profilePanel = document.getElementById('profile-panel');
        
        // Скрываем все панели
        if (eventsPanel) eventsPanel.classList.remove('active');
        if (eventsCardsPanel) eventsCardsPanel.classList.remove('active');
        if (profilePanel) profilePanel.classList.remove('active');
        
        // Показываем только панель мероприятий (карточки)
        if (eventsCardsPanel) eventsCardsPanel.classList.add('active');
        
        // Обновляем заголовок
        const titleElement = document.getElementById('current-panel-title');
        if (titleElement) titleElement.textContent = 'Мероприятия';
        
        // Активируем кнопку карточек в навигации
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const eventsCardsBtn = document.querySelector('[data-panel="events-cards"]');
        if (eventsCardsBtn) eventsCardsBtn.classList.add('active');
    }

    updateUserProfile() {
        if (!this.currentUser) return;

        const fullName = `${this.currentUser.LastName} ${this.currentUser.Name} ${this.currentUser.MiddleName || ''}`.trim();
        
        // Обновляем имя пользователя в интерфейсе
        const userFullnameElement = document.getElementById('user-fullname');
        const userFullnameProfileElement = document.getElementById('user-fullname-profile');
        
        if (userFullnameElement) userFullnameElement.textContent = fullName;
        if (userFullnameProfileElement) userFullnameProfileElement.textContent = fullName;
        
        document.getElementById('user-specialty').textContent = this.currentUser.Specialty || 'Менеджер';
        document.getElementById('user-phone').textContent = this.currentUser.Phone || 'Не указан';
        
        this.loadUserEvents();
    }

    updateButtonText() {
        // Обновляем текст кнопок
        const addBtn = document.getElementById('add-event-btn');
        const editBtn = document.getElementById('edit-event-btn');
        
        if (addBtn) {
            addBtn.innerHTML = `
                <img src="img/plus.png" alt="Добавить" class="btn-icon">
                Добавить
            `;
        }
        
        if (editBtn) {
            editBtn.innerHTML = `
                <img src="img/editl.png" alt="Редактировать" class="btn-icon">
                Редактировать
            `;
        }
    }

    checkUserRole() {
        // Скрываем/показываем элементы в зависимости от роли
        const isManager = this.currentUser && this.currentUser.RoleName === 'Менеджер';
        // Можно добавить дополнительную логику для разных ролей
    }

    async loadUserEvents() {
        try {
            // В демо-режиме просто показываем тестовые данные
            document.getElementById('user-events-count').textContent = '2';
            const eventsList = document.getElementById('user-events-list');
            if (eventsList) {
                eventsList.innerHTML = `
                    <li>Техническая конференция 2024 (Согласован)</li>
                    <li>Корпоративный тренинг (В обработке)</li>
                `;
            }
        } catch (error) {
            console.error('Error loading user events:', error);
        }
    }

    showMessage(message, type = 'info') {
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            // Fallback если функция showNotification не доступна
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Создаем глобальный экземпляр AuthManager
const authManager = new AuthManager();