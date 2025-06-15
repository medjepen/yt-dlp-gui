import os
import re
import subprocess
import threading
import uuid

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from yt_dlp import YoutubeDL

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
    filename: str
    options: list[str] = []
    output_dir: str | None = None


def sanitize_filename(filename: str) -> str:
    return re.sub(r'[\\/*?:"<>|]', "-", filename)


@app.get("/")
def read_root():
    return {"message": "Welcome to the Video Downloader API!"}


@app.get("/video_info")
def get_video_info(url: str):
    ydl_opts = {
        "quiet": True,
        "skip_download": True,
        "no_warnings": True,
    }
    with YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        return {
            "title": info.get("title"),
            "uploader": info.get("uploader"),
            "thumbnail": info.get("thumbnail"),
            "duration": info.get("duration"),
            "formats": [
                {
                    "format_id": f["format_id"],
                    "ext": f["ext"],
                    "resolution": f.get("resolution"),
                }
                for f in info.get("formats", [])
                if f.get("vcodec") != "none" and f.get("acodec") != "none"
            ],
        }


@app.post("/download")
def download_video(req: DownloadRequest):
    # ID発行
    job_id = create_job_entry()

    # 保存先ディレクトリ設定
    download_dir = req.output_dir or DEFAULT_DOWNLOAD_DIR
    # 一意のファイル名で保存し、最終的にリネームする
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
        os.makedirs(download_dir, exist_ok=True)
        _run_yt_dlp_async(job_id, command, req.filename, download_dir, video_id)
        return {"job_id": job_id, "message": "Job created"}
    except FileExistsError:
        pass  # 他のプロセスが同時にファイル作成していても無視する
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")


def _run_yt_dlp_async(job_id, command, re_filename, download_dir, video_id):
    def worker():
        update_job_status(job_id, status="in_progress", progress=10)
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
        )
        for line in process.stdout:
            print(f"[yt-dlp] {line.strip()}")
            # lineを解析してprogressを更新
        process.wait()
        if process.returncode == 0:
            try:
                # ファイル名のサニタイズ
                sanitized_filename = sanitize_filename(re_filename)
                for file in os.listdir(download_dir):
                    if file.startswith(video_id):
                        download_path = os.path.join(download_dir, file)
                        ext = os.path.splitext(file)[1]
                        rename_path = _generate_unique_filename(
                            os.path.join(download_dir, sanitized_filename + ext)
                        )
                        os.rename(download_path, rename_path)
                        # デバッグ用
                        print("Rename file: ", rename_path)
                        break
                update_job_status(job_id, status="completed", progress=100)
            except Exception as e:
                update_job_status(
                    job_id, status="failed", error=f"Rename error: {str(e)}"
                )
        else:
            update_job_status(job_id, status="failed", error="yt-dlp error")

    threading.Thread(target=worker).start()


def _generate_unique_filename(path):
    # ファイル名が重複している場合、ファイル名の末尾に(1),(2)と追加する
    base, ext = os.path.splitext(path)
    counter = 1
    new_path = path
    while os.path.exists(new_path):
        new_path = f"{base} ({counter}){ext}"
        counter += 1
    return new_path


@app.get("/status/{job_id}")
def read_status(job_id: str):
    status = get_job_status(job_id)
    if status is None:
        return {"status": "failed", "error": "Job not found"}
    return status


@app.get("/status/{status}")
def read_jobs_by_status(status: str):
    job_by_status = get_jobs_by_status(status)
    return job_by_status


@app.get("/all")
def read_all():
    job_all = get_all_jobs()
    return job_all
