from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

BASE_DIR = Path(__file__).resolve().parent
ARCHIVE_CSV = BASE_DIR / "alarm_log.csv"

np.random.seed(42)

SENSORS = {
    "Compressor Station A": {
        "bad_actor": "Vib_Sensor_04_Err",
        "tags": ["Vib_Sensor_04_Err", "Lube_Oil_Press_Low", "Bearing_Temp_High", "Shaft_Displacement", "Valve_Slow"],
        "weights": [0.45, 0.25, 0.15, 0.10, 0.05],
    },
    "Boiler Unit": {
        "bad_actor": "Steam_Press_High",
        "tags": ["Steam_Press_High", "Valve_Stuck_Close", "Temp_Crit_B", "Flow_Variance"],
        "weights": [0.40, 0.25, 0.20, 0.15],
    },
    "Pump Station B": {
        "bad_actor": "Pump_Cavitation",
        "tags": ["Pump_Cavitation", "Flow_Low", "Pressure_Drop"],
        "weights": [0.50, 0.30, 0.20],
    },
    "Heat Exchanger C": {
        "bad_actor": "HX_FoulingAlarm",
        "tags": ["HX_FoulingAlarm", "Temp_Delta_High", "Flow_Restrict"],
        "weights": [0.50, 0.30, 0.20],
    },
}

ZONE_WEIGHTS = [0.65, 0.15, 0.10, 0.10]

PRIORITY_MAP = {
    "Vib_Sensor_04_Err": "High", "Steam_Press_High": "High",
    "Pump_Cavitation": "High", "HX_FoulingAlarm": "High",
    "Lube_Oil_Press_Low": "Medium", "Bearing_Temp_High": "Medium",
    "Shaft_Displacement": "Medium", "Valve_Stuck_Close": "Medium",
    "Flow_Low": "Medium", "Pressure_Drop": "Medium",
    "Temp_Delta_High": "Medium", "Temp_Crit_B": "Low",
    "Flow_Variance": "Low", "Valve_Slow": "Low",
    "Flow_Restrict": "Low",
}

CAUSES = {
    "Vib_Sensor_04_Err": "Вибрация превысила критический порог. Возможный износ подшипника или дисбаланс ротора.",
    "Lube_Oil_Press_Low": "Давление смазочного масла ниже нормы. Проверить масляный насос и фильтры.",
    "Bearing_Temp_High": "Перегрев подшипника. Недостаточная смазка или повреждение обоймы.",
    "Shaft_Displacement": "Осевое смещение вала за пределами допуска. Проверить муфту и опоры.",
    "Valve_Slow": "Запаздывание клапана. Загрязнение привода или износ уплотнений.",
    "Steam_Press_High": "Давление пара превышает норму. Проверить регулятор давления и предохранительный клапан.",
    "Valve_Stuck_Close": "Клапан не открывается. Механическая блокировка или отказ привода.",
    "Temp_Crit_B": "Критическая температура в зоне B. Нарушение теплообмена.",
    "Flow_Variance": "Нестабильный расход. Частичное засорение трубопровода.",
    "Pump_Cavitation": "Кавитация насоса. Снизить производительность или повысить давление на входе.",
    "Flow_Low": "Низкий расход. Проверить задвижки и состояние рабочего колеса.",
    "Pressure_Drop": "Падение давления. Возможна утечка или засорение фильтра.",
    "HX_FoulingAlarm": "Загрязнение теплообменника. Снижение КПД — требуется промывка.",
    "Temp_Delta_High": "Высокая разница температур. Нарушение режима теплопередачи.",
    "Flow_Restrict": "Ограничение потока. Частичное перекрытие прохода.",
}


STORM_PRIORITY_THRESHOLD = 50
STORM_PRIORITIES = ["High", "Medium"]


