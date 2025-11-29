class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('login-btn').addEventListener('click', () => this.login());
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
        
        document.getElementById('password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
    }

    async login() {
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
            this.hideAuthCompletely();
        } else {
            this.showMessage('Неверный логин или пароль!', 'error');
        }
    }

    // Полностью скрываем блок авторизации
    hideAuthCompletely() {
        const authPage = document.getElementById('auth-page');
        if (authPage) {
            authPage.style.display = 'none';
        }
    }

    showAuthCompletely() {
        const authPage = document.getElementById('auth-page');
        if (authPage) {
            authPage.style.display = 'flex';
        }
    }

    logout() {
        this.currentUser = null;
        this.showAuth();
        this.showAuthCompletely();
        this.showMessage('Вы вышли из системы', 'info');
        this.clearAllNotifications();
    }

    clearAllNotifications() {
        const notifications = document.querySelectorAll('#notifications-container, #reminders-container, .realtime-notification, .event-reminder');
        notifications.forEach(notification => {
            notification.remove();
        });
    }

    checkAuthStatus() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            const user = JSON.parse(savedUser);
            this.currentUser = user;
            this.showApp();
            this.hideAuthCompletely();
        }
    }

    showAuth() {
        document.getElementById('auth-page').classList.add('active');
        document.getElementById('app-page').classList.remove('active');
        localStorage.removeItem('currentUser');
    }

    showApp() {
        document.getElementById('auth-page').classList.remove('active');
        document.getElementById('app-page').classList.add('active');
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        
        this.updateUI();
        eventsManager.loadEvents();
        this.showEventsPanel();
    }

    updateUI() {
        this.updateUserProfile();
        this.updateButtonText();
        this.checkUserRole();
    }

    showEventsPanel() {
        const eventsPanel = document.getElementById('events-panel');
        const eventsCardsPanel = document.getElementById('events-cards-panel');
        const profilePanel = document.getElementById('profile-panel');
        
        // Скрываем все панели
        if (eventsPanel) eventsPanel.classList.remove('active');
        if (eventsCardsPanel) eventsCardsPanel.classList.remove('active');
        if (profilePanel) profilePanel.classList.remove('active');
        
        // Показываем только панель мероприятий (таблицу)
        if (eventsPanel) eventsPanel.classList.add('active');
        
        // Обновляем заголовок
        const titleElement = document.getElementById('current-panel-title');
        if (titleElement) titleElement.textContent = 'Мероприятия (таблица)';
        
        // Активируем кнопку мероприятий в навигации
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const eventsBtn = document.querySelector('[data-panel="events"]');
        if (eventsBtn) eventsBtn.classList.add('active');
    }

    updateUserProfile() {
        if (!this.currentUser) return;

        const fullName = `${this.currentUser.LastName} ${this.currentUser.Name} ${this.currentUser.MiddleName || ''}`.trim();
        document.getElementById('user-fullname').textContent = fullName;
        document.getElementById('user-fullname-profile').textContent = fullName;
        document.getElementById('user-specialty').textContent = this.currentUser.Specialty || 'Менеджер';
        document.getElementById('user-phone').textContent = this.currentUser.Phone || 'Не указан';
        
        this.loadUserEvents();
    }

    updateButtonText() {
        // Обновляем текст кнопок
        const addBtn = document.getElementById('add-event-btn');
        const editBtn = document.getElementById('edit-event-btn');
        
        if (addBtn) {
            addBtn.innerHTML = '<span>Добавить мероприятие</span>';
        }
        
        if (editBtn) {
            editBtn.innerHTML = '<span>Редактировать</span>';
        }
    }

    checkUserRole() {
        // Скрываем/показываем элементы в зависимости от роли
        const isManager = this.currentUser && this.currentUser.RoleName === 'Менеджер';
        // Можно добавить дополнительную логику для разных ролей
    }

    async loadUserEvents() {
        try {
            const events = await eventsManager.fetchEvents();
            const userEvents = events.filter(event => 
                event.UserName.includes(this.currentUser.LastName) || 
                event.UserName.includes(this.currentUser.Name)
            );
            
            document.getElementById('user-events-count').textContent = userEvents.length;
            
            const eventsList = document.getElementById('user-events-list');
            eventsList.innerHTML = '';
            
            userEvents.slice(0, 5).forEach(event => {
                const li = document.createElement('li');
                li.textContent = `${event.EventName} (${event.Status})`;
                eventsList.appendChild(li);
            });
        } catch (error) {
            console.error('Error loading user events:', error);
            // В демо-режиме показываем тестовые данные
            document.getElementById('user-events-count').textContent = '2';
            const eventsList = document.getElementById('user-events-list');
            eventsList.innerHTML = `
                <li>Техническая конференция 2024 (Согласован)</li>
                <li>Корпоративный тренинг (В обработке)</li>
            `;
        }
    }

    showMessage(message, type = 'info') {
        showNotification(message, type);
    }
}

const authManager = new AuthManager();