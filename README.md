# 🌬️ Air Quality Bot

A Telegram bot that reports real-time **Air Quality Index (AQI)** data for a given city, powered by two independent data sources: [AQICN](https://aqicn.org/api/) and [IQAir](https://www.iqair.com/air-pollution-data-api). The bot is built with Node.js and deployed serverlessly on [Vercel](https://vercel.com).

---

## ✨ Features

- Fetches AQI data from **two sources in parallel** (AQICN & IQAir) for cross-reference.
- Reports AQI level, humidity, temperature, PM1, PM2.5, and PM10 where available.
- Translates raw AQI numbers into human-readable labels (Good → Hazardous).
- Supports both **webhook mode** (Vercel serverless) and **polling mode** (local development).
- Responds to city name queries sent as plain text or slash commands (e.g. `/jakarta`).

---

## 🏗️ Project Structure
air-quality-bot/ ├── constants/ # Shared constants (AQI label definitions) ├── controller/ # Telegram message handler ├── helpers/ # AQI utility functions (e.g. number → label) ├── services/ # External API integrations (AQICN, IQAir) ├── tests/ # Jest unit tests ├── server.js # Entry point – bot + Express server setup ├── vercel.json # Vercel deployment configuration └── package.json


---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **npm**
- A Telegram bot token (from [@BotFather](https://t.me/BotFather))
- API keys for [AQICN](https://aqicn.org/data-platform/token/) and [IQAir](https://www.iqair.com/air-pollution-data-api)

### Installation

```bash
git clone https://github.com/your-username/air-quality-bot.git
cd air-quality-bot
npm install
```

### Environment Variables
Create a `.env` file in the project root:

# Telegram
TELEGRAM_TOKEN=your_telegram_bot_token

# AQICN
AQICN_TOKEN=your_aqicn_api_token
# JSON map of query name → AQICN station ID
AQICN_MAPPING={"jakarta":"station-id-here"}

# IQAir
IQAIR_TOKEN=your_iqair_api_token
# JSON map of query name → { city, state, country }
IQAIR_MAPPING={"jakarta":{"city":"Jakarta","state":"Jakarta","country":"Indonesia"}}

# Set to "true" to run locally via long-polling instead of webhook
IS_LOCAL=true

Note: AQICN_MAPPING and IQAIR_MAPPING are JSON strings that map the city keyword (as typed by the user) to the corresponding station/location identifiers used by each API.### Running Locally``` bash

### Running Locally
npm start

With IS_LOCAL=true, the bot will use long-polling — no public URL or webhook setup is required.
 
☁️ Deployment (Vercel)
The project is pre-configured for Vercel serverless deployment.``` bash
vercel deploy
```

After deploying, register your webhook with Telegram:```
https://api.telegram.org/bot<TELEGRAM_TOKEN>/setWebhook?url=https://<your-vercel-domain>/api/bot
```

The bot listens for POST /api/bot from Telegram and exposes a health-check at GET /api/bot.
 
🤖 Usage
Send any city name to the bot in Telegram:``` 
jakarta
```

or as a command:```
/jakarta
```

The bot replies with AQI data from both sources (when available):``` 
[AQICN] Data from Jakarta Station
Current AQI: 87 (Moderate)
Humidity: 72%
Temperature: 31°C
PM2.5: 63 (Moderate)

[IQAIR] Data from jakarta
Current AQI: 91 (Moderate)
Humidity: 72%
Temperature: 31°C
```

AQI Labels
AQI Range
Label
0 – 50
Good
51 – 100
Moderate
101 – 150
Unhealthy for Sensitive Groups
151 – 200
Unhealthy
201 – 300
Very Unhealthy
300+
Hazardous
```

🧪 Testing
``` bash
npm test
```

Tests are written with Jest and cover the controller, services, and helpers.
 
📦 Key Dependencies
Package
Purpose
grammy
Telegram Bot framework
express
HTTP server for webhook handling
axios
HTTP client for external API calls
dotenv
Environment variable management
 
📄 License
This project is licensed under the terms found in the LICENSE file.```