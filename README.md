# VU Progression API

> [!NOTE]
> This repository is for development and the few who would like to host their own private master server.\
> \
> If you would like your VU server to be included in public global progression, please visit [this wiki page](https://github.com/redthirten/vu-progression-api/wiki/Public-Global-Progression).

A global progression master API server for tracking and providing player progression in [Venice Unleashed (VU)](https://veniceunleashed.net/) servers via the [vu-progression](https://github.com/thysw95/vu-progression) mod.

Built with **Node.js**, **Express**, and **MySQL**, it provides structured endpoints for retrieving player statistics and progression data, as well as accepting POST requests of new data from authorized servers.

---

## Features

- 🚀 RESTful API endpoints
- 🗄️ MySQL-backed storage for progression data
- ⚡ Connection pooling for efficient queries
- 🛡️ Token & Server GUID based security — Only authorized servers can POST new data
- 📜 Structured logging to file (rotated daily)

## Requirements

- [Node.js](https://nodejs.org/) (v18+ recommended)  
- [MySQL](https://dev.mysql.com/) (5.7+ or MariaDB)  
- [VU](https://veniceunleashed.net/) server(s) with [vu-progression](https://github.com/thysw95/vu-progression) mod installed (optional, but intended use-case)

## Setup & Deployment

### With Docker Compose (Recommended):

1. Download `docker-compose.yml` and `.env.example`
2. Rename `.env.example` to `.env`, and configure variables
3. Start services with `docker compose up -d --force-recreate`
4. Add authorized VU server(s):
```bash
# Find container name
docker ps
# Runs interactive script in container to add authorized server. Repeat for additional servers.
docker exec -it <container_name> npm run add-server
```

### With NPM:

#### 1. Clone the repository
```bash
git clone https://github.com/redthirten/vu-progression-api.git
cd vu-progression-api
```

#### 2. Install dependencies
```bash
npm install --production
```

#### 3. Configure environment
Make a working copy of the example environment file and set your MySQL credentials:
```bash
cp .env.example .env
```

#### 4. Add authorized VU server(s)
Run the following command and follow the on-screen instructions to add a VU server that will be authorized to write to the global progression database. Repeat for additional servers.
```bash
npm run add-server
```

#### 5. Run the server
```bash
npm start
```
API should now be available at:
```
http://localhost:3000
```

## Usage

Clients of the API are intended to be individual VU servers running the vu-progression mod, but additional client opportunities are possible (like websites, bots, etc.). API endpoints are detailed in the [Wiki](https://github.com/redthirten/vu-progression-api/wiki/API-Endpoints).

## Roadmap
- [ ] More granular read/write endpoints for player progression
- [ ] Add more tracked data (req. addl. mod development)
- [ ] Administration endpoints for managing authorized servers / automated token generation

## Development
Start in dev mode with auto-reload:
```bash
# Install additional dev packages
npm install

npm run dev
```

Example call to update player data:
```bash
curl -X POST localhost:3000/players/[guid] \
    -H "Content-Type: application/json" \
    -H "X-API-TOKEN: [token]" \
    -H "X-SERVER-GUID: [server_guid]" \
    -d '{
            "name": "Test",
            "guid": 123,
            "kills": 1,
            "deaths": 2,
            "total_level": 3,
            "total_xp": 4,
            "assault_level": 5,
            "assault_xp": 6,
            "engineer_level": 7,
            "engineer_xp": 8,
            "support_level": 9,
            "support_xp": 10,
            "recon_level": 11,
            "recon_xp": 12,
            "weapon_progression": "M16A4,5",
            "vehicle_progression": "Jets,101"
        }'
```

## License
GNU AGPLv3. See [LICENSE](./LICENSE) for details.

---
