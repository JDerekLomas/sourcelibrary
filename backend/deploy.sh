docker build -t book-translation-backend .
docker run --env-file .env -p 8080:8080 book-translation-backend

gcloud builds submit --tag asia-south1-docker.pkg.dev/resource-2024/book-translation-backend/book-translation-backend:latest