def generate_alarms(days=7, storm_prob=0.4, end_date=None):
    """Генерирует события за последние ``days`` дней.

    Для каждого дня случайно выбирается режим:
      - обычный (≈25—48 событий, малая доля шторм-интервалов);
      - шторм (≈450—700 событий, высокая доля коротких интервалов).
    Штормовой режим гарантирует > STORM_PRIORITY_THRESHOLD аварий High + Medium за день.
    """
    zones = list(SENSORS.keys())
    events = []

    end_date = end_date or datetime(2026, 5, 14, 23, 59, 59)
    base_day = (end_date - timedelta(days=days - 1)).replace(hour=0, minute=0, second=0, microsecond=0)

    for day_idx in range(days):
        is_storm = np.random.rand() < storm_prob
        if is_storm:
            per_day = int(np.random.randint(450, 701))
            flood_prob = 0.55
        else:
            per_day = int(np.random.randint(25, 49))
            flood_prob = 0.04

        day_start = base_day + timedelta(days=day_idx)
        storm_anchor = day_start + timedelta(hours=int(np.random.randint(0, 24)), minutes=int(np.random.randint(0, 60)))
        day_events = []
        for _ in range(per_day):
            if np.random.rand() < flood_prob:
                offset_seconds = int(np.random.normal(loc=0, scale=25 * 60))
                event_seconds = int(np.clip((storm_anchor - day_start).total_seconds() + offset_seconds, 0, 86399))
            else:
                event_seconds = int(np.random.randint(0, 86400))
            t = day_start + timedelta(seconds=event_seconds, milliseconds=int(np.random.randint(0, 1000)))

            zone = np.random.choice(zones, p=ZONE_WEIGHTS)
            cfg = SENSORS[zone]
            tag = np.random.choice(cfg["tags"], p=cfg["weights"])

            day_events.append({
                "priority": PRIORITY_MAP[tag],
                "date": t.strftime("%Y-%m-%d"),
                "timestamp": t.strftime("%H:%M:%S.%f")[:-3],
                "datetime": t.isoformat(timespec="milliseconds"),
                "tag": tag,
                "zone": zone,
                "message": f"Critical threshold broken for {tag}",
                "possible_cause": CAUSES[tag],
                "is_bad_actor": int(tag == cfg["bad_actor"]),
            })
        events.extend(sorted(day_events, key=lambda event: event["datetime"]))

    return pd.DataFrame(events)


def compute_storm_days(df):
    """Список дней с флагом шторма (число аварий High + Medium > STORM_PRIORITY_THRESHOLD)."""
    if df.empty:
        return []
    priority_per_day = df[df["priority"].isin(STORM_PRIORITIES)].groupby("date").size().to_dict()
    return [
        {
            "date": day,
            "high_medium_count": int(count),
            "high_count": int(count),
            "is_storm": bool(count > STORM_PRIORITY_THRESHOLD),
        }
        for day, count in sorted(priority_per_day.items())
    ]


def compute_clusters(df):
    clusters = []
    for zone, cfg in SENSORS.items():
        zdf = df[df["zone"] == zone]
        if len(zdf) < 3:
            continue
        clusters.append({
            "zone": zone,
            "bad_actor": cfg["bad_actor"],
            "count": len(zdf),
            "t_start": zdf["timestamp"].iloc[0],
            "t_end": zdf["timestamp"].iloc[-1],
            "tags": zdf["tag"].value_counts().head(4).index.tolist(),
        })
    return sorted(clusters, key=lambda x: x["count"], reverse=True)


def compute_intensity(df):
    """Почасовая интенсивность за выбранный день."""
    if df.empty:
        return []
    work_df = df.copy()
    work_df["dt"] = pd.to_datetime(work_df["datetime"])
    day_start = work_df["dt"].min().normalize()
    hours = pd.date_range(day_start, day_start + pd.Timedelta(hours=23), freq="h")
    counts = work_df["dt"].dt.floor("h").value_counts().to_dict()
    return [
        {"time": hour.isoformat(), "count": int(counts.get(hour, 0))}
        for hour in hours
    ]


def compute_events_last_hour(df):
    """Число событий за последний час от максимального timestamp в логе."""
    if df.empty:
        return 0
    ts = pd.to_datetime(df["datetime"])
    t_max = ts.max()
    return int((ts >= t_max - pd.Timedelta(hours=1)).sum())


def compute_minute_intensity(df):
    """Алармы в минуту за последний час от максимального timestamp в логе."""
    if df.empty:
        return []
    work_df = df.copy()
    work_df["dt"] = pd.to_datetime(work_df["datetime"])
    t_max = work_df["dt"].max()
    start = t_max - pd.Timedelta(hours=1)
    last_hour = work_df[(work_df["dt"] >= start) & (work_df["dt"] <= t_max)]
    minute_range = pd.date_range(start.floor("min"), t_max.ceil("min"), freq="min")
    counts = last_hour["dt"].dt.floor("min").value_counts().to_dict()
    return [
        {"time": minute.isoformat(), "count": int(counts.get(minute, 0))}
        for minute in minute_range
    ]


def compute_analytics(df):
    """Агрегированная аналитика. ``total`` равен фактическому размеру датафрейма."""
    if df.empty:
        return {
            "clusters": [], "intensity": [], "bad_actor": None, "bad_zone": None,
            "total": 0, "in_clusters": 0, "events_last_hour": 0,
            "minute_intensity": [], "storm_days": [],
        }
    clusters = compute_clusters(df)
    intensity = compute_intensity(df)
    bad_actor_series = df[df["is_bad_actor"] == 1]["tag"].value_counts()
    bad_actor = bad_actor_series.idxmax() if not bad_actor_series.empty else None
    bad_zone = df[df["tag"] == bad_actor]["zone"].iloc[0] if bad_actor else None
    in_clusters = sum(c["count"] for c in clusters[:2])

    return {
        "clusters": clusters,
        "intensity": intensity,
        "bad_actor": bad_actor,
        "bad_zone": bad_zone,
        "total": int(len(df)),
        "in_clusters": in_clusters,
        "events_last_hour": compute_events_last_hour(df),
        "minute_intensity": compute_minute_intensity(df),
        "storm_days": compute_storm_days(df),
    }


