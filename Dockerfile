# Образ приложения PC Build: FastAPI-сервер + статические страницы сайта
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    DB_PATH=/app/data/pcbuild.db

WORKDIR /app

# Сначала зависимости – Docker кэширует этот слой, пока requirements.txt не менялся
COPY server/requirements.txt server/requirements.txt
RUN pip install --no-cache-dir -r server/requirements.txt

# Затем код сервера и страницы сайта
COPY server/main.py server/database.py server/
COPY web/ web/

# Запуск не от root + папка для базы данных
RUN useradd --create-home appuser \
    && mkdir -p /app/data \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD python -c "import os,urllib.request; urllib.request.urlopen('http://localhost:%s/api/health' % os.environ.get('PORT','8000'))"

# $PORT подставляет хостинг (Render и др.); локально используется 8000
CMD ["sh", "-c", "cd server && uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
