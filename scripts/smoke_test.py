import urllib.request

url = 'http://127.0.0.1:8000/api/products/'
with urllib.request.urlopen(url) as r:
    print('status', r.getcode())
    body = r.read(800)
    print(body.decode('utf-8', errors='replace'))
