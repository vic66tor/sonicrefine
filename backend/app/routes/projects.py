import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import User, Project
from app.schemas import CreateProjectRequest
from app.auth import get_current_user
from app.config import settings

router = APIRouter()


@router.get("/")
async def list_projects(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project)
        .where(Project.user_id == user.id)
        .order_by(Project.created_at.desc())
    )
    projects = result.scalars().all()
    return {"projects": [_serialize(p) for p in projects]}


@router.post("/")
async def create_project(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Validate file
    if not file.filename or not file.filename.lower().endswith(".mp3"):
        raise HTTPException(status_code=400, detail="Only MP3 files are supported")

    # Save file temporarily
    upload_dir = "/tmp/uploads"
    os.makedirs(upload_dir, exist_ok=True)

    import uuid
    file_id = str(uuid.uuid4())
    file_path = os.path.join(upload_dir, f"{file_id}.mp3")

    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large")

    with open(file_path, "wb") as f:
        f.write(content)

    # Create project
    project = Project(
        user_id=user.id,
        title=file.filename.replace(".mp3", ""),
        original_filename=file.filename,
        original_file_url=file_path,
        status="pending",
    )
    db.add(project)
    await db.flush()

    # Dispatch celery task
    from app.worker.tasks import process_audio
    process_audio.delay(str(project.id), file_path)

    return {"project": _serialize(project)}


@router.get("/{project_id}")
async def get_project(
    project_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project).where(
            Project.id == project_id, Project.user_id == user.id
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"project": _serialize(project)}


@router.get("/{project_id}/download")
async def download_project(
    project_id: str,
    format: str = "mp3",
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project).where(
            Project.id == project_id, Project.user_id == user.id
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.status != "completed":
        raise HTTPException(status_code=400, detail="Processing not completed")

    # In production: generate pre-signed S3 URL or stream file
    return {
        "download_url": project.processed_file_url,
        "format": format,
        "filename": f"{project.title}_enhanced.{format}",
    }


def _serialize(project: Project) -> dict:
    return {
        "id": str(project.id),
        "title": project.title,
        "original_filename": project.original_filename,
        "status": project.status,
        "output_format": project.output_format,
        "analysis_data": project.analysis_data,
        "processing_settings": project.processing_settings,
        "duration_seconds": project.duration_seconds,
        "original_bitrate": project.original_bitrate,
        "sample_rate": project.sample_rate,
        "channels": project.channels,
        "error_message": project.error_message,
        "completed_at": str(project.completed_at) if project.completed_at else None,
        "created_at": str(project.created_at),
        "updated_at": str(project.updated_at),
    }
