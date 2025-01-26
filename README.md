# SimpleLink

A modern link shortening and tracking service built with Rust and React.

## Features

- 🔗 Link shortening with custom codes
- 📊 Click tracking and analytics
- 🔒 User authentication
- 📱 Responsive design
- 🌓 Dark/light mode
- 📈 Source attribution tracking

## Tech Stack

### Backend
- Rust
- Actix-web
- SQLx
- PostgreSQL
- JWT Authentication

### Frontend
- React
- TypeScript
- Tailwind CSS
- Shadcn/ui
- Vite
- Recharts

## Development Setup

### Prerequisites
- Rust (latest stable)
- Bun (or Node.js)
- PostgreSQL
- Docker (optional)

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL=postgres://user:password@localhost:5432/simplelink
SERVER_HOST=127.0.0.1
SERVER_PORT=3000
JWT_SECRET=your-secret-key
```

#### Frontend Environment Files

Development (.env.development):
```env
VITE_API_URL=http://localhost:3000
```

Production (.env.production):
```env
VITE_API_URL=https://your-production-domain.com
```

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/simplelink.git
cd simplelink
```

2. Set up the database:
```bash
psql -U postgres
CREATE DATABASE simplelink;
```

3. Run database migrations:
```bash
cargo run --bin migrate
```

4. Start the backend server:
```bash
cargo run
```

5. In a new terminal, start the frontend development server:
```bash
cd frontend
bun install
bun run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### Building for Production

Use the build script to create a production build:
```bash
./build.sh
```

This will:
1. Build the frontend with production settings
2. Copy static files to the correct location
3. Prepare everything for deployment

You can override the API URL during build:
```bash
VITE_API_URL=https://api.yoursite.com ./build.sh
```

### Docker Deployment

Build and run using Docker Compose:
```bash
docker-compose up --build
```

Or build and run the containers separately:
```bash
# Build the image
docker build -t simplelink .

# Run the container
docker run -p 3000:3000 \
  -e DATABASE_URL=postgres://user:password@db:5432/simplelink \
  -e JWT_SECRET=your-secret-key \
  simplelink
```

## Project Structure

```
simplelink/
├── src/                    # Rust backend code
│   ├── handlers/          # Request handlers
│   ├── models/           # Database models
│   └── main.rs           # Application entry point
├── migrations/            # Database migrations
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── api/         # API client
│   │   └── types/       # TypeScript types
│   └── vite.config.ts    # Vite configuration
├── static/               # Built frontend files (generated)
├── Cargo.toml            # Rust dependencies
├── docker-compose.yml    # Docker composition
└── build.sh             # Build script
```

## API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/shorten` - Create short link
- `GET /api/links` - Get all user links
- `DELETE /api/links/{id}` - Delete link
- `GET /api/links/{id}/clicks` - Get click statistics
- `GET /api/links/{id}/sources` - Get source statistics
- `GET /{short_code}` - Redirect to original URL

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
