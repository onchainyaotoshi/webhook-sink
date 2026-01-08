# webhook-sink
Webhook-sink adalah layanan ringan untuk menerima dan melihat webhook. Service ini cocok untuk development/testing dengan tampilan sederhana dan realtime update lewat SSE.

## Fitur
- Endpoint `POST /webhook` dibatasi oleh daftar IP yang diizinkan (berbasis env `ALLOWED_IPS`).
- Halaman UI sederhana di `/` untuk melihat event masuk secara realtime.
- Stream SSE di `GET /events`.

## Prasyarat
- Node.js 20+ (untuk run lokal), atau Docker.

## Konfigurasi
Atur environment berikut:
- `ALLOWED_IPS` (wajib): daftar IP yang diizinkan, dipisahkan koma (contoh: `127.0.0.1,::1`).
- `PORT` (opsional): default `3000`.

## Install & Run (lokal)
```bash
npm install
npm run build
ALLOWED_IPS=127.0.0.1 PORT=3000 npm start
```

## Run dengan Docker
```bash
docker build -t webhook-sink .
docker run -p 3000:3000 -e ALLOWED_IPS=127.0.0.1 webhook-sink
```

## Cara Kirim Webhook
Contoh kirim payload JSON ke `/webhook`:
```bash
curl -X POST http://localhost:3000/webhook \
  -H 'Content-Type: application/json' \
  -d '{"event":"hello","value":123}'
```
Pastikan request berasal dari IP yang ada di `ALLOWED_IPS` (misal `127.0.0.1` untuk lokal).

## Lihat Realtime Event
Buka browser ke:
```
http://localhost:3000/
```
