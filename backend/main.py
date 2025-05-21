import os
import subprocess
import uuid

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .job_store import (
    create_job_entry,
    get_all_jobs,
    get_job_status,
    get_jobs_by_status,
    update_job_status,
)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # frontendのURL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEFAULT_DOWNLOAD_DIR = "./downloads"


class DownloadRequest(BaseModel):
    url: str
    options: list[str] = []
    output_dir: str | None = None


@app.get("/")
def read_root():
    return {"message": "Welcome to the Video Downloader API!"}


@app.post("/download")
def download_video(req: DownloadRequest):
    # ID発行
    job_id = create_job_entry()

    # 保存先ディレクトリ設定
    download_dir = req.output_dir or DEFAULT_DOWNLOAD_DIR

    # 一意のファイル名で保存
    video_id = str(uuid.uuid4())
    output_path = os.path.join(download_dir, f"{video_id}.%(ext)s")
    command = ["yt-dlp", "-o", output_path]
    if req.options:
        command += req.options
    command.append(req.url)
    # デバッグ用
    print("Command: ", command)
    try:
        # yt-dlp
        update_job_status(job_id, status="in_progress", progress=10)
        os.makedirs(download_dir, exist_ok=True)
        subprocess.run(command, check=True)
        return {"job_id": job_id, "message": "Job created"}
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")


@app.get("/status/{job_id}")
def read_status(job_id: str):
    status = get_job_status(job_id)
    if status is None:
        return {"error": "Job not found"}
    return status


@app.get("/status/{status}")
def read_jobs_by_status():
    job_all = get_jobs_by_status()
    return job_all


@app.get("/all")
def read_all():
    job_all = get_all_jobs()
    return job_all
