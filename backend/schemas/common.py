from pydantic import BaseModel
from typing import Optional, Any, List

class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
    errors: Optional[List[str]] = None

class HealthCheck(BaseModel):
    status: str
    message: str
    version: str

class FileUploadResponse(BaseModel):
    success: bool
    message: str
    filename: str
    size: int
    content_type: str

class ProcessingStatus(BaseModel):
    status: str  # "processing", "completed", "failed"
    progress: int  # 0-100
    message: str
    results: Optional[Any] = None
    errors: Optional[List[str]] = None