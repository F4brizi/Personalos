import urllib.request
import json
try:
    req = urllib.request.urlopen('http://localhost:8000/api/v1/weather/logs')
    data = json.loads(req.read())
    for d in data[:5]:
        print(f"{d['log_date']} - {d['location']['name']} - Min: {d['temperature_min']}, Max: {d['temperature_max']}")
except Exception as e:
    print(e)
