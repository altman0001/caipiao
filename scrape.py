import urllib.request, re, time, sys

UA={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

def decode(raw):
    for e in ('utf-8','gb18030'):
        try: return raw.decode(e)
        except: pass
    return raw.decode('utf-8','ignore')

def clean(x): return re.sub(r'\s+',' ',re.sub(r'<[^>]+>','',x)).strip()

def fetch(url, timeout=50, tries=5):
    for i in range(tries):
        try:
            req=urllib.request.Request(url, headers={**UA,'Referer':'https://datachart.500.com/'})
            raw=urllib.request.urlopen(req, timeout=timeout).read()
            txt=decode(raw)
            if '期号' in txt or 't_tr1' in txt or len(raw)>20000:
                return txt
            print("  [retry] small/err resp, attempt",i,file=sys.stderr)
        except Exception as e:
            print("  [retry] err",e,attempt,i,file=sys.stderr)
        time.sleep(6*(i+1))
    return ""

def parse(raw):
    # data row: issue number is at index 1 (index 0 is a chart flag like '2')
    rows=re.findall(r'<tr[^>]*>(.*?)</tr>', raw, re.S)
    out=[]
    for r in rows:
        tds=[clean(t) for t in re.findall(r'<td[^>]*>(.*?)</td>', r, re.S)]
        if len(tds)>=9 and re.match(r'^\d{4,5}$', tds[1]):
            out.append(tds)
    return out

if __name__=="__main__":
    game=sys.argv[1]; lim=sys.argv[2]
    txt=fetch(f"https://datachart.500.com/{game}/history/newinc/history.php?limit={lim}")
    data=parse(txt)
    print(game,"limit",lim,"rows",len(data))
    if data:
        print("newest", data[0][0], data[0][1], "date", data[0][-1])
        print("oldest", data[-1][0], data[-1][1], "date", data[-1][-1])