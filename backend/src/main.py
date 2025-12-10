from dotenv import load_dotenv
import os
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()

from ai.services.ai_registry import shutdown_all_ai_clients
from core.middlewares.req_context_middleware import context_middleware

from auth.routes import auth_router
from admin.routes import admin_router
from user.routes import user_router
from tenant.routes import tenant_router
from book.routes import book_router
from page.routes import page_router
from translate.routes import translate_router
from astrology.routes import divination_router
from ocr.routes import ocr_router
from category.routes import category_router
from discover.routes import discover_router
from npc_chat.routes import npc_chat_router
from content.routes import edit_request_router
from pdf.routes import pdf_creator_router
from permission.routes import permission_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting Book Translation API...")
    yield

    # Shutdown
    print("Shutting down Book Translation API...")
    await shutdown_all_ai_clients()

app = FastAPI(
    title="Book Translation API",
    lifespan=lifespan
)

# MIDDLEWARES
app.middleware("http")(context_middleware)

origins = os.getenv("CORS_ORIGINS", "https://www.sourcelibrary.org").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type", "X-Tenant-Slug"],
)

# ROUTERS
app.include_router(book_router.router, prefix="/book", tags=["Books"])
app.include_router(page_router.router, prefix="/page", tags=["Pages"])
app.include_router(ocr_router.router, prefix="/ocr", tags=["OCR"])
app.include_router(translate_router.router, prefix="/translate", tags=["Translation"])
app.include_router(discover_router.router, prefix="/discover", tags=["Discover"])
app.include_router(auth_router.router, prefix="/auth", tags=["Authentication"])
app.include_router(user_router.router, prefix="/user", tags=["User"])
app.include_router(admin_router.router, prefix="/admin", tags=["Admin"])
app.include_router(tenant_router.router, prefix="/tenant", tags=["Tenant"])
app.include_router(edit_request_router.router, prefix="/requests", tags=["Requests"])
app.include_router(category_router.router, prefix="/category", tags=["Categories"])
app.include_router(divination_router.router, prefix="/astrology", tags=["Astrology Prediction"])
app.include_router(npc_chat_router.router, prefix="/chat", tags=["NPC Chat"])
app.include_router(pdf_creator_router.router, prefix="/pdf-create", tags=["PDF Creation"])
app.include_router(permission_router.router, prefix="/permissions", tags=["Permissions"])

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))
    workers = int(os.getenv("WORKERS", 1))
    reload = os.getenv("ENVIRONMENT", "production") == "development"
    uvicorn.run("main:app", host="0.0.0.0", port=port, workers=workers, reload=reload)