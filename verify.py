import sqlite3
con=sqlite3.connect('caipiao.db')
cur=con.cursor()
print('--- SSQ newest 3 ---')
for r in cur.execute("SELECT issue,date,r1,r2,r3,r4,r5,r6,blue FROM ssq_draws ORDER BY date DESC LIMIT 3"): print(r)
print('--- DLT newest 3 ---')
for r in cur.execute("SELECT issue,date,f1,f2,f3,f4,f5,b1,b2 FROM dlt_draws ORDER BY date DESC LIMIT 3"): print(r)
print('--- SSQ oldest ---')
for r in cur.execute("SELECT issue,date,r1,r2,r3,r4,r5,r6,blue FROM ssq_draws ORDER BY date ASC LIMIT 1"): print(r)
print('--- DLT oldest ---')
for r in cur.execute("SELECT issue,date,f1,f2,f3,f4,f5,b1,b2 FROM dlt_draws ORDER BY date ASC LIMIT 1"): print(r)
for t in ('ssq_draws','dlt_draws'):
    n=cur.execute(f"SELECT COUNT(*) FROM (SELECT issue FROM {t} GROUP BY issue HAVING COUNT(*)>1)").fetchone()[0]
    print(t,'duplicate issues:',n)
con.close()
print("OK")