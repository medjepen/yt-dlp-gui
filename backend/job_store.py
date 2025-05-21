"""
# ステータス取得の状態管理
"""

import uuid
from typing import Any, Dict, Optional

"""
job_store; グローバル変数。メモリ上のジョブ保存辞書
"""
job_store: Dict[str, Dict[str, Any]] = {}


def create_job_entry() -> str:
    """
    create_job_entry(job_id)
        - ジョブ作成・登録
    """
    job_id = str(uuid.uuid4())
    job_store[job_id] = {
        "status": "queued",
        "progress": 0,
        "error": None,
    }
    return job_id


def update_job_status(
    job_id: str,
    status: Optional[str] = None,
    progress: Optional[int] = None,
    error: Optional[str] = None,
) -> bool:
    """
    - update_job_status(job_id, ...)
        - ステータス更新
    """
    if status is not None:
        job_store[job_id]["status"] = status
    if progress is not None:
        job_store[job_id]["progress"] = progress
    if error is not None:
        job_store[job_id]["error"] = error
    return 1


def get_job_status(job_id: str) -> Optional[Dict[str, Any]]:
    """
    - get_job_status(job_id)
        - ステータス取得
    """
    return job_store.get(job_id, None)


def get_jobs_by_status(status: str) -> Dict[str, Dict[str, Any]]:
    """
    - get_jobs_by_status(status)
        - 状態ごとのジョブ取得
    """
    return {job_id: job for job_id, job in job_store.items() if job["status"] == status}


def get_all_jobs():
    """
    - get_all_jobs()
        - すべてのジョブ取得
    """
    return job_store
