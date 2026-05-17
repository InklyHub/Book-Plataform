from io import BytesIO

from minio import Minio
from minio.error import S3Error

from app.core.config import settings


def _client() -> Minio:
    return Minio(
        settings.STORAGE_ENDPOINT,
        access_key=settings.STORAGE_ACCESS_KEY,
        secret_key=settings.STORAGE_SECRET_KEY,
        secure=settings.STORAGE_USE_SSL,
    )


def upload_cover(book_id: str, data: bytes, content_type: str) -> str:
    ext = content_type.split("/")[-1].replace("jpeg", "jpg")
    object_name = f"{book_id}.{ext}"

    client = _client()
    try:
        client.put_object(
            settings.STORAGE_BUCKET_COVERS,
            object_name,
            BytesIO(data),
            length=len(data),
            content_type=content_type,
        )
    except S3Error as e:
        raise RuntimeError(f"Error subiendo portada a MinIO: {e}") from e

    scheme = "https" if settings.STORAGE_USE_SSL else "http"
    return f"{scheme}://{settings.STORAGE_ENDPOINT}/{settings.STORAGE_BUCKET_COVERS}/{object_name}"
