#!/usr/bin/env python3
"""Validate and atomically import a GTFS Schedule feed into the isolated GTFS schema."""
import argparse
import csv
import hashlib
import io
import re
import sys
import zipfile
from contextlib import contextmanager
from pathlib import Path

import psycopg
from psycopg import sql

SOURCE_URL = "https://github.com/Vonter/bmtc-gtfs"
GTFS_URL = "https://raw.githubusercontent.com/Vonter/bmtc-gtfs/main/gtfs/bmtc.zip"
ACCEPTED = {
    "agency.txt", "attributions.txt", "calendar.txt", "calendar_dates.txt",
    "fare_attributes.txt", "fare_rules.txt", "feed_info.txt", "routes.txt",
    "shapes.txt", "stop_times.txt", "stops.txt", "translations.txt", "trips.txt",
}
REQUIRED = {
    "agency.txt": {"agency_name", "agency_url", "agency_timezone"},
    "routes.txt": {"route_id", "route_type"},
    "stops.txt": {"stop_id", "stop_name"},
    "trips.txt": {"route_id", "service_id", "trip_id"},
    "stop_times.txt": {"trip_id", "stop_id", "stop_sequence"},
    "shapes.txt": {"shape_id", "shape_pt_lat", "shape_pt_lon", "shape_pt_sequence"},
    "calendar.txt": {"service_id", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "start_date", "end_date"},
    "calendar_dates.txt": {"service_id", "date", "exception_type"},
    "fare_attributes.txt": {"fare_id", "price", "currency_type", "payment_method"},
    "fare_rules.txt": {"fare_id"},
    "translations.txt": {"table_name", "field_name", "language", "translation"},
    "attributions.txt": {"attribution_id", "organization_name"},
}


def clean(value):
    return (value or "").strip()


class Feed:
    def __init__(self, source: Path):
        self.source = source
        self.archive = zipfile.ZipFile(source) if source.is_file() else None
        self.members = {}
        if self.archive:
            for item in self.archive.infolist():
                if item.is_dir() or not item.filename.lower().endswith(".txt"):
                    continue
                name = Path(item.filename).name.lower()
                if name in self.members:
                    raise ValueError(f"Multiple GTFS files named {name} in archive")
                self.members[name] = item.filename
        else:
            self.members = {p.name.lower(): p for p in source.glob("*.txt")}
        unexpected = set(self.members) - ACCEPTED
        if unexpected:
            raise ValueError("Feed contains files this importer does not yet support: " + ", ".join(sorted(unexpected)))
        for name in ("agency.txt", "routes.txt", "stops.txt", "trips.txt", "stop_times.txt"):
            if name not in self.members:
                raise ValueError(f"Required GTFS file is missing: {name}")
        if "calendar.txt" not in self.members and "calendar_dates.txt" not in self.members:
            raise ValueError("calendar.txt or calendar_dates.txt is required")

    @contextmanager
    def open_binary(self, name):
        if self.archive:
            with self.archive.open(self.members[name]) as f:
                yield f
        else:
            with Path(self.members[name]).open("rb") as f:
                yield f

    def header(self, name):
        with self.open_binary(name) as raw:
            text = io.TextIOWrapper(raw, encoding="utf-8-sig", newline="")
            return next(csv.reader(text))

    def first_row(self, name):
        if name not in self.members:
            return {}
        with self.open_binary(name) as raw:
            reader = csv.DictReader(io.TextIOWrapper(raw, encoding="utf-8-sig", newline=""))
            row = next(reader, {})
            return {k: clean(v) for k, v in row.items()}

    def digest(self):
        h = hashlib.sha256()
        for name in sorted(self.members):
            h.update(name.encode("utf-8"))
            h.update(b"\0")
            with self.open_binary(name) as f:
                while chunk := f.read(1024 * 1024):
                    h.update(chunk)
        return h.hexdigest()


def validate_headers(feed):
    print("Feed files:")
    for name in sorted(feed.members):
        header = feed.header(name)
        missing = REQUIRED.get(name, set()) - set(header)
        if missing:
            raise ValueError(f"{name} is missing required columns: {', '.join(sorted(missing))}")
        if len(header) != len(set(header)):
            raise ValueError(f"{name} has duplicate column names")
        print(f"  {name}: {len(header)} columns")
    for name in ("calendar.txt", "shapes.txt", "fare_attributes.txt", "fare_rules.txt", "translations.txt", "attributions.txt"):
        if name not in feed.members:
            print(f"  {name}: absent (optional/conditional in this feed)")


