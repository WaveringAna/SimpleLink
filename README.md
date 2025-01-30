# SimpleLink
A very performant and light (6mb in memory) link shortener and tracker. Written in Rust and React and uses Postgres.

![MainView](readme_img/mainview.jpg)

![StatsView](readme_img/statview.jpg)

## Build

### From Source
First configure .env.example and save it to .env

The project will not run withot DATABASE_URL set. (TODO add sqlite support)

```bash
#set api-domain to where you will be deploying the link shortener, eg: link.example.com, default is localhost:8080
git clone https://github.com/waveringana/simplelink && cd simplelink
./build.sh api-domain=localhost:8080
cargo run
```

On an empty database, an admin-setup-token.txt is created as well as pasted into the terminal output. This is needed to make the admin account.

Alternatively if you want a binary form
```bash
./build.sh --binary
```
then check /target/release for the binary named `SimpleGit`

### From Docker
```bash
docker build --build-arg API_URL=http://localhost:8080 -t simplelink .
docker run -p 8080:8080 \
    -e JWT_SECRET=change-me-in-production \ 
    -e DATABASE_URL=postgres://user:password@host:port/database \ 
    simplelink
```

### From Docker Compose
Adjust the included docker-compose.yml to your liking, it includes a postgres config as well.
