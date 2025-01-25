use actix_web::{web, App, HttpServer};
use actix_cors::Cors;
use anyhow::Result;
use sqlx::PgPool;
use tracing::info;

mod error;
mod handlers;
mod models;

#[derive(Clone)]
pub struct AppState {
    db: PgPool,
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
    use sqlx::postgres::PgPoolOptions;

    // In main(), replace the PgPool::connect with:
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(std::time::Duration::from_secs(3))
        .connect(&database_url)
        .await?;

    // Run database migrations
    sqlx::migrate!("./migrations").run(&pool).await?;

    let state = AppState { db: pool };

    info!("Starting server at http://127.0.0.1:8080");

    // Start HTTP server
    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);
        
        App::new()
            .wrap(cors)
            .app_data(web::Data::new(state.clone()))
            .service(
                web::scope("/api")
                    .route("/shorten", web::post().to(handlers::create_short_url))
                    .route("/links", web::get().to(handlers::get_all_links)),
                    
            )
            .service(
                web::resource("/{short_code}")
                    .route(web::get().to(handlers::redirect_to_url))
            )
            .service(web::resource("/{short_code}").route(web::get().to(handlers::redirect_to_url)))
    })
    .workers(2) // Limit worker threads
    .backlog(10_000)
    .bind("127.0.0.1:8080")?
    .run()
    .await?;

    Ok(())
}