def stage_csv(cur, feed, name):
    header = feed.header(name)
    if not all(re.fullmatch(r"[a-z][a-z0-9_]*", c) for c in header):
        raise ValueError(f"Unsafe/nonstandard column name in {name}")
    stage = "st_" + Path(name).stem
    cur.execute(sql.SQL("CREATE TEMP TABLE {} ({}) ON COMMIT DROP").format(
        sql.Identifier(stage), sql.SQL(",").join(sql.SQL("{} TEXT").format(sql.Identifier(c)) for c in header)))
    copy = sql.SQL("COPY {} ({}) FROM STDIN WITH (FORMAT CSV, HEADER TRUE)").format(
        sql.Identifier(stage), sql.SQL(",").join(map(sql.Identifier, header)))
    with feed.open_binary(name) as source:
        with cur.copy(copy) as writer:
            while chunk := source.read(1024 * 1024):
                writer.write(chunk)
    cur.execute(sql.SQL("SELECT count(*) FROM {}").format(sql.Identifier(stage)))
    count = cur.fetchone()[0]
    print(f"  staged {name}: {count:,} rows", flush=True)
    return stage, set(header)


def col(headers, name, cast=None, default="NULL"):
    if name not in headers:
        return sql.SQL(default)
    value = sql.SQL("NULLIF({}, '')").format(sql.Identifier(name))
    if cast:
        value = sql.SQL("({})::{}").format(value, sql.SQL(cast))
    if default != "NULL":
        value = sql.SQL("COALESCE({}, {})").format(value, sql.SQL(default))
    return value


def insert_select(cur, table, columns, expressions, stage, feed_id):
    query = sql.SQL("INSERT INTO {} ({}) SELECT %s, {} FROM {}").format(
        sql.Identifier(table), sql.SQL(",").join([sql.Identifier("feed_id"), *map(sql.Identifier, columns)]),
        sql.SQL(",").join(expressions), sql.Identifier(stage))
    cur.execute(query, (feed_id,))
    count = cur.rowcount
    cur.execute(sql.SQL("DROP TABLE {}").format(sql.Identifier(stage)))
    return count


def datecol(headers, name):
    return sql.SQL("to_date(NULLIF({}, ''), 'YYYYMMDD')").format(sql.Identifier(name)) if name in headers else sql.SQL("NULL::date")


def timecol(headers, name):
    if name not in headers:
        return sql.SQL("NULL::integer")
    v = sql.SQL("NULLIF({}, '')").format(sql.Identifier(name))
    return sql.SQL("CASE WHEN {0} IS NULL THEN NULL ELSE split_part({0}, ':', 1)::integer * 3600 + split_part({0}, ':', 2)::integer * 60 + split_part({0}, ':', 3)::integer END").format(v)


