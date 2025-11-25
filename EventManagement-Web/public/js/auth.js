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
        
        // Enter key support
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

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ login, password })
            });

            const result = await response.json();

            if (result.success) {
                this.currentUser = result.user;
                this.showApp();
                this.showMessage('Успешный вход!', 'success');
            } else {
                this.showMessage(result.message, 'error');
            }
        } catch (error) {
            this.showMessage('Ошибка подключения к серверу', 'error');
        }
    }

    logout() {
        this.currentUser = null;
        this.showAuth();
        this.showMessage('Вы вышли из системы', 'info');
    }

    checkAuthStatus() {
        // Проверка сохраненной сессии
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showApp();
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
        
        this.updateUserProfile();
        eventsManager.loadEvents();
    }

    updateUserProfile() {
        if (!this.currentUser) return;

        document.getElementById('user-fullname').textContent = 
            `${this.currentUser.LastName} ${this.currentUser.Name} ${this.currentUser.MiddleName}`;
        document.getElementById('user-specialty').textContent = this.currentUser.Specialty;
        document.getElementById('user-phone').textContent = this.currentUser.Phone;
        
        // Загрузка мероприятий пользователя
        this.loadUserEvents();
    }

    async loadUserEvents() {
        try {
            const events = await eventsManager.fetchEvents();
            const userEvents = events.filter(event => 
                event.UserName.includes(this.currentUser.LastName)
            );
            
            document.getElementById('user-events-count').textContent = userEvents.length;
            
            const eventsList = document.getElementById('user-events-list');
            eventsList.innerHTML = '';
            
            userEvents.forEach(event => {
                const li = document.createElement('li');
                li.textContent = event.EventName;
                eventsList.appendChild(li);
            });
        } catch (error) {
            console.error('Error loading user events:', error);
        }
    }

    showMessage(message, type = 'info') {
        // Создание уведомления
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-family: 'JetBrains Mono', monospace;
            z-index: 10000;
            max-width: 300px;
        `;
        
        if (type === 'error') {
            notification.style.background = '#EF4444';
        } else if (type === 'success') {
            notification.style.background = '#10B981';
        } else {
            notification.style.background = '#6B7280';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

const authManager = new AuthManager();