// public/js/events.js
class EventsManager {
    constructor() {
        this.events = [];
        this.categories = [];
        this.venues = [];
        this.selectedEvent = null;
        this.socket = null; // Будет инициализирован в initWebSocket
        this.init();
    }

    init() {
        this.bindEvents();
        this.initWebSocket(); // Инициализация WebSocket
    }

    bindEvents() {
        document.querySelectorAll('.sidebar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const panel = e.currentTarget.dataset.panel;
                if (panel) this.showPanel(panel);
            });
        });

        document.getElementById('add-event-btn').addEventListener('click', () => this.showAddEventModal());
        document.getElementById('edit-event-btn').addEventListener('click', () => this.showEditEventModal());
        document.getElementById('refresh-btn').addEventListener('click', () => this.loadEvents());

        // Новый обработчик для кнопки "Проверка на скорые мероприятия"
        document.getElementById('check-events-btn').addEventListener('click', () => this.checkEventsBtnClick());

        document.getElementById('search-events').addEventListener('input', (e) => {
            this.filterEvents(e.target.value);
        });

        document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });

        document.getElementById('event-form').addEventListener('submit', (e) => this.handleEventSubmit(e));
        document.getElementById('budget-form').addEventListener('submit', (e) => this.handleBudgetSubmit(e));

        document.querySelectorAll('#events-table th[data-sort]').forEach(th => {
            th.addEventListener('click', () => this.sortTable(th.dataset.sort));
        });

        document.getElementById('events-tbody').addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            if (row) this.selectEvent(row);
        });
        this.bindRealTimeEvents();
    }

    // Новая функция для обработки нажатия кнопки "Проверка на скорые мероприятия"
    checkEventsBtnClick() {
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) {
            this.showNotification('⚠️ Для проверки мероприятий необходимо авторизоваться', 'info');
            return;
        }

        if (this.socket && this.socket.connected) {
            this.socket.emit('requestEventReminders');
            this.showNotification('🔍 Проверка мероприятий запущена...', 'info');
        } else {
            this.showNotification('❌ Нет подключения к серверу. Попробуйте позже.', 'error');
        }
    }

    bindRealTimeEvents() {
        // Обработчики для мгновенного обновления данных
        document.addEventListener('eventAdded', (e) => {
            this.loadEvents();
        });

        document.addEventListener('eventUpdated', (e) => {
            this.loadEvents();
        });
    }

    async loadEvents() {
        try {
            const response = await fetch('/api/events');
            this.events = await response.json();
            this.displayEvents();
            this.updateEditButton();
        } catch (error) {
            console.log('API недоступен, используем демо-данные');
            // Fallback на демо-данные
            this.useDemoData();
        }
    }

    useDemoData() {
        this.events = [
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
        this.displayEvents();
        this.updateEditButton();
        this.showNotification('Загружены демо-данные', 'info');
    }

    async fetchEvents() {
        try {
            const response = await fetch('/api/events');
            return await response.json();
        } catch (error) {
            console.log('API недоступен, возвращаем демо-данные');
            return this.events.length > 0 ? this.events : [
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
                    MaxNumOfGuests: 200
                }
            ];
        }
    }

    displayEvents(eventsToShow = null) {
        const events = eventsToShow || this.events;
        const tbody = document.getElementById('events-tbody');

        tbody.innerHTML = '';

        events.forEach(event => {
            const row = document.createElement('tr');
            row.dataset.eventId = event.EventId;

            if (this.selectedEvent && this.selectedEvent.EventId === event.EventId) {
                row.classList.add('selected');
            }

            row.innerHTML = `
                <td>${event.EventId}</td>
                <td>${this.escapeHtml(event.EventName)}</td>
                <td>${this.escapeHtml(event.Description)}</td>
                <td>${this.formatDateTime(event.DateTimeStart)}</td>
                <td>${this.formatDateTime(event.DateTimeFinish)}</td>
                <td>${this.escapeHtml(event.CategoryName)}</td>
                <td>${this.escapeHtml(event.VenueName)}</td>
                <td>${this.escapeHtml(event.Status)}</td>
                <td>${this.formatCurrency(event.EstimatedBudget)}</td>
                <td>${this.formatCurrency(event.ActualBudget)}</td>
                <td>${event.MaxNumOfGuests}</td>
            `;

            tbody.appendChild(row);
        });
    }

    async showAddEventModal() {
        await this.loadModalData();
        document.getElementById('modal-title').textContent = 'Добавление мероприятия';
        document.getElementById('event-form').reset();
        document.getElementById('event-form').dataset.mode = 'add';
        document.getElementById('event-modal').classList.add('active');
    }

    async showEditEventModal() {
        if (!this.selectedEvent) return;

        await this.loadModalData();
        document.getElementById('modal-title').textContent = 'Редактирование мероприятия';
        document.getElementById('event-form').dataset.mode = 'edit';
        document.getElementById('event-form').dataset.eventId = this.selectedEvent.EventId;

        // Заполняем форму данными выбранного мероприятия
        this.fillEventForm(this.selectedEvent);
        document.getElementById('event-modal').classList.add('active');
    }

    fillEventForm(event) {
        document.querySelector('[name="EventName"]').value = event.EventName || '';
        document.querySelector('[name="Description"]').value = event.Description || '';
        document.querySelector('[name="DateTimeStart"]').value = this.formatDateTimeForInput(event.DateTimeStart);
        document.querySelector('[name="DateTimeFinish"]').value = this.formatDateTimeForInput(event.DateTimeFinish);
        document.querySelector('[name="Status"]').value = event.Status || '';
        document.querySelector('[name="EstimatedBudget"]').value = event.EstimatedBudget || '';
        document.querySelector('[name="MaxNumOfGuests"]').value = event.MaxNumOfGuests || '';

        // Устанавливаем выбранные значения в select'ах
        setTimeout(() => {
            if (event.CategoryName) {
                const categorySelect = document.querySelector('[name="CategoryId"]');
                for (let option of categorySelect.options) {
                    if (option.text === event.CategoryName) {
                        categorySelect.value = option.value;
                        break;
                    }
                }
            }

            if (event.VenueName) {
                const venueSelect = document.querySelector('[name="VenueId"]');
                for (let option of venueSelect.options) {
                    if (option.text === event.VenueName) {
                        venueSelect.value = option.value;
                        break;
                    }
                }
            }
        }, 100);
    }

    async loadModalData() {
        try {
            // Загрузка категорий
            if (this.categories.length === 0) {
                const categoriesResponse = await fetch('/api/categories');
                this.categories = await categoriesResponse.json();
            }
            this.fillSelect('CategoryId', this.categories, 'CategoryId', 'CategoryName');

            // Загрузка мест проведения
            if (this.venues.length === 0) {
                const venuesResponse = await fetch('/api/venues');
                this.venues = await venuesResponse.json();
            }
            this.fillSelect('VenueId', this.venues, 'VenueId', 'VenueName');

        } catch (error) {
            console.log('API недоступен, используем демо-данные для форм');
            // Fallback на демо-данные
            this.categories = [
                { CategoryId: 1, CategoryName: "Конференция" },
                { CategoryId: 2, CategoryName: "Семинар" },
                { CategoryId: 3, CategoryName: "Тренинг" },
                { CategoryId: 4, CategoryName: "Корпоратив" },
                { CategoryId: 5, CategoryName: "Презентация" }
            ];
            this.venues = [
                { VenueId: 1, VenueName: "Конференц-зал А", Address: "ул. Главная, 1", Capacity: 200, Description: "Основной конференц-зал" },
                { VenueId: 2, VenueName: "Переговорная Б", Address: "ул. Главная, 1", Capacity: 25, Description: "Малая переговорная" },
                { VenueId: 3, VenueName: "Актовый зал", Address: "ул. Центральная, 15", Capacity: 500, Description: "Большой актовый зал" },
                { VenueId: 4, VenueName: "Онлайн", Address: "Zoom/Teams", Capacity: 1000, Description: "Виртуальное мероприятие" }
            ];

            this.fillSelect('CategoryId', this.categories, 'CategoryId', 'CategoryName');
            this.fillSelect('VenueId', this.venues, 'VenueId', 'VenueName');
        }
    }

    fillSelect(selectName, data, valueField, textField) {
        const select = document.querySelector(`[name="${selectName}"]`);
        select.innerHTML = '<option value="">Выберите...</option>';

        data.forEach(item => {
            const option = document.createElement('option');
            option.value = item[valueField];
            option.textContent = item[textField];
            select.appendChild(option);
        });
    }

    async handleEventSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const eventData = Object.fromEntries(formData.entries());
        const mode = e.target.dataset.mode;
        const eventId = e.target.dataset.eventId; // Получаем ID из атрибута формы

        // Валидация
        if (!this.validateEventForm(eventData)) {
            return;
        }

        try {
            let response;
            if (mode === 'add') {
                response = await fetch('/api/events', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(eventData)
                });

                // Создаем событие для реального времени
                document.dispatchEvent(new CustomEvent('eventAdded', {
                    detail: eventData
                }));
            } else { // mode === 'edit'
                response = await fetch(`/api/events/${eventId}`, { // Передаём ID в URL
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(eventData) // Отправляем только изменённые данные
                });

                // Создаем событие для реального времени
                document.dispatchEvent(new CustomEvent('eventUpdated', {
                    detail: { ...eventData, EventId: eventId }
                }));
            }

            const result = await response.json();

            if (result.success) {
                this.showNotification(`Мероприятие успешно ${mode === 'add' ? 'добавлено' : 'обновлено'}`, 'success');
                this.closeModals();
                this.loadEvents(); // Обновляем данные из API

                // Уведомляем через WebSocket ПОСЛЕ обновления интерфейса
                if (this.socket) {
                    this.socket.emit('eventChanged', {
                        action: mode === 'add' ? 'added' : 'updated',
                        event: eventData,
                        eventId: result.eventId || eventId // Возвращаем ID из ответа или из формы
                    });
                }
            } else {
                this.showNotification(`Ошибка при ${mode === 'add' ? 'добавлении' : 'обновлении'} мероприятия`, 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка подключения к серверу. Данные сохранены локально.', 'info');
            this.closeModals();
            this.loadEvents(); // Обновляем данные из API или демо-данных
        }
    }

    validateEventForm(data) {
        // Валидация дат
        const startDate = new Date(data.DateTimeStart);
        const endDate = new Date(data.DateTimeFinish);

        if (startDate >= endDate) {
            this.showNotification('Дата окончания должна быть позже даты начала', 'error');
            return false;
        }

        if (startDate < new Date()) {
            this.showNotification('Дата начала не может быть в прошлом', 'error');
            return false;
        }

        // Валидация числовых полей
        if (isNaN(data.EstimatedBudget) || data.EstimatedBudget <= 0) {
            this.showNotification('Предполагаемый бюджет должен быть положительным числом', 'error');
            return false;
        }

        if (isNaN(data.MaxNumOfGuests) || data.MaxNumOfGuests <= 0) {
            this.showNotification('Максимальное количество гостей должно быть положительным числом', 'error');
            return false;
        }

        return true;
    }

    // Вспомогательные методы
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDateTime(dateTimeString) {
        if (!dateTimeString) return 'Не указано';
        try {
            const date = new Date(dateTimeString);
            return date.toLocaleString('ru-RU');
        } catch {
            return 'Неверная дата/время';
        }
    }

    formatCurrency(amount) {
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

    formatDateTimeForInput(dateTimeString) {
        if (!dateTimeString) return '';
        const date = new Date(dateTimeString);
        return date.toISOString().slice(0, 16);
    }

    showPanel(panelName) {
        // Скрываем все панели
        document.querySelectorAll('.content-panel').forEach(panel => {
            panel.classList.remove('active');
        });

        // Показываем выбранную панель
        document.getElementById(`${panelName}-panel`).classList.add('active');

        // Обновляем заголовок
        const titles = {
            'events': 'Мероприятия',
            'profile': 'Личный кабинет'
        };
        document.getElementById('current-panel-title').textContent = titles[panelName] || 'Панель';

        // Обновляем активную кнопку в сайдбаре
        document.querySelectorAll('.sidebar-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-panel="${panelName}"]`).classList.add('active');
    }

    selectEvent(row) {
        // Убираем выделение со всех строк
        document.querySelectorAll('#events-table tr').forEach(tr => {
            tr.classList.remove('selected');
        });

        // Выделяем выбранную строку
        row.classList.add('selected');

        // Находим выбранное мероприятие
        const eventId = parseInt(row.dataset.eventId);
        this.selectedEvent = this.events.find(event => event.EventId === eventId);

        this.updateEditButton();
    }

    updateEditButton() {
        const editBtn = document.getElementById('edit-event-btn');
        editBtn.disabled = !this.selectedEvent;
    }

    filterEvents(searchTerm) {
        if (!searchTerm) {
            this.displayEvents();
            return;
        }

        const filteredEvents = this.events.filter(event =>
            event.EventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.Description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.CategoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.VenueName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.Status.toLowerCase().includes(searchTerm.toLowerCase())
        );

        this.displayEvents(filteredEvents);
    }

    sortTable(column) {
        this.events.sort((a, b) => {
            let aValue = a[column];
            let bValue = b[column];

            // Для числовых значений
            if (column.includes('Budget') || column.includes('Guests') || column.includes('Id')) {
                aValue = Number(aValue) || 0;
                bValue = Number(bValue) || 0;
                return aValue - bValue;
            }

            // Для дат
            if (column.includes('DateTime')) {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
                return aValue - bValue;
            }

            // Для строк
            return String(aValue).localeCompare(String(bValue));
        });

        this.displayEvents();
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    showNotification(message, type = 'info') {
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

    initWebSocket() {
        try {
            // Используем глобальный socket из app.js
            if (window.socket) {
                this.socket = window.socket;

                this.socket.on('eventsUpdated', (data) => {
                    // Проверяем авторизацию перед показом уведомлений
                    const currentUser = localStorage.getItem('currentUser');
                    if (currentUser) {
                        this.showNotification('Данные мероприятий обновлены!', 'info');
                        this.loadEvents(); // Обновляем данные при получении события
                    }
                });

                this.socket.on('eventReminder', (data) => {
                    // Проверяем авторизацию перед показом напоминаний
                    const currentUser = localStorage.getItem('currentUser');
                    if (currentUser) {
                        this.showNotification(`Напоминание: ${data.message}`, 'info');
                    }
                });
            } else {
                console.log('WebSocket недоступен (socket не определен в window), работаем в офлайн-режиме');
            }
        } catch (error) {
            console.log('WebSocket недоступен, работаем в офлайн-режиме');
        }
    }
}

// Инициализация происходит в app.js после DOMContentLoaded
// const eventsManager = new EventsManager(); // Убираем из events.js