class EventsManager {
    constructor() {
        this.events = [];
        this.categories = [];
        this.venues = [];
        this.selectedEvent = null;
        this.socket = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.initWebSocket();
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
        const mode = e.target.dataset.mode;
        
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
            } else {
                const eventId = e.target.dataset.eventId;
                response = await fetch(`/api/events/${eventId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(eventData)
                });
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification(`Мероприятие успешно ${mode === 'add' ? 'добавлено' : 'обновлено'}`, 'success');
                this.closeModals();
                this.loadEvents();
            } else {
                this.showNotification(`Ошибка при ${mode === 'add' ? 'добавлении' : 'обновлении'} мероприятия`, 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка подключения к серверу', 'error');
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

    // ... остальные методы остаются такими же ...

    formatDateTimeForInput(dateTimeString) {
        if (!dateTimeString) return '';
        const date = new Date(dateTimeString);
        return date.toISOString().slice(0, 16);
    }
}

const eventsManager = new EventsManager();