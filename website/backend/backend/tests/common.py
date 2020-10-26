import json

def get(client, url, status=200):
    response = client.get(url)
    assert response.status_code == status
    return json.loads(response.data)

def post(client, url, data, status=200):
    response = client.post(url, data=json.dumps(data))
    assert response.status_code == status
    return json.loads(response.data)
