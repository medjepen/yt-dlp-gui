import subprocess
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


@patch("backend.main.subprocess.run")
def test_create_job_and_check_status(mock_subprocess_run):
    """
    # テストの目的
    - POST /download 実行時にジョブIDが正しく生成・保存されるか
    - GET /status/{job_id} でジョブのステータスが取得できるか
    - GET /status/{status} で指定したステータスのジョブが取得できるか
    - GET /all ですべてのジョブが取得できるか
    - GET / でメッセージが取得できるか
    """
    # subprocess.run をモック化し何もせず成功したことにする
    mock_subprocess_run.return_value = MagicMock()

    payload = {
        "url": "https://www.youtube.com/watch?v=CT2_P2DZBR0",
        "options": ["-f", "best"],
        "output_dir": "",
    }
    # 1. POST /download リクエスト
    res = client.post("/download", json=payload)
    assert res.status_code == 200
    data = res.json()
    print("POST /download response >>> \n", data)
    assert "job_id" in data
    job_id = data["job_id"]

    # 2. GET /status/{job_id} リクエスト
    status_res = client.get(f"/status/{job_id}")
    assert status_res.status_code == 200
    status_data = status_res.json()
    print(f"GET /status/{job_id} response >>> \n", status_data)
    assert "status" in status_data
    assert status_data["status"] in [
        "queued",
        "in_progress",
        "completed",
        "failed",
        None,
    ]
    status = status_data["status"]

    # 3. GET /status/{status} リクエスト
    by_status_res = client.get(f"/status/{status}")
    assert by_status_res.status_code == 200
    by_status_data = by_status_res.json()
    print(f"GET /status/{status} response >>> \n", by_status_data)

    # 4. GET /all リクエスト
    all_res = client.get("/all")
    assert all_res.status_code == 200
    all_data = all_res.json()
    print("GET /all response >>> \n", all_data)
    assert isinstance(all_data, dict)
    assert job_id in all_data

    # 5. GET / リクエスト
    hello_res = client.get("/")
    assert hello_res.status_code == 200
    hello_data = hello_res.json()
    print("GET / response >>> \n", hello_data)
    assert "message" in hello_data


@patch(
    "backend.main.subprocess.run",
    side_effect=subprocess.CalledProcessError(1, "yt-dlp"),
)
def test_download_failure_returns_500(mock_run):
    """
    # テストの目的
    - POST /download で誤ったpayloadを渡した際にエラーが返ってくるか
    """
    payload = {
        "url": "https://invalid/watch?v=CT2_P2DZBR0",
        "options": ["-f", "best"],
        "output_dir": "",
    }
    # 1. POST /download リクエスト
    res = client.post("/download", json=payload)
    assert res.status_code == 500
    data = res.json()
    print("POST /download response >>> \n", data)
    assert "Download failed" in data["detail"]
