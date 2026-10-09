from pydantic import BaseModel
import os

class Settings(BaseModel):
    PROJECT_NAME: str = "VoxTrace"
    VERSION: str = "0.1.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Model and hardware configuration
    # Initial safe configuration for low-memory machine
    MODEL_NAME: str = os.getenv("VOXTRACE_MODEL", "tiny")
    DEVICE: str = os.getenv("VOXTRACE_DEVICE", "cpu")
    COMPUTE_TYPE: str = os.getenv("VOXTRACE_COMPUTE_TYPE", "int8")
    CPU_THREADS: int = int(os.getenv("VOXTRACE_CPU_THREADS", "4"))
    
    # Upload settings
    MAX_UPLOAD_SIZE_BYTES: int = 50 * 1024 * 1024  # 50 MB
    ALLOWED_EXTENSIONS: set[str] = {".wav", ".mp3", ".m4a", ".ogg", ".flac", ".aac"}

settings = Settings()
