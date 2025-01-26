use actix_cors::Cors;
use actix_files::Files;
use actix_web::{middleware::DefaultHeaders, web, App, HttpServer};
use anyhow::Result;
use simplelink::{handlers, AppState};
use sqlx::postgres::PgPoolOptions;
use tracing::info;

async fn index() -> Result<actix_files::NamedFile, actix_web::Error> {
    Ok(actix_files::NamedFile::open("./static/index.html")?)
}

#[actix_web::main]
async fn main() -> Result<()> {
    // Load environment variables from .env file
    dotenv::dotenv().ok();

    // Initialize logging
    tracing_subscriber::fmt::init();

    // Database connection string from environment
    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    // Create database connection pool
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(std::time::Duration::from_secs(3))
        .connect(&database_url)
        .await?;

    // Run database migrations
    sqlx::migrate!("./migrations").run(&pool).await?;

    let _state = AppState { db: pool };

    let host = std::env::var("SERVER_HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = std::env::var("SERVER_PORT").unwrap_or_else(|_| "3000".to_string());
    info!("Starting server at http://{}:{}", host, port);

    // Start HTTP server
    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);

        App::new()
            .wrap(cors)
            // Add headers to help with caching static assets
            .wrap(DefaultHeaders::new().add(("Cache-Control", "max-age=31536000")))
            // API routes
            .service(
                web::scope("/api")
                    .route("/shorten", web::post().to(handlers::create_short_url))
                    .route("/links", web::get().to(handlers::get_all_links))
                    .route("/links/{id}", web::delete().to(handlers::delete_link))
                    .route(
                        "/links/{id}/clicks",
                        web::get().to(handlers::get_link_clicks),
                    )
                    .route(
                        "/links/{id}/sources",
                        web::get().to(handlers::get_link_sources),
                    )
                    .route("/auth/register", web::post().to(handlers::register))
                    .route("/auth/login", web::post().to(handlers::login))
                    .route("/health", web::get().to(handlers::health_check)),
            )
            // Serve static files
            .service(Files::new("/assets", "./static/assets"))
            // Handle SPA routes - must be last
            .default_service(web::get().to(index))
    })
    .bind(format!("{}:{}", host, port))?
    .run()
    .await?;

    Ok(())
}
