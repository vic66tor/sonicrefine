import os
import traceback
from datetime import datetime

from app.worker.celery_app import celery_app
from app.database import SyncSessionLocal
from app.models import Project
from app.worker.audio_pipeline import AudioPipeline


def update_project(project_id: str, **kwargs):
    """Helper to update project in sync context."""
    session = SyncSessionLocal()
    try:
        project = session.query(Project).filter(Project.id == project_id).first()
        if project:
            for key, value in kwargs.items():
                setattr(project, key, value)
            project.updated_at = datetime.utcnow()
            session.commit()
    finally:
        session.close()


@celery_app.task(bind=True, max_retries=2, default_retry_delay=30)
def process_audio(self, project_id: str, file_path: str):
    """
    Main audio processing task.
    Runs the full enhancement pipeline on the uploaded audio file.
    """
    pipeline = AudioPipeline()

    try:
        # Stage 1: Analyzing
        update_project(project_id, status="analyzing")

        analysis = pipeline.analyze(file_path)
        update_project(
            project_id,
            status="analyzing",
            analysis_data=analysis,
            duration_seconds=analysis.get("duration"),
            original_bitrate=analysis.get("bitrate"),
            sample_rate=analysis.get("sample_rate"),
            channels=analysis.get("channels"),
        )

        # Stage 2: Processing
        update_project(project_id, status="processing")

        # Get processing settings from project
        session = SyncSessionLocal()
        project = session.query(Project).filter(Project.id == project_id).first()
        settings = project.processing_settings or {}
        output_format = project.output_format or "mp3"
        session.close()

        output_path = pipeline.process(file_path, settings, output_format)

        # Stage 3: Upload to S3 (placeholder)
        # In production, upload output_path to S3 and get URL
        processed_url = output_path

        # Stage 4: Complete
        update_project(
            project_id,
            status="completed",
            processed_file_url=processed_url,
            completed_at=datetime.utcnow(),
        )

    except Exception as exc:
        update_project(
            project_id,
            status="failed",
            error_message=str(exc),
        )
        traceback.print_exc()
        raise self.retry(exc=exc)
