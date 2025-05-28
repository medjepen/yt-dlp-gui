import os
import time

import httpx
import pytest

BASE_URL = "http://localhost:8000"


@pytest.mark.asyncio
async def test_full_download_flow():
    req = {
        "url": "https://www.youtube.com/watch?v=CT2_P2DZBR0",
        "options": [
            "-f",
            "bestvideo[height<=480]+bestaudio/best[height<=480]",
        ],  # test用
        "output_dir": "./downloads",
    }

    async with httpx.AsyncClient(
        timeout=120.0
    ) as client:  # 動画のダウンロード時間によって変更する
        # 1. 動画ダウンロードをリクエスト
        res = await client.post(f"{BASE_URL}/download", json=req)
        assert res.status_code == 200
        data = res.json()
        print("response data >>> ", data)
        assert "job_id" in data
        job_id = data["job_id"]

        # 2. 一定時間ポーリングしてジョブの進行状況を確認
        for _ in range(40):  # 動画のダウンロード時間によって変更する
            time.sleep(3)
            status_res = await client.get(f"{BASE_URL}/status/{job_id}")
            assert status_res.status_code == 200
            status_data = status_res.json()
            print("Current status:", status_data)
            if status_data["status"] in ["completed", "failed"]:
                break

        # 3. 最終ステータスが"completed" or "failed"
        assert status_data["status"] in ["completed", "failed"]
