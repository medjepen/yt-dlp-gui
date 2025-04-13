# 手動でyt-dlpを試す
from yt_dlp import YoutubeDL

with YoutubeDL() as ydl:
    ydl.download(["https://www.twitch.tv/videos/xxxxxxx"])
