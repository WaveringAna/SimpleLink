use actix_cors::Cors;
use actix_web::{web, App, HttpResponse, HttpServer};
use anyhow::Result;
use rust_embed::RustEmbed;
use simplelink::check_and_generate_admin_token;
use simplelink::{create_db_pool, run_migrations};
use simplelink::{handlers, AppState};
use tracing::info;

#[derive(RustEmbed)]
#[folder = "static/"]
struct Asset;

async fn serve_static_file(path: &str) -> HttpResponse {
    match Asset::get(path) {
        Some(content) => {
            let mime = mime_guess::from_path(path).first_or_octet_stream();
            HttpResponse::Ok()
                .content_type(mime.as_ref())
                .body(content.data.into_owned())
        }
        None => HttpResponse::NotFound().body("404 Not Found"),
    }
}

#[actix_web::main]
async fn main() -> Result<()> {
    // Load environment variables from .env file
    dotenv::dotenv().ok();

    // Initialize logging
    tracing_subscriber::fmt::init();

    // Create database connection pool
    let pool = create_db_pool().await?;
    run_migrations(&pool).await?;

    let admin_token = check_and_generate_admin_token(&pool).await?;

    let state = AppState {
        db: pool,
        admin_token,
    };

    let host = std::env::var("SERVER_HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = std::env::var("SERVER_PORT").unwrap_or_else(|_| "8080".to_string());
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
            .app_data(web::Data::new(state.clone()))
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
                    .route(
                        "/auth/check-first-user",
                        web::get().to(handlers::check_first_user),
                    )
                    .route("/health", web::get().to(handlers::health_check)),
            )
            .service(web::resource("/{short_code}").route(web::get().to(handlers::redirect_to_url)))
            .default_service(web::route().to(|req: actix_web::HttpRequest| async move {
                let path = req.path().trim_start_matches('/');
                let path = if path.is_empty() { "index.html" } else { path };
                serve_static_file(path).await
            }))
    })
    .workers(2)
    .backlog(10_000)
    .bind(format!("{}:{}", host, port))?
    .run()
    .await?;

    Ok(())
}
