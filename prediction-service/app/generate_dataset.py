"""Generate a SYNTHETIC occupancy dataset (NOT real KSRTC data).

Every row is simulated: route base demand x time-of-day peak x weekday factor
+ random noise. It exists only so the ML pipeline can be demonstrated. Real
passenger reports submitted through the app should replace these rows later.
"""
import argparse
import numpy as np
import pandas as pd
from .config import ROUTE_IDS, DATASET_PATH

WEEKS = 8
HOURS = range(6, 22)  # buses run 06:00-21:59


def peak_factor(hour: int) -> float:
    morning = np.exp(-((hour - 9) ** 2) / 4.0)
    evening = np.exp(-((hour - 18) ** 2) / 5.0)
    return 0.35 + 0.65 * max(morning, evening)


def generate(seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    base = {r: rng.uniform(55, 95) for r in ROUTE_IDS}  # per-route demand level
    rows = []
    for week in range(WEEKS):
        for dow in range(7):
            weekday = 1.0 if dow < 5 else (0.7 if dow == 5 else 0.55)
            for route in ROUTE_IDS:
                prev = None
                for hour in HOURS:
                    occ = float(np.clip(base[route] * peak_factor(hour) * weekday + rng.normal(0, 6), 0, 100))
                    # recent reports = noisy view of the previous hour (simulated passenger reports)
                    recent = occ if prev is None else prev
                    rows.append(dict(week=week, route_id=route, day_of_week=dow, hour=hour,
                                     occupancy_percent=round(occ, 1),
                                     recent_reports_avg=round(float(np.clip(recent + rng.normal(0, 4), 0, 100)), 1),
                                     data_source="SYNTHETIC"))
                    prev = occ
    return pd.DataFrame(rows)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=DATASET_PATH)
    a = ap.parse_args()
    df = generate()
    df.to_csv(a.out, index=False)
    print(f"Wrote {len(df)} SYNTHETIC rows to {a.out}")