def import_feed(feed, dsn):
    info = feed.first_row("feed_info.txt")
    sha = feed.digest()
    script_dir = Path(__file__).resolve().parent
    schema_path = script_dir / "03_gtfs_schema.sql"
    if not schema_path.is_file():  # Local checkout layout: database/tools/import_gtfs.py
        schema_path = script_dir.parent / "03_gtfs_schema.sql"
    schema = schema_path.read_text(encoding="utf-8")
    with psycopg.connect(dsn) as conn:
        with conn.transaction():
            cur = conn.cursor()
            cur.execute(schema)
            cur.execute("SELECT feed_id, is_active FROM gtfs_feeds WHERE zip_sha256 = %s", (sha,))
            prior = cur.fetchone()
            if prior:
                print(f"Feed already imported as feed_id={prior[0]}; active={prior[1]}. No changes made.")
                return
            cur.execute("""
              INSERT INTO gtfs_feeds(source_url, feed_publisher_name, feed_publisher_url, feed_lang,
                feed_version, feed_contact_email, feed_contact_url, zip_sha256, feed_start_date,
                feed_end_date, license, is_active)
              VALUES (%s,%s,%s,%s,%s,%s,%s,%s,
                to_date(NULLIF(%s,''),'YYYYMMDD'), to_date(NULLIF(%s,''),'YYYYMMDD'), 'ODbL-1.0', FALSE)
              RETURNING feed_id
            """, (GTFS_URL if feed.source.is_file() else SOURCE_URL,
                  info.get("feed_publisher_name"), info.get("feed_publisher_url"), info.get("feed_lang"),
                  info.get("feed_version"), info.get("feed_contact_email"), info.get("feed_contact_url"),
                  sha, info.get("feed_start_date"), info.get("feed_end_date")))
            feed_id = cur.fetchone()[0]

            stage, h = stage_csv(cur, feed, "agency.txt")
            insert_select(cur, "gtfs_agencies",
                ["agency_id","agency_name","agency_url","agency_timezone","agency_lang","agency_phone","agency_fare_url","agency_email"],
                [col(h,"agency_id"),col(h,"agency_name"),col(h,"agency_url"),col(h,"agency_timezone"),col(h,"agency_lang"),col(h,"agency_phone"),col(h,"agency_fare_url"),col(h,"agency_email")],stage,feed_id)

            if "calendar.txt" in feed.members:
                stage,h=stage_csv(cur,feed,"calendar.txt")
                columns=["service_id","monday","tuesday","wednesday","thursday","friday","saturday","sunday","start_date","end_date"]
                expressions=[col(h,"service_id")]+[col(h,k,"boolean") for k in columns[1:8]]+[datecol(h,"start_date"),datecol(h,"end_date")]
                insert_select(cur,"gtfs_services",columns,expressions,stage,feed_id)
            else:
                cur.execute("CREATE TEMP TABLE st_calendar_dates (service_id TEXT, date TEXT, exception_type TEXT) ON COMMIT DROP")

            if "calendar_dates.txt" in feed.members:
                stage,h=stage_csv(cur,feed,"calendar_dates.txt")
                cur.execute(sql.SQL("""
                  INSERT INTO gtfs_services(feed_id,service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date)
                  SELECT %s,service_id,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,
                         min(to_date(date,'YYYYMMDD')),max(to_date(date,'YYYYMMDD'))
                  FROM {} GROUP BY service_id ON CONFLICT(feed_id,service_id) DO NOTHING
                """).format(sql.Identifier(stage)),(feed_id,))
                insert_select(cur,"gtfs_calendar_dates",["service_id","service_date","exception_type"],
                    [col(h,"service_id"),datecol(h,"date"),col(h,"exception_type","smallint")],stage,feed_id)

            stage,h=stage_csv(cur,feed,"routes.txt")
            agency = col(h,"agency_id")
            if "agency_id" not in h:
                agency=sql.SQL("(SELECT min(agency_id) FROM gtfs_agencies WHERE feed_id = %s)")
            route_expr=[col(h,"route_id"),agency,col(h,"route_short_name"),col(h,"route_long_name"),col(h,"route_desc"),col(h,"route_type","integer"),col(h,"route_url"),col(h,"route_color"),col(h,"route_text_color"),col(h,"route_sort_order","integer"),col(h,"continuous_pickup","smallint"),col(h,"continuous_drop_off","smallint")]
            if "agency_id" not in h:
                route_expr[1]=sql.SQL("(SELECT min(agency_id) FROM gtfs_agencies WHERE feed_id = %s)")
                q=sql.SQL("INSERT INTO gtfs_routes(feed_id,route_id,agency_id,route_short_name,route_long_name,route_desc,route_type,route_url,route_color,route_text_color,route_sort_order,continuous_pickup,continuous_drop_off) SELECT %s,{} FROM {}").format(sql.SQL(",").join(route_expr),sql.Identifier(stage))
                cur.execute(q,(feed_id,feed_id))
                cur.execute(sql.SQL("DROP TABLE {}").format(sql.Identifier(stage)))
            else:
                insert_select(cur,"gtfs_routes",["route_id","agency_id","route_short_name","route_long_name","route_desc","route_type","route_url","route_color","route_text_color","route_sort_order","continuous_pickup","continuous_drop_off"],route_expr,stage,feed_id)

            stage,h=stage_csv(cur,feed,"stops.txt")
            stop_cols=["stop_id","stop_code","stop_name","stop_desc","stop_lat","stop_lon","zone_id","stop_url","location_type","parent_station","stop_timezone","wheelchair_boarding","level_id","platform_code"]
            stop_expr=[col(h,"stop_id"),col(h,"stop_code"),col(h,"stop_name"),col(h,"stop_desc"),col(h,"stop_lat","double precision"),col(h,"stop_lon","double precision"),col(h,"zone_id"),col(h,"stop_url"),col(h,"location_type","smallint","0::smallint"),col(h,"parent_station"),col(h,"stop_timezone"),col(h,"wheelchair_boarding","smallint"),col(h,"level_id"),col(h,"platform_code")]
            insert_select(cur,"gtfs_stops",stop_cols,stop_expr,stage,feed_id)

            if "shapes.txt" in feed.members:
                stage,h=stage_csv(cur,feed,"shapes.txt")
                cur.execute(sql.SQL("INSERT INTO gtfs_shape_catalog(feed_id,shape_id) SELECT %s, shape_id FROM {} GROUP BY shape_id").format(sql.Identifier(stage)),(feed_id,))
                shape_cols=["shape_id","shape_pt_sequence","shape_pt_lat","shape_pt_lon","shape_dist_traveled"]
                shape_expr=[col(h,"shape_id"),col(h,"shape_pt_sequence","integer"),col(h,"shape_pt_lat","double precision"),col(h,"shape_pt_lon","double precision"),col(h,"shape_dist_traveled","double precision")]
                insert_select(cur,"gtfs_shapes",shape_cols,shape_expr,stage,feed_id)

            stage,h=stage_csv(cur,feed,"trips.txt")
            trip_cols=["trip_id","route_id","service_id","trip_headsign","trip_short_name","direction_id","block_id","shape_id","wheelchair_accessible","bikes_allowed"]
            trip_expr=[col(h,"trip_id"),col(h,"route_id"),col(h,"service_id"),col(h,"trip_headsign"),col(h,"trip_short_name"),col(h,"direction_id","smallint"),col(h,"block_id"),col(h,"shape_id"),col(h,"wheelchair_accessible","smallint"),col(h,"bikes_allowed","smallint")]
            insert_select(cur,"gtfs_trips",trip_cols,trip_expr,stage,feed_id)

            stage,h=stage_csv(cur,feed,"stop_times.txt")
            st_cols=["trip_id","arrival_seconds","departure_seconds","stop_id","stop_sequence","stop_headsign","pickup_type","drop_off_type","shape_dist_traveled","timepoint"]
            st_expr=[col(h,"trip_id"),timecol(h,"arrival_time"),timecol(h,"departure_time"),col(h,"stop_id"),col(h,"stop_sequence","integer"),col(h,"stop_headsign"),col(h,"pickup_type","smallint"),col(h,"drop_off_type","smallint"),col(h,"shape_dist_traveled","double precision"),col(h,"timepoint","smallint","1::smallint")]
            insert_select(cur,"gtfs_stop_times",st_cols,st_expr,stage,feed_id)

            if "fare_attributes.txt" in feed.members:
                stage,h=stage_csv(cur,feed,"fare_attributes.txt")
                fare_cols=["fare_id","price","currency_type","payment_method","transfers","agency_id","transfer_duration"]
                fare_expr=[col(h,"fare_id"),col(h,"price","numeric(10,2)"),col(h,"currency_type"),col(h,"payment_method","smallint"),col(h,"transfers","smallint"),col(h,"agency_id"),col(h,"transfer_duration","integer")]
                insert_select(cur,"gtfs_fare_attributes",fare_cols,fare_expr,stage,feed_id)
            if "fare_rules.txt" in feed.members:
                stage,h=stage_csv(cur,feed,"fare_rules.txt")
                fare_rule_cols=["fare_id","route_id","origin_id","destination_id","contains_id"]
                fare_rule_expr=[col(h,k) for k in fare_rule_cols]
                insert_select(cur,"gtfs_fare_rules",fare_rule_cols,fare_rule_expr,stage,feed_id)
            if "translations.txt" in feed.members:
                stage,h=stage_csv(cur,feed,"translations.txt")
                trans_cols=["table_name","field_name","record_id","language","translation"]
                trans_expr=[col(h,k) for k in trans_cols]
                insert_select(cur,"gtfs_translations",trans_cols,trans_expr,stage,feed_id)
            if "attributions.txt" in feed.members:
                stage,h=stage_csv(cur,feed,"attributions.txt")
                att_cols=["attribution_id","organization_name","is_producer","is_operator","is_authority","attribution_url"]
                att_expr=[col(h,"attribution_id"),col(h,"organization_name"),sql.SQL("COALESCE({},'0')='1'").format(col(h,"is_producer")),sql.SQL("COALESCE({},'0')='1'").format(col(h,"is_operator")),sql.SQL("COALESCE({},'0')='1'").format(col(h,"is_authority")),col(h,"attribution_url")]
                insert_select(cur,"gtfs_attributions",att_cols,att_expr,stage,feed_id)

            cur.execute("UPDATE gtfs_feeds SET is_active=FALSE WHERE is_active")
            cur.execute("UPDATE gtfs_feeds SET is_active=TRUE WHERE feed_id=%s",(feed_id,))
            print(f"Imported feed_id={feed_id}; it is now active. Transaction will commit on success.",flush=True)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, help="GTFS ZIP file or directory containing extracted .txt files")
    parser.add_argument("--dsn", default=None, help="PostgreSQL DSN; otherwise uses standard PG* environment variables")
    args=parser.parse_args()
    feed=Feed(Path(args.source).expanduser())
    try:
        validate_headers(feed)
        import_feed(feed,args.dsn or "")
    except Exception as exc:
        print(f"GTFS import failed; no new feed was activated: {exc}",file=sys.stderr)
        raise
    finally:
        if feed.archive:
            feed.archive.close()


if __name__ == "__main__":
    main()
