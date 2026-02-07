"""Audit logging module — in-memory store.

Every API call is logged with a fixed set of keys.
Audit logging MUST NOT affect response logic.
"""

from __future__ import annotations

import datetime
from typing import Any, Dict, List, Optional

_audit_log: List[Dict[str, Any]] = []


def get_audit_log() -> List[Dict[str, Any]]:
    """Return the in-memory audit log list."""
    return _audit_log


def log_event(
    engine: str,
    endpoint: str,
    input_summary: str,
    output_type: str,
    source_ids: Optional[List[str]] = None,
) -> None:
    """Record an audit event. Each entry has fixed keys."""
    entry: Dict[str, Any] = {
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "engine": engine,
        "endpoint": endpoint,
        "input_summary": input_summary,
        "output_type": output_type,
        "source_ids": source_ids or [],
    }
    _audit_log.append(entry)
