# Kafka Message Producer

A web-based Kafka message producer with a UI for sending messages in three modes:

- **Single** — send one message at a time
- **Count** — send a batch of N messages
- **Interval** — send messages continuously at a set interval

## Quick Start (Docker Compose)

Spins up Zookeeper, Kafka, and the producer UI:

```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000), connect to `localhost:9092`, and start producing.

## Run Locally (without Docker)

Requires a running Kafka broker.

```bash
npm install
npm start
```

Or with auto-reload during development:

```bash
npm run dev
```

## Docker Hub

Pull the pre-built image:

```bash
docker pull <your-dockerhub-user>/kafka-message-producer
docker run -p 3000:3000 <your-dockerhub-user>/kafka-message-producer
```

Build and push:

```bash
docker build -t <your-dockerhub-user>/kafka-message-producer .
docker push <your-dockerhub-user>/kafka-message-producer
```

## API Endpoints

| Method | Path                         | Description                                                             |
| ------ | ---------------------------- | ----------------------------------------------------------------------- |
| POST   | `/api/connect`               | Connect to Kafka (`{ brokers, clientId }`)                              |
| POST   | `/api/disconnect`            | Disconnect from Kafka                                                   |
| POST   | `/api/produce/single`        | Send one message (`{ topic, key?, value, headers? }`)                   |
| POST   | `/api/produce/count`         | Send N messages (`{ topic, key?, value, headers?, count }`)             |
| POST   | `/api/produce/interval`      | Start interval sending (`{ topic, key?, value, headers?, intervalMs }`) |
| POST   | `/api/produce/interval/stop` | Stop interval(s) (`{ intervalId? }`)                                    |
| GET    | `/api/status`                | Connection status & active intervals                                    |

## Environment Variables

| Variable | Default | Description      |
| -------- | ------- | ---------------- |
| `PORT`   | `3000`  | HTTP server port |

## Project Structure

```
├── public/
│   ├── index.html      # UI
│   ├── style.css       # Styles
│   └── app.js          # Frontend logic
├── src/
│   ├── server.js       # Express entry point
│   ├── routes.js       # API routes
│   └── kafkaProducer.js# KafkaJS producer service
├── Dockerfile
├── docker-compose.yml
└── package.json
```
