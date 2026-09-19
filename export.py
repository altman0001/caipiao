import sqlite3, json, os

DB="caipiao.db"
OUTS=["webapp/src/data.js","h5/src/common/data.js"]

con=sqlite3.connect(DB)
con.row_factory=sqlite3.Row

def pad5(i): return f"{int(i):05d}"

ssq={
    "name":"双色球","desc":"每期从1-33选6个红球 + 1-33库1-16选1个蓝球",
    "mainRange":33,"mainCount":6,"extraCount":1,"extraRange":16,
    "draws":[]
}
dlt={
    "name":"大乐透","desc":"每期从1-35选5个前区 + 1-12选2个后区",
    "mainRange":35,"mainCount":5,"extraCount":2,"extraRange":12,
    "draws":[]
}

for r in con.execute("SELECT * FROM ssq_draws ORDER BY date ASC, issue ASC"):
    ssq["draws"].append({
        "i": pad5(r["issue"]), "d": r["date"],
        "m":[r["r1"],r["r2"],r["r3"],r["r4"],r["r5"],r["r6"]],
        "x":[r["blue"]],
        "p":[r["pool"],r["j1_cnt"],r["j1_prize"],r["j2_cnt"],r["j2_prize"],r["sales"]]
    })

for r in con.execute("SELECT * FROM dlt_draws ORDER BY date ASC, issue ASC"):
    dlt["draws"].append({
        "i": pad5(r["issue"]), "d": r["date"],
        "m":[r["f1"],r["f2"],r["f3"],r["f4"],r["f5"]],
        "x":[r["b1"],r["b2"]],
        "p":[r["pool"],r["j1_cnt"],r["j1_prize"],r["j2_cnt"],r["j2_prize"],r["sales"]]
    })

meta={"sources":"datachart.500.com","build_date":"2026-09-14",
      "ssq_total":len(ssq["draws"]),"dlt_total":len(dlt["draws"])}

payload = ("export const META = "+json.dumps(meta,ensure_ascii=False)+";\n"
           "export const DATA = { ssq: "+json.dumps(ssq,ensure_ascii=False)+", dlt: "+json.dumps(dlt,ensure_ascii=False)+" };\n")

for OUT in OUTS:
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT,"w",encoding="utf-8") as f:
        f.write(payload)
    print("wrote", OUT, "ssq", len(ssq["draws"]), "dlt", len(dlt["draws"]), "size", os.path.getsize(OUT)//1024, "KB")