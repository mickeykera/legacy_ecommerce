import urllib.request
import sys

url = 'http://127.0.0.1:8000/'
try:
    with urllib.request.urlopen(url, timeout=5) as r:
        print('STATUS', r.getcode())
        # Print final URL after redirects
        print('URL', r.geturl())
        print('BODY', r.read(800).decode('utf-8', errors='replace'))
except Exception as e:
    print('ERROR', repr(e))
    sys.exit(1)
