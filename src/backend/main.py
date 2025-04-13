from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import subprocess

app = FastAPI()


class DownloadRequest(BaseModel):
    url: str


@app.post("/download")
def download_video(req: DownloadRequest):
    try:
        # yt-dlp
        subprocess.run(["yt-dlp", req.url, "-o", "%(title)s.%(ext)s"], check=True)
        return {"status": "success"}
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=str(e))
