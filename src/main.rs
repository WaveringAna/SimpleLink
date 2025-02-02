use actix_cors::Cors;
use actix_web::{web, App, HttpResponse, HttpServer};
use anyhow::Result;
use clap::Parser;
use rust_embed::RustEmbed;
use simplelink::check_and_generate_admin_token;
use simplelink::models::DatabasePool;
use simplelink::{create_db_pool, run_migrations};
use simplelink::{handlers, AppState};
use sqlx::{Postgres, Sqlite};
use tracing::{error, info};

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
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

async fn create_initial_links(pool: &DatabasePool) -> Result<()> {
    if let Ok(links) = std::env::var("INITIAL_LINKS") {
        for link_entry in links.split(';') {
            let parts: Vec<&str> = link_entry.split(',').collect();
            if parts.len() >= 2 {
                let url = parts[0];
                let code = parts[1];

                match pool {
                    DatabasePool::Postgres(pool) => {
                        sqlx::query(
                            "INSERT INTO links (original_url, short_code, user_id)  
                             VALUES ($1, $2, $3) 
                             ON CONFLICT (short_code) 
                             DO UPDATE SET short_code = EXCLUDED.short_code
                             WHERE links.original_url = EXCLUDED.original_url",
                        )
                        .bind(url)
                        .bind(code)
                        .bind(1)
                        .execute(pool)
                        .await?;
                    }
                    DatabasePool::Sqlite(pool) => {
                        // First check if the exact combination exists
                        let exists = sqlx::query_scalar::<_, bool>(
                            "SELECT EXISTS(
                                SELECT 1 FROM links 
                                WHERE original_url = ?1 
                                AND short_code = ?2
                            )",
                        )
                        .bind(url)
                        .bind(code)
                        .fetch_one(pool)
                        .await?;

                        // Only insert if the exact combination doesn't exist
                        if !exists {
                            sqlx::query(
                                "INSERT INTO links (original_url, short_code, user_id) 
                                 VALUES (?1, ?2, ?3)",
                            )
                            .bind(url)
                            .bind(code)
                            .bind(1)
                            .execute(pool)
                            .await?;
                            info!("Created initial link: {} -> {} for user_id: 1", code, url);
                        } else {
                            info!("Skipped existing link: {} -> {} for user_id: 1", code, url);
                        }
                    }
                }
            }
        }
    }
    Ok(())
}

async fn create_admin_user(pool: &DatabasePool, email: &str, password: &str) -> Result<()> {
    use argon2::{
        password_hash::{rand_core::OsRng, SaltString},
        Argon2, PasswordHasher,
    };

    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| anyhow::anyhow!("Password hashing error: {}", e))?
        .to_string();

    match pool {
        DatabasePool::Postgres(pool) => {
            sqlx::query(
                "INSERT INTO users (email, password_hash) 
                 VALUES ($1, $2) 
                 ON CONFLICT (email) DO NOTHING",
            )
            .bind(email)
            .bind(&password_hash)
            .execute(pool)
            .await?;
        }
        DatabasePool::Sqlite(pool) => {
            sqlx::query(
                "INSERT OR IGNORE INTO users (email, password_hash) 
                 VALUES (?1, ?2)",
            )
            .bind(email)
            .bind(&password_hash)
            .execute(pool)
            .await?;
        }
    }
    info!("Created admin user: {}", email);
    Ok(())
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

    // First check if admin credentials are provided in environment variables
    let admin_credentials = match (
        std::env::var("SIMPLELINK_USER"),
        std::env::var("SIMPLELINK_PASS"),
    ) {
        (Ok(user), Ok(pass)) => Some((user, pass)),
        _ => None,
    };

    if let Some((email, password)) = admin_credentials {
        // Now check for existing users
        let user_count = match &pool {
            DatabasePool::Postgres(pool) => {
                let mut tx = pool.begin().await?;
                let count =
                    sqlx::query_as::<Postgres, (i64,)>("SELECT COUNT(*)::bigint FROM users")
                        .fetch_one(&mut *tx)
                        .await?
                        .0;
                tx.commit().await?;
                count
            }
            DatabasePool::Sqlite(pool) => {
                let mut tx = pool.begin().await?;
                let count = sqlx::query_as::<Sqlite, (i64,)>("SELECT COUNT(*) FROM users")
                    .fetch_one(&mut *tx)
                    .await?
                    .0;
                tx.commit().await?;
                count
            }
        };

        if user_count == 0 {
            info!("No users found, creating admin user: {}", email);
            match create_admin_user(&pool, &email, &password).await {
                Ok(_) => info!("Successfully created admin user"),
                Err(e) => {
                    error!("Failed to create admin user: {}", e);
                    return Err(anyhow::anyhow!("Failed to create admin user: {}", e));
                }
            }
        }
    } else {
        info!(
            "No admin credentials provided in environment variables, skipping admin user creation"
        );
    }

    // Create initial links from environment variables
    create_initial_links(&pool).await?;

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
                    .route("/links/{id}", web::patch().to(handlers::edit_link))
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
