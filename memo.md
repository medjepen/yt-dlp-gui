## 本番配布時の構成イメージ
```s
[ Electron アプリ ]
├─ React (UI)
├─ Node.js (Electron ロジック)
└─ Python (FastAPI API + yt-dlp + ffmpeg)
     └─ Electron の Node.jsから Python を child_process で実行
```
- Electronアプリから child_process.spawn() などで Python の API サーバーを起動
- Electronは http://localhost:8000 などでそのPythonサーバーにアクセス
- 必要な依存（yt-dlp, ffmpeg, fastapi, uvicornなど）を Electron パッケージ内に同梱

## Dockerでの開発構成
```s
[Docker コンテナ]
├─ frontend/   ← React
├─ backend/    ← Python (FastAPI + yt-dlp + ffmpeg)
├─ Electron用 mock 構成（nodeからPython起動）
├─ Dockerfile
└─ docker-compose.yml
```
## Video Downloader API設計
| メソッド | パス | 内容 |
| --- | --- | --- |
| POST | /download | 指定のURLをローカルに保存 |
| GET | /status | 処理中・完了などの状態取得 |
| GET | /options | yt-dlpの利用可能なオプション一覧（任意）|

### 使い方
- `/download`
```s
curl -X POST http://localhost:8000/download \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=CT2_P2DZBR0",
    "options": [
      "--ffmpeg-location",
      "/usr/bin/ffmpeg",
      "-f",
      "bestvideo[height<=720]+bestaudio/best[height<=720]",
      "--merge-output-format",
      "mp4",
      "--postprocessor-args",
      "-c:v libx264 -crf 28 -c:a aac -movflags +faststart"
    ],
    "output_dir": "./my-videos"
  }'
```