import urllib.request
import sys

try:
    with urllib.request.urlopen('http://127.0.0.1:8000/api/products/') as r:
        print('status', r.getcode())
        print(r.read(800).decode('utf-8', errors='replace'))
except Exception as e:
    print('error', repr(e))
    sys.exit(1)
