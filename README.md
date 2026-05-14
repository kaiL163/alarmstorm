# Запуск проекта

## Backend

```powershell
cd backend
python -m uvicorn main:app --reload
```

Backend будет доступен по адресу:

```text
http://127.0.0.1:8000
```

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend будет доступен по адресу:

```text
http://localhost:5173
```

## Основные API

```text
GET /api/alarms?date=YYYY-MM-DD
GET /api/analytics?date=YYYY-MM-DD
GET /api/archive
GET /api/monitor
```