def compute_daily_analytics(df):
    rows = []
    for date, day_df in df.groupby("date"):
        critical_count = int(day_df["priority"].isin(STORM_PRIORITIES).sum())
        tag_counts = day_df["tag"].value_counts()
        intensity = compute_intensity(day_df)
        rows.append({
            "date": date,
            "total_count": int(len(day_df)),
            "critical_count": critical_count,
            "status": "ШТОРМ" if critical_count > STORM_PRIORITY_THRESHOLD else "НОРМА",
            "top_bad_actor": tag_counts.idxmax() if not tag_counts.empty else None,
            "intensity_peak": max((point["count"] for point in intensity), default=0),
        })
    return sorted(rows, key=lambda item: item["date"], reverse=True)


def compute_monitor(df):
    """Статус узлов/зон + временные ряды по часу для графиков."""
    nodes = []
    for zone, cfg in SENSORS.items():
        zdf = df[df["zone"] == zone]
        count = len(zdf)
        high = int((zdf["priority"] == "High").sum())
        if high >= 20:
            status = "critical"
        elif high >= 5 or count >= 80:
            status = "warning"
        else:
            status = "ok"
        nodes.append({
            "zone": zone,
            "status": status,
            "bad_actor": cfg["bad_actor"],
            "alarms_total": count,
            "alarms_high": high,
            "last_event": zdf["datetime"].iloc[-1] if count else None,
            "load_pct": int(min(100, 30 + count / 10)),
        })

    # Часовой ряд по всему df
    if df.empty:
        hourly = []
    else:
        ts = pd.to_datetime(df["datetime"])
        buckets = ts.dt.floor("h").value_counts().sort_index()
        hourly = [
            {"time": idx.isoformat(), "count": int(val)}
            for idx, val in buckets.items()
        ]

    return {
        "nodes": nodes,
        "hourly": hourly,
        "total": len(df),
        "updated_at": datetime.utcnow().isoformat(timespec="seconds") + "Z",
    }


app = FastAPI(title="AlarmStorm API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

alarms_df = generate_alarms(days=7, storm_prob=0.4)
alarms_df.to_csv(ARCHIVE_CSV, index=False, encoding="utf-8-sig")

AVAILABLE_DAYS = sorted(alarms_df["date"].unique().tolist())
LATEST_DAY = AVAILABLE_DAYS[-1]


@app.get("/api/alarms")
def get_alarms(date: str | None = Query(default=None, description="YYYY-MM-DD")):
    """События за выбранный день. Без date — последний доступный день."""
    target_date = date or LATEST_DAY
    if target_date not in AVAILABLE_DAYS:
        raise HTTPException(status_code=404, detail=f"No data for date {target_date}")
    day_df = alarms_df[alarms_df["date"] == target_date]
    return day_df.to_dict(orient="records")


@app.get("/api/analytics")
def get_analytics(
    date: str | None = Query(default=None, description="YYYY-MM-DD"),
    day: str | None = Query(default=None, description="Deprecated alias for date"),
):
    """Аналитика по дням или детальная аналитика за выбранный день."""
    target_date = date or day
    if target_date is None:
        return compute_daily_analytics(alarms_df)
    if target_date not in AVAILABLE_DAYS:
        raise HTTPException(status_code=404, detail=f"No data for date {target_date}")
    return {
        "available_days": AVAILABLE_DAYS,
        "latest_day": LATEST_DAY,
        "date": target_date,
        "analytics": compute_analytics(alarms_df[alarms_df["date"] == target_date]),
    }


@app.get("/api/monitor")
def get_monitor():
    """Статус системы/узлов и почасовой ряд для графиков."""
    return compute_monitor(alarms_df[alarms_df["date"] == LATEST_DAY])


@app.get("/api/archive")
def get_archive(
    day: str | None = Query(default=None, description="YYYY-MM-DD"),
    zone: str | None = Query(default=None),
    priority: str | None = Query(default=None),
    limit: int = Query(default=200, ge=1, le=5000),
    offset: int = Query(default=0, ge=0),
):
    """Исторические данные из alarm_log.csv с фильтрами и пагинацией."""
    if not ARCHIVE_CSV.exists():
        raise HTTPException(status_code=500, detail="Archive CSV not found")
    df = pd.read_csv(ARCHIVE_CSV)
    if day:
        df = df[df["date"] == day]
    if zone:
        df = df[df["zone"] == zone]
    if priority:
        df = df[df["priority"] == priority]
    df = df.sort_values("datetime", ascending=False)
    total = len(df)
    rows = df.iloc[offset:offset + limit].to_dict(orient="records")
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "available_days": AVAILABLE_DAYS,
        "items": rows,
    }
