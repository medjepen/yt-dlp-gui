import os
import subprocess
import uuid

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # frontendのURL
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
        os.makedirs(download_dir, exist_ok=True)
        subprocess.run(command, check=True)
        return {"status": "success", "video_id": video_id}
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

    return {
        "status": "success",
        "video_id": video_id,
        "saved_to": os.path.abspath(download_dir)
    }

# @app.post("/status")
# def download_video(req: DownloadRequest):
#     try:
#         # yt-dlp
#         subprocess.run(["yt-dlp", req.url, "-o", "%(title)s.%(ext)s"], check=True)
#         return {"status": "success"}
#     except subprocess.CalledProcessError as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @app.post("/options")
# def download_video(req: DownloadRequest):
#     try:
#         # yt-dlp
#         subprocess.run(["yt-dlp", req.url, "-o", "%(title)s.%(ext)s"], check=True)
#         return {"status": "success"}
#     except subprocess.CalledProcessError as e:
#         raise HTTPException(status_code=500, detail=str(e))
