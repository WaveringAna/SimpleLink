use anyhow::Result;
use rand::Rng;
use sqlx::migrate::MigrateDatabase;
use sqlx::postgres::PgPoolOptions;
use sqlx::{Postgres, Sqlite};
use std::fs::File;
use std::io::Write;
use tracing::info;

use models::DatabasePool;

pub mod auth;
pub mod error;
pub mod handlers;
pub mod models;

#[derive(Clone)]
pub struct AppState {
    pub db: DatabasePool,
    pub admin_token: Option<String>,
}

pub async fn create_db_pool() -> Result<DatabasePool> {
    let database_url = std::env::var("DATABASE_URL").ok();

    match database_url {
        Some(url) if url.starts_with("postgres://") => {
            info!("Using PostgreSQL database");
            let pool = PgPoolOptions::new()
                .max_connections(5)
                .acquire_timeout(std::time::Duration::from_secs(3))
                .connect(&url)
                .await?;

            Ok(DatabasePool::Postgres(pool))
        }
        _ => {
            info!("No PostgreSQL connection string found, using SQLite");

            // Create a data directory if it doesn't exist
            let data_dir = std::path::Path::new("data");
            if !data_dir.exists() {
                std::fs::create_dir_all(data_dir)?;
            }

            let db_path = data_dir.join("simplelink.db");
            let sqlite_url = format!("sqlite://{}", db_path.display());

            // Check if database exists and create it if it doesn't
            if !Sqlite::database_exists(&sqlite_url).await.unwrap_or(false) {
                info!("Creating new SQLite database at {}", db_path.display());
                Sqlite::create_database(&sqlite_url).await?;
                info!("Database created successfully");
            } else {
                info!("Database already exists");
            }

            let pool = sqlx::sqlite::SqlitePoolOptions::new()
                .max_connections(5)
                .connect(&sqlite_url)
                .await?;

            Ok(DatabasePool::Sqlite(pool))
        }
    }
}

pub async fn run_migrations(pool: &DatabasePool) -> Result<()> {
    match pool {
        DatabasePool::Postgres(pool) => {
            // Use the root migrations directory for postgres
            sqlx::migrate!().run(pool).await?;
        }
        DatabasePool::Sqlite(pool) => {
            sqlx::migrate!("./migrations/sqlite").run(pool).await?;
        }
    }
    Ok(())
}

pub async fn check_and_generate_admin_token(db: &DatabasePool) -> anyhow::Result<Option<String>> {
    // Check if any users exist
    let user_count = match db {
        DatabasePool::Postgres(pool) => {
            let mut tx = pool.begin().await?;
            let count = sqlx::query_as::<Postgres, (i64,)>("SELECT COUNT(*)::bigint FROM users")
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
        // Generate a random token using simple characters
        let token: String = (0..32)
            .map(|_| {
                let idx = rand::thread_rng().gen_range(0..62);
                match idx {
                    0..=9 => (b'0' + idx as u8) as char,
                    10..=35 => (b'a' + (idx - 10) as u8) as char,
                    _ => (b'A' + (idx - 36) as u8) as char,
                }
            })
            .collect();

        // Save token to file
        let mut file = File::create("admin-setup-token.txt")?;
        writeln!(file, "{}", token)?;

        info!("No users found - generated admin setup token");
        info!("Token has been saved to admin-setup-token.txt");
        info!("Use this token to create the admin user");
        info!("Admin setup token: {}", token);

        Ok(Some(token))
    } else {
        Ok(None)
    }
}
