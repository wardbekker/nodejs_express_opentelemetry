How to run:

````bash
npm install
node index.js
````

Configure the Grafana Cloud user account. Replace username/password in agent.yml with the real values.

```yaml
    push_config:
      endpoint: tempo-us-central1.grafana.net:443
      basic_auth:
        username: '${GC_USER_ID}'
        password: '${GC_API_KEY}'
```

Run the grafana agent for the Jaeger collector:

```bash
./agent-darwin-amd64 --config.file=agent.yml
```

How to create a test trace:

```bash
curl http://localhost:8080
```
