import os
import sys

if sys.platform == "win32":
    msys_path = r"C:\msys64\mingw64\bin"
    if os.path.isdir(msys_path):
        os.add_dll_directory(msys_path)
        os.environ["WEASYPRINT_DLL_DIRECTORIES"] = msys_path
        os.environ["PATH"] = msys_path + os.pathsep + os.environ["PATH"]

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.sessions import router as sessions_router

app = FastAPI(title="Agnitio API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions_router)
@app.get("/health")
def health():
    return {"status": "ok"}
