# SimpleLink

A very performant and light (2MB in memory) link shortener and tracker. Written in Rust and React and uses Postgres or SQLite.

![MainView](readme_img/mainview.jpg)

![StatsView](readme_img/statview.jpg)

## How to Run

### From Docker:

```bash
docker run -p 8080:8080 \
    -e JWT_SECRET=change-me-in-production \
    -e SIMPLELINK_USER=admin@example.com \
    -e SIMPLELINK_PASS=your-secure-password \
    -v simplelink_data:/data \
    ghcr.io/waveringana/simplelink:v2.1
```

### Environment Variables

- `JWT_SECRET`: Required. Used for JWT token generation
- `SIMPLELINK_USER`: Optional. If set along with SIMPLELINK_PASS, creates an admin user on first run
- `SIMPLELINK_PASS`: Optional. Admin user password
- `DATABASE_URL`: Optional. Postgres connection string. If not set, uses SQLite
- `INITIAL_LINKS`: Optional. Semicolon-separated list of initial links in format "url,code;url2,code2"
- `SERVER_HOST`: Optional. Default: "127.0.0.1"
- `SERVER_PORT`: Optional. Default: "8080"

If `SIMPLELINK_USER` and `SIMPLELINK_PASS` are not passed, an admin-setup-token is pasted to the console and as a text file in the project root.

### From Docker Compose:

Edit the docker-compose.yml file. It comes included with a PostgreSQL db configuration.

## Build

### From Source

First configure .env.example and save it to .env

```bash
git clone https://github.com/waveringana/simplelink && cd simplelink
./build.sh
cargo run
```

Alternatively for a binary build:

```bash
./build.sh --binary
```

then check /target/release for the binary named `SimpleGit`

### From Docker

```bash
docker build -t simplelink .
docker run -p 8080:8080 \
    -e JWT_SECRET=change-me-in-production \
    -e SIMPLELINK_USER=admin@example.com \
    -e SIMPLELINK_PASS=your-secure-password \
    -v simplelink_data:/data \
    simplelink
```

### From Docker Compose

Adjust the included docker-compose.yml to your liking; it includes a postgres config as well.

## Features

- Support for both PostgreSQL and SQLite databases
- Initial links can be configured via environment variables
- Admin user can be created on first run via environment variables
- Link click tracking and statistics
- Lightweight and performant
