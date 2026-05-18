# AlarmStorm Triage

SCADA-система мониторинга и анализа аварий. Генерирует симуляцию alarm-событий для промышленных зон (компрессорные, котельные, насосные, теплообменники) и предоставляет веб-интерфейс для визуализации, аналитики и расследования инцидентов.

## Стек

| Слой | Технологии |
|------|-----------|
| Backend | Python 3.10+, FastAPI, Uvicorn, Pandas, NumPy |
| Frontend | React 19, Vite, Tailwind CSS 4, Recharts, Lucide Icons, React Router 7 |

## Требования

- **Python** 3.10 или выше ([python.org](https://www.python.org/downloads/))
- **Node.js** 18 или выше ([nodejs.org](https://nodejs.org/))
- **Git** ([git-scm.com](https://git-scm.com/))

После установки **перезагрузите компьютер**, чтобы `python` и `node` были доступны в PATH.

## Быстрый старт

### 1. Клонировать репозиторий

```bash
git clone <url-репозитория>
cd scada
```

### 2. Запустить backend

```bash
cd backend

# Создать виртуальное окружение (один раз)
python -m venv venv

# Активировать виртуальное окружение
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Windows CMD:
venv\Scripts\activate.bat
# Git Bash / WSL:
source venv/bin/activate

# Установить зависимости (один раз)
pip install -r requirements.txt

# Запустить сервер
python -m uvicorn main:app --reload
```

Backend стартует на **http://127.0.0.1:8000**

### 3. Запустить frontend (в отдельном терминале)

```bash
cd frontend

# Установить зависимости (один раз)
npm install

# Запустить dev-сервер
npm run dev
```

Frontend стартует на **http://localhost:5173**

## Запуск бэка и фронта одновременно

Откройте **два терминала** и запустите каждый сервис в своём:

**Терминал 1 — Backend:**
```bash
cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload
```

**Терминал 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Откройте в браузере: **http://localhost:5173**

## Доступные страницы

| Маршрут | Описание |
|---------|----------|
| `/` | Дашборд — общая сводка по системе |
| `/alarms` | Таблица аварий за выбранный день |
| `/analytics` | Аналитика — кластеры, интенсивность, bad actor |
| `/monitor` | Мониторинг в реальном времени — KPI, тренды, оборудование |
| `/archive` | Архив с фильтрами и пагинацией |
| `/settings` | Настройки |

## API

| Эндпоинт | Описание |
|-----------|----------|
| `GET /api/alarms?date=YYYY-MM-DD` | Аварии за день |
| `GET /api/analytics` | Аналитика по всем дням |
| `GET /api/analytics?date=YYYY-MM-DD` | Детальная аналитика за день |
| `GET /api/monitor?date=YYYY-MM-DD` | Данные мониторинга (KPI, тренды) |
| `GET /api/archive?day=...&zone=...&priority=...&limit=...&offset=...` | Архив с фильтрами |

Интерактивная документация Swagger: **http://127.0.0.1:8000/docs**

## Структура проекта

```
scada/
├── backend/
│   ├── main.py              # FastAPI-сервер, генерация данных, API
│   └── requirements.txt     # Python-зависимости
├── frontend/
│   ├── src/
│   │   ├── components/      # UI-компоненты (Sidebar, Topbar, карточки)
│   │   ├── context/         # AlarmDataContext — общее состояние
│   │   ├── pages/           # Страницы (Dashboard, Alarms, Analytics, ...)
│   │   ├── App.jsx          # Маршрутизация
│   │   ├── main.jsx         # Точка входа
│   │   └── index.css        # Глобальные стили
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── .gitignore
└── README.md
```
