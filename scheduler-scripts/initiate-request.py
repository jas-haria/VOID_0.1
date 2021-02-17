import http.client
import json
import socket

import config

conn = http.client.HTTPSConnection(config.auth0_domain)

payload = json.dumps({
    "client_id": config.auth0_client_id,
    "client_secret": config.auth0_client_secret,
    "audience": config.auth0_api_audience,
    "grant_type": "client_credentials"
})

headers = {'content-type': "application/json"}

conn.request("POST", "/oauth/token", payload, headers)

res = conn.getresponse()
data = res.read()

auth0_response = json.loads(data.decode(config.encoding))

conn = http.client.HTTPConnection(config.api_host)

headers = {'authorization': "Bearer " + auth0_response['access_token']}

conn.request("GET", config.api_endpoint, headers=headers)