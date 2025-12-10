FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Copy requirements file
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Modified to ensure recursive copy
COPY src /app/src

# Set PYTHONPATH to include src directory
ENV PYTHONPATH=/app/src

# Default port if not provided
ENV PORT=8080

# Run the FastAPI application from src directory
WORKDIR /app/src
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT}
