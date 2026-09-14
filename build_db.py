import sqlite3, time, sys
import scrape

DB = "caipiao.db"

SSQ_FIELDS = ["issue","date","r1","r2","r3","r4","r5","r6","blue",
              "pool","j1_cnt","j1_prize","j2_cnt","j2_prize","sales"]
DLT_FIELDS = ["issue","date","f1","f2","f3","f4","f5","b1","b2",
              "pool","j1_cnt","j1_prize","j2_cnt","j2_prize","sales"]

def num(s):
    s=(s or "").replace(",","").strip()
    if s in ("","—","-","&nbsp;"):
        return None
    try: return int(s)
    except: return None

def parse_ssq(tds):
    return dict(issue=tds[1], date=tds[16],
                rs=[int(x) for x in tds[2:8]], blue=int(tds[8]),
                pool=num(tds[10]), j1_cnt=num(tds[11]), j1_prize=num(tds[12]),
                j2_cnt=num(tds[13]), j2_prize=num(tds[14]), sales=num(tds[15]))

def parse_dlt(tds):
    return dict(issue=tds[1], date=tds[15],
                fs=[int(x) for x in tds[2:7]], bs=[int(x) for x in tds[7:9]],
                pool=num(tds[9]), j1_cnt=num(tds[10]), j1_prize=num(tds[11]),
                j2_cnt=num(tds[12]), j2_prize=num(tds[13]), sales=num(tds[14]))

def create_schema(con):
    cur=con.cursor()
    cur.executescript("""
    DROP TABLE IF EXISTS ssq_draws;
    DROP TABLE IF EXISTS dlt_draws;
    DROP TABLE IF EXISTS meta;
    CREATE TABLE ssq_draws(
        issue TEXT PRIMARY KEY, date TEXT,
        r1 INTEGER,r2 INTEGER,r3 INTEGER,r4 INTEGER,r5 INTEGER,r6 INTEGER, blue INTEGER,
        pool TEXT,j1_cnt TEXT,j1_prize TEXT,j2_cnt TEXT,j2_prize TEXT,sales TEXT
    );
    CREATE TABLE dlt_draws(
        issue TEXT PRIMARY KEY, date TEXT,
        f1 INTEGER,f2 INTEGER,f3 INTEGER,f4 INTEGER,f5 INTEGER,b1 INTEGER,b2 INTEGER,
        pool TEXT,j1_cnt TEXT,j1_prize TEXT,j2_cnt TEXT,j2_prize TEXT,sales TEXT
    );
    CREATE TABLE meta(key TEXT PRIMARY KEY, value TEXT);
    """)

def store(con, game, records):
    cur=con.cursor()
    if game=="ssq":
        tname, fields = "ssq_draws", SSQ_FIELDS
        rows=[(int(r['issue']), r['date'], *r['rs'], r['blue'],
               r['pool'], r['j1_cnt'], r['j1_prize'], r['j2_cnt'], r['j2_prize'], r['sales']) for r in records]
    else:
        tname, fields = "dlt_draws", DLT_FIELDS
        rows=[(int(r['issue']), r['date'], *r['fs'], *r['bs'],
               r['pool'], r['j1_cnt'], r['j1_prize'], r['j2_cnt'], r['j2_prize'], r['sales']) for r in records]
    cur.executemany(f"INSERT OR REPLACE INTO {tname} VALUES ({','.join('?'*len(fields))})", rows)

def main():
    con=sqlite3.connect(DB)
    create_schema(con)
    for game in ("ssq","dlt"):
        txt=scrape.fetch(f"https://datachart.500.com/{game}/history/newinc/history.php?limit=6000")
        raw=scrape.parse(txt)
        records=[parse_ssq(t) if game=="ssq" else parse_dlt(t) for t in raw]
        records.sort(key=lambda r:int(r['issue']))
        store(con, game, records)
        print(f"{game}: {len(records)} rows -> {DB}", file=sys.stderr)
        time.sleep(12)
    con.execute("INSERT OR REPLACE INTO meta VALUES('update_time', datetime('now','localtime'))")
    con.commit()
    cur=con.cursor()
    for t in ("ssq_draws","dlt_draws"):
        cur.execute(f"SELECT COUNT(*), MIN(date), MAX(date) FROM {t}")
        print(t, cur.fetchone())
    con.close()

if __name__=="__main__":
    main()