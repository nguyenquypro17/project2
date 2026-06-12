import sqlite3
import math
from datetime import datetime
from pathlib import Path

DB_PATH = Path(__file__).parent / "parking.db"

FREE_MIN = 15
RATES = {"motorbike": 5000, "car": 15000}  # VND per hour


def _conn():
    c = sqlite3.connect(DB_PATH)
    c.row_factory = sqlite3.Row
    return c


def init_db():
    with _conn() as c:
        c.execute("""
            CREATE TABLE IF NOT EXISTS parking_records (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                plate        TEXT    NOT NULL,
                vehicle_type TEXT    NOT NULL DEFAULT 'motorbike',
                entry_time   TEXT    NOT NULL,
                exit_time    TEXT,
                duration_min INTEGER,
                fee          REAL,
                status       TEXT    DEFAULT 'in'
            )
        """)
        c.commit()


def _calc_fee(duration_min: int, vehicle_type: str) -> float:
    if duration_min <= FREE_MIN:
        return 0.0
    billable = duration_min - FREE_MIN
    blocks = math.ceil(billable / 30)
    rate_per_block = RATES.get(vehicle_type, RATES["motorbike"]) / 2
    return blocks * rate_per_block


def _elapsed_min(entry_time_iso: str) -> int:
    entry = datetime.fromisoformat(entry_time_iso)
    return int((datetime.now() - entry).total_seconds() / 60)


def checkin(plate: str, vehicle_type: str) -> dict:
    plate = plate.strip().upper()
    with _conn() as c:
        existing = c.execute(
            "SELECT id, entry_time FROM parking_records WHERE plate=? AND status='in'",
            (plate,),
        ).fetchone()
        if existing:
            return {
                "success": False,
                "message": f"Xe {plate} đang trong bãi từ {existing['entry_time'][:16].replace('T', ' ')}",
            }
        now = datetime.now().isoformat(timespec="seconds")
        cur = c.execute(
            "INSERT INTO parking_records (plate, vehicle_type, entry_time, status) VALUES (?,?,?,?)",
            (plate, vehicle_type, now, "in"),
        )
        c.commit()
        return {
            "success": True,
            "id": cur.lastrowid,
            "plate": plate,
            "vehicle_type": vehicle_type,
            "entry_time": now,
        }


def checkout(plate: str) -> dict:
    plate = plate.strip().upper()
    now = datetime.now()
    with _conn() as c:
        record = c.execute(
            "SELECT * FROM parking_records WHERE plate=? AND status='in' ORDER BY entry_time DESC LIMIT 1",
            (plate,),
        ).fetchone()
        if not record:
            return {"success": False, "message": f"Không tìm thấy xe {plate} trong bãi"}
        duration_min = _elapsed_min(record["entry_time"])
        fee = _calc_fee(duration_min, record["vehicle_type"])
        exit_time = now.isoformat(timespec="seconds")
        c.execute(
            "UPDATE parking_records SET exit_time=?, duration_min=?, fee=?, status='out' WHERE id=?",
            (exit_time, duration_min, fee, record["id"]),
        )
        c.commit()
        return {
            "success": True,
            "id": record["id"],
            "plate": plate,
            "vehicle_type": record["vehicle_type"],
            "entry_time": record["entry_time"],
            "exit_time": exit_time,
            "duration_min": duration_min,
            "fee": fee,
        }


def get_active() -> list:
    with _conn() as c:
        rows = c.execute(
            "SELECT * FROM parking_records WHERE status='in' ORDER BY entry_time DESC"
        ).fetchall()
    result = []
    for r in rows:
        d = dict(r)
        d["duration_min"] = _elapsed_min(r["entry_time"])
        d["fee_estimate"] = _calc_fee(d["duration_min"], r["vehicle_type"])
        result.append(d)
    return result


def get_records(limit: int = 200, status: str = "", date_str: str = "", plate: str = "") -> list:
    query = "SELECT * FROM parking_records WHERE 1=1"
    params: list = []
    if status:
        query += " AND status=?"
        params.append(status)
    if date_str:
        query += " AND date(entry_time)=?"
        params.append(date_str)
    if plate:
        query += " AND plate LIKE ?"
        params.append(f"%{plate.upper()}%")
    query += " ORDER BY entry_time DESC LIMIT ?"
    params.append(limit)
    with _conn() as c:
        rows = c.execute(query, params).fetchall()
    return [dict(r) for r in rows]


def get_stats(date_str: str = "") -> dict:
    if not date_str:
        date_str = datetime.now().strftime("%Y-%m-%d")
    with _conn() as c:
        rows = c.execute(
            "SELECT vehicle_type, COUNT(*) as cnt, COALESCE(SUM(fee),0) as total_fee "
            "FROM parking_records WHERE status='out' AND date(exit_time)=? "
            "GROUP BY vehicle_type",
            (date_str,),
        ).fetchall()

    stats = {
        "date": date_str,
        "total_fee": 0.0,
        "total_vehicles": 0,
        "motorbike_count": 0,
        "motorbike_fee": 0.0,
        "car_count": 0,
        "car_fee": 0.0,
    }
    for r in rows:
        vt = r["vehicle_type"]
        stats["total_fee"] += r["total_fee"]
        stats["total_vehicles"] += r["cnt"]
        if vt == "motorbike":
            stats["motorbike_count"] = r["cnt"]
            stats["motorbike_fee"] = r["total_fee"]
        elif vt == "car":
            stats["car_count"] = r["cnt"]
            stats["car_fee"] = r["total_fee"]
    return stats


init_db()
