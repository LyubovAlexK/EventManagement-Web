class EventsManager {
    constructor() {
        this.events = [];
        this.selectedEvent = null;
        this.socket = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.initWebSocket();
    }

    bindEvents() {
        // Навигация
        document.querySelectorAll('.sidebar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const panel = e.currentTarget.dataset.panel;
                if (panel) this.showPanel(panel);
            });
        });

        // Кнопки мероприятий
        document.getElementById('add-event-btn').addEventListener('click', () => this.showAddEventModal());
        document.getElementById('edit-event-btn').addEventListener('click', () => this.showEditBudgetModal());
        document.getElementById('refresh-btn').addEventListener('click', () => this.loadEvents());

        // Поиск
        document.getElementById('search-events').addEventListener('input', (e) => {
            this.filterEvents(e.target.value);
        });

        // Модальные окна
        document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });

        // Формы
        document.getElementById('event-form').addEventListener('submit', (e) => this.handleEventSubmit(e));
        document.getElementById('budget-form').addEventListener('submit', (e) => this.handleBudgetSubmit(e));

        // Сортировка таблицы
        document.querySelectorAll('#events-table th[data-sort]').forEach(th => {
            th.addEventListener('click', () => this.sortTable(th.dataset.sort));
        });

        // Выбор строки в таблице
        document.getElementById('events-tbody').addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            if (row) this.selectEvent(row);
        });
    }

    initWebSocket() {
        this.socket = io();
        
        this.socket.on('eventsUpdated', (data) => {
            this.showNotification('Данные обновлены');
            this.loadEvents();
        });
        
        this.socket.on('connect', () => {
            console.log('WebSocket connected');
        });
        
        this.socket.on('disconnect', () => {
            console.log('WebSocket disconnected');
        });
    }

    async loadEvents() {
        try {
            const response = await fetch('/api/events');
            this.events = await response.json();
            this.displayEvents();
            this.updateEditButton();
        } catch (error) {
            this.showNotification('Ошибка загрузки мероприятий', 'error');
        }
    }

    async fetchEvents() {
        const response = await fetch('/api/events');
        return await response.json();
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

    selectEvent(row) {
        // Снимаем выделение со всех строк
        document.querySelectorAll('#events-table tbody tr').forEach(r => {
            r.classList.remove('selected');
        });
        
        // Выделяем выбранную строку
        row.classList.add('selected');
        
        const eventId = parseInt(row.dataset.eventId);
        this.selectedEvent = this.events.find(e => e.EventId === eventId);
        this.updateEditButton();
    }

    updateEditButton() {
        const editBtn = document.getElementById('edit-event-btn');
        editBtn.disabled = !this.selectedEvent;
    }

    async showAddEventModal() {
        await this.loadModalData();
        document.getElementById('modal-title').textContent = 'Добавление мероприятия';
        document.getElementById('event-form').reset();
        document.getElementById('event-modal').classList.add('active');
    }

    async loadModalData() {
        try {
            // Загрузка категорий
            const categoriesResponse = await fetch('/api/categories');
            const categories = await categoriesResponse.json();
            this.fillSelect('CategoryId', categories, 'CategoryId', 'CategoryName');
            
            // Загрузка мест проведения
            const venuesResponse = await fetch('/api/venues');
            const venues = await venuesResponse.json();
            this.fillSelect('VenueId', venues, 'VenueId', 'VenueName');
            
            // Загрузка менеджеров
            const managersResponse = await fetch('/api/managers');
            const managers = await managersResponse.json();
            this.fillSelect('UserId', managers, 'UserId', 'DisplayName');
            
        } catch (error) {
            this.showNotification('Ошибка загрузки данных', 'error');
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
        
        // Валидация дат
        const startDate = new Date(eventData.DateTimeStart);
        const endDate = new Date(eventData.DateTimeFinish);
        
        if (startDate >= endDate) {
            this.showNotification('Дата окончания должна быть позже даты начала', 'error');
            return;
        }
        
        if (startDate < new Date()) {
            this.showNotification('Дата начала не может быть в прошлом', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Мероприятие успешно добавлено', 'success');
                this.closeModals();
                this.loadEvents();
            } else {
                this.showNotification('Ошибка при добавлении мероприятия', 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка подключения к серверу', 'error');
        }
    }

    showEditBudgetModal() {
        if (!this.selectedEvent) return;
        
        document.getElementById('actual-budget').value = this.selectedEvent.ActualBudget;
        document.getElementById('budget-modal').classList.add('active');
    }

    async handleBudgetSubmit(e) {
        e.preventDefault();
        
        if (!this.selectedEvent) return;
        
        const actualBudget = document.getElementById('actual-budget').value;
        
        try {
            const response = await fetch(`/api/events/${this.selectedEvent.EventId}/budget`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ActualBudget: parseFloat(actualBudget) })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Бюджет успешно обновлен', 'success');
                this.closeModals();
                this.loadEvents();
            } else {
                this.showNotification('Ошибка при обновлении бюджета', 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка подключения к серверу', 'error');
        }
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    showPanel(panelName) {
        // Обновляем активные кнопки
        document.querySelectorAll('.sidebar-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-panel="${panelName}"]`).classList.add('active');
        
        // Показываем соответствующую панель
        document.querySelectorAll('.content-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${panelName}-panel`).classList.add('active');
        
        // Обновляем заголовок
        const titles = {
            'events': 'Мероприятия',
            'profile': 'Личный кабинет'
        };
        document.getElementById('current-panel-title').textContent = titles[panelName];
        
        // Обновляем данные профиля при переходе
        if (panelName === 'profile') {
            authManager.loadUserEvents();
        }
    }

    filterEvents(searchTerm) {
        if (!searchTerm) {
            this.displayEvents();
            return;
        }
        
        const filtered = this.events.filter(event => 
            event.EventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.Description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.CategoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.VenueName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.Status.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        this.displayEvents(filtered);
    }

    sortTable(column) {
        this.events.sort((a, b) => {
            if (a[column] < b[column]) return -1;
            if (a[column] > b[column]) return 1;
            return 0;
        });
        
        this.displayEvents();
    }

    // Вспомогательные методы
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDateTime(dateTimeString) {
        if (!dateTimeString) return '';
        const date = new Date(dateTimeString);
        return date.toLocaleString('ru-RU');
    }

    formatCurrency(amount) {
        if (!amount) return '0 ₽';
        return new Intl.NumberFormat('ru-RU', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount) + ' ₽';
    }

    showNotification(message, type = 'info') {
        authManager.showMessage(message, type);
    }
}

const eventsManager = new EventsManager();