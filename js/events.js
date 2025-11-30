class EventsManager {
    constructor() {
        this.events = [];
        this.categories = [];
        this.venues = [];
        this.selectedEvent = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadEvents();
    }

    bindEvents() {
        // Обработчики для кнопок навигации в header
        document.querySelectorAll('.nav-btn').forEach(btn => {
            if (btn.dataset.panel) {
                btn.addEventListener('click', (e) => {
                    const panel = e.currentTarget.dataset.panel;
                    if (panel) this.showPanel(panel);
                });
            }
        });

        document.getElementById('add-event-btn').addEventListener('click', () => this.showAddEventModal());
        document.getElementById('edit-event-btn').addEventListener('click', () => this.showEditEventModal());
        document.getElementById('refresh-btn').addEventListener('click', () => this.loadEvents());

        // Обработчик для кнопки проверки мероприятий
        document.getElementById('check-events-btn').addEventListener('click', () => this.showDemoReminders());

        document.getElementById('search-events').addEventListener('input', (e) => {
            this.filterEvents(e.target.value);
        });

        document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });

        document.getElementById('event-form').addEventListener('submit', (e) => this.handleEventSubmit(e));

        document.querySelectorAll('#events-table th[data-sort]').forEach(th => {
            th.addEventListener('click', () => this.sortTable(th.dataset.sort));
        });

        // Обработчик для выделения строк в таблице
        document.getElementById('events-tbody').addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            if (row) {
                this.selectEvent(row);
                e.stopPropagation(); // Предотвращаем всплытие, чтобы не мешать другим обработчикам
            }
        });

        // Обработчик для снятия выделения при клике вне таблицы
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#events-table')) {
                this.clearSelection();
            }
        });
    }

    // Новая функция для показа демо-напоминаний
    showDemoReminders() {
        console.log('🔔 Showing demo event reminders');
        
        // Создаем тестовые данные для напоминаний
        const now = new Date();
        
        // Мероприятие через 3 дня
        const in3Days = new Date(now);
        in3Days.setDate(now.getDate() + 3);
        in3Days.setHours(14, 0, 0, 0);
        
        // Мероприятие через 1 день
        const in1Day = new Date(now);
        in1Day.setDate(now.getDate() + 1);
        in1Day.setHours(10, 0, 0, 0);

        // Тестовые напоминания
        const demoReminders = [
            {
                eventId: 101,
                eventName: "Техническая конференция 2024",
                startTime: in3Days.toISOString(),
                daysLeft: 3,
                message: '"Техническая конференция 2024" через 3 дня!'
            },
            {
                eventId: 102,
                eventName: "Презентация нового продукта", 
                startTime: in1Day.toISOString(),
                daysLeft: 1,
                message: '"Презентация нового продукта" начинается ЗАВТРА!'
            }
        ];

        // Показываем все напоминания
        demoReminders.forEach(reminder => {
            showEventReminder(reminder);
        });

        this.showNotification('🔔 Показаны тестовые напоминания о мероприятиях', 'info');
    }

    async loadEvents() {
        try {
            // В демо-режиме всегда используем демо-данные
            this.useDemoData();
        } catch (error) {
            console.log('Ошибка загрузки, используем демо-данные');
            this.useDemoData();
        }
    }

    useDemoData() {
        const now = new Date();
        
        // Мероприятие через 3 дня
        const in3Days = new Date(now);
        in3Days.setDate(now.getDate() + 3);
        in3Days.setHours(14, 0, 0, 0);
        
        // Мероприятие через 1 день
        const in1Day = new Date(now);
        in1Day.setDate(now.getDate() + 1);
        in1Day.setHours(10, 0, 0, 0);
        
        // Мероприятие через 5 дней
        const in5Days = new Date(now);
        in5Days.setDate(now.getDate() + 5);
        in5Days.setHours(18, 0, 0, 0);

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
                Description: "Демонстрация курсового проекта - система управления мероприятиями",
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
            },
            {
                EventId: 4,
                EventName: "Новогодний корпоратив",
                Description: "Ежегодное новогоднее мероприятие для сотрудников компании",
                DateTimeStart: new Date('2024-12-28T19:00:00'),
                DateTimeFinish: new Date('2024-12-29T02:00:00'),
                CategoryName: "Корпоратив",
                VenueName: "Актовый зал",
                UserName: "Иванов Иван",
                Status: "Ждет утверждения",
                EstimatedBudget: 200000,
                ActualBudget: 0,
                MaxNumOfGuests: 150,
                ClientsDisplay: "ООО 'ТехноПро', ИП Сидоров"
            },
            {
                EventId: 5,
                EventName: "Стратегическое планирование на 2025 год",
                Description: "Совещание по планированию бизнес-стратегии на следующий год",
                DateTimeStart: in3Days,
                DateTimeFinish: new Date(in3Days.getTime() + 4 * 60 * 60 * 1000),
                CategoryName: "Совещание",
                VenueName: "Переговорная Б",
                UserName: "Петрова Анна",
                Status: "Согласован",
                EstimatedBudget: 0,
                ActualBudget: 0,
                MaxNumOfGuests: 15,
                ClientsDisplay: "Внутреннее мероприятие"
            },
            {
                EventId: 6,
                EventName: "Презентация нового продукта",
                Description: "Анонс и демонстрация нового программного обеспечения",
                DateTimeStart: in1Day,
                DateTimeFinish: new Date(in1Day.getTime() + 3 * 60 * 60 * 1000),
                CategoryName: "Презентация",
                VenueName: "Конференц-зал А",
                UserName: "Иванов Иван",
                Status: "Согласован",
                EstimatedBudget: 75000,
                ActualBudget: 70000,
                MaxNumOfGuests: 100,
                ClientsDisplay: "Ключевые клиенты, партнеры"
            }
        ];
        this.displayEvents();
        this.displayEventsCards();
        this.updateEditButton();
        this.showNotification('Загружены демо-данные', 'info');
    }

    async fetchEvents() {
        return this.events;
    }

    displayEvents(eventsToShow = null) {
        const events = eventsToShow || this.events;
        const tbody = document.getElementById('events-tbody');

        tbody.innerHTML = '';

        events.forEach(event => {
            const row = document.createElement('tr');
            row.dataset.eventId = event.EventId;

            // Добавляем класс selected если это выбранное мероприятие
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

            // Добавляем обработчик для выделения строки
            row.addEventListener('click', (e) => {
                // Предотвращаем выделение при клике на ссылки или кнопки внутри строки
                if (e.target.tagName !== 'A' && e.target.tagName !== 'BUTTON') {
                    this.selectEvent(row);
                }
            });

            tbody.appendChild(row);
        });
    }

    // Новый метод для отображения карточек мероприятий
    displayEventsCards() {
        const container = document.getElementById('events-cards-container');
        if (!container) return;

        container.innerHTML = '';

        this.events.forEach(event => {
            const card = document.createElement('div');
            card.className = 'event-card';
            
            // Определяем цвет по статусу (сохраняем оригинальные цвета)
            let statusColor = '#F59E0B'; // В обработке
            if (event.Status === 'Согласован') statusColor = '#22C55E';
            if (event.Status === 'Ждет утверждения') statusColor = '#3B82F6';

            card.innerHTML = `
                <div class="event-card-header" style="background-color: ${statusColor}">
                    ${this.escapeHtml(event.EventName)}
                </div>
                <div class="event-card-content">
                    <h3 class="event-card-title">${this.escapeHtml(event.EventName)}</h3>
                    <p class="event-card-category">${this.escapeHtml(event.CategoryName)}</p>
                    <div class="event-card-status">${this.escapeHtml(event.Status)}</div>
                    <button class="event-card-btn" data-event-id="${event.EventId}">
                        <img src="img/events.png" alt="Посмотреть" class="btn-icon">
                        Посмотреть все мероприятия
                    </button>
                </div>
            `;

            // Добавляем обработчик для кнопки
            const button = card.querySelector('.event-card-btn');
            button.addEventListener('click', () => {
                this.showEventDetails(event);
            });

            container.appendChild(card);
        });
    }

    // Метод для показа деталей мероприятия
    showEventDetails(event) {
        this.showNotification(`Переход к мероприятию: ${event.EventName}`, 'info');
        this.showPanel('events');
        
        // Выделяем соответствующую строку в таблице
        setTimeout(() => {
            const row = document.querySelector(`#events-table tr[data-event-id="${event.EventId}"]`);
            if (row) {
                this.selectEvent(row);
                
                // Прокручиваем к выделенной строке
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    }

    async showAddEventModal() {
        await this.loadModalData();
        document.getElementById('modal-title').innerHTML = `
            <img src="img/events.png" alt="Мероприятие" class="section-icon">
            Добавление мероприятия
        `;
        document.getElementById('event-form').reset();
        document.getElementById('event-form').dataset.mode = 'add';
        document.getElementById('event-modal').classList.add('active');
    }

    async showEditEventModal() {
        if (!this.selectedEvent) {
            this.showNotification('Выберите мероприятие для редактирования', 'warning');
            return;
        }

        await this.loadModalData();
        document.getElementById('modal-title').innerHTML = `
            <img src="img/editl.png" alt="Редактирование" class="section-icon">
            Редактирование мероприятия
        `;
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
        // Демо-данные для категорий
        this.categories = [
            { CategoryId: 1, CategoryName: "Конференция" },
            { CategoryId: 2, CategoryName: "Семинар" },
            { CategoryId: 3, CategoryName: "Тренинг" },
            { CategoryId: 4, CategoryName: "Корпоратив" },
            { CategoryId: 5, CategoryName: "Презентация" },
            { CategoryId: 6, CategoryName: "Совещание" },
            { CategoryId: 7, CategoryName: "Мастер-класс" }
        ];
        
        // Демо-данные для мест проведения
        this.venues = [
            { VenueId: 1, VenueName: "Конференц-зал А" },
            { VenueId: 2, VenueName: "Переговорная Б" },
            { VenueId: 3, VenueName: "Актовый зал" },
            { VenueId: 4, VenueName: "Онлайн" },
            { VenueId: 5, VenueName: "Банкетный зал" }
        ];

        this.fillSelect('CategoryId', this.categories, 'CategoryId', 'CategoryName');
        this.fillSelect('VenueId', this.venues, 'VenueId', 'VenueName');
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

        // В демо-режиме просто показываем сообщение
        this.showNotification(`Мероприятие успешно ${mode === 'add' ? 'добавлено' : 'обновлено'} в демо-режиме`, 'success');
        this.closeModals();
        
        // Если добавление, обновляем список
        if (mode === 'add') {
            this.loadEvents();
        }
    }

    validateEventForm(data) {
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

        if (data.EstimatedBudget && (isNaN(data.EstimatedBudget) || data.EstimatedBudget <= 0)) {
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
        const targetPanel = document.getElementById(`${panelName}-panel`);
        if (targetPanel) {
            targetPanel.classList.add('active');
        }

        // Обновляем заголовок
        const titles = {
            'events': 'Таблица мероприятий',
            'events-cards': 'Мероприятия',
            'profile': 'Личный кабинет'
        };
        document.getElementById('current-panel-title').textContent = titles[panelName] || 'Панель';

        // Обновляем активную кнопку в навигации
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector(`[data-panel="${panelName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        // Если показываем карточки, обновляем их
        if (panelName === 'events-cards') {
            this.displayEventsCards();
        }
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
        
        // Показываем уведомление о выборе
        this.showNotification(`Выбрано мероприятие: ${this.selectedEvent.EventName}`, 'info');
    }

    clearSelection() {
        // Убираем выделение со всех строк
        document.querySelectorAll('#events-table tr').forEach(tr => {
            tr.classList.remove('selected');
        });

        this.selectedEvent = null;
        this.updateEditButton();
    }

    updateEditButton() {
        const editBtn = document.getElementById('edit-event-btn');
        if (editBtn) {
            editBtn.disabled = !this.selectedEvent;
            
            // Обновляем текст кнопки в зависимости от состояния
            if (this.selectedEvent) {
                editBtn.innerHTML = `
                    <img src="img/editl.png" alt="Редактировать" class="btn-icon">
                    Редактировать "${this.selectedEvent.EventName}"
                `;
            } else {
                editBtn.innerHTML = `
                    <img src="img/editl.png" alt="Редактировать" class="btn-icon">
                    Редактировать
                `;
            }
        }
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
        showNotification(message, type);
    }
}