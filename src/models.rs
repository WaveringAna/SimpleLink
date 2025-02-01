use anyhow::Result;
use futures::future::BoxFuture;
use serde::{Deserialize, Serialize};
use sqlx::postgres::PgRow;
use sqlx::sqlite::SqliteRow;
use sqlx::FromRow;
use sqlx::Pool;
use sqlx::Postgres;
use sqlx::Sqlite;
use sqlx::Transaction;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Clone)]
pub enum DatabasePool {
    Postgres(Pool<Postgres>),
    Sqlite(Pool<Sqlite>),
}

impl DatabasePool {
    pub async fn begin(&self) -> Result<Box<dyn std::any::Any + Send>> {
        match self {
            DatabasePool::Postgres(pool) => Ok(Box::new(pool.begin().await?)),
            DatabasePool::Sqlite(pool) => Ok(Box::new(pool.begin().await?)),
        }
    }

    pub async fn fetch_optional<T>(&self, pg_query: &str, sqlite_query: &str) -> Result<Option<T>>
    where
        T: for<'r> FromRow<'r, PgRow> + for<'r> FromRow<'r, SqliteRow> + Send + Sync + Unpin,
    {
        match self {
            DatabasePool::Postgres(pool) => {
                Ok(sqlx::query_as(pg_query).fetch_optional(pool).await?)
            }
            DatabasePool::Sqlite(pool) => {
                Ok(sqlx::query_as(sqlite_query).fetch_optional(pool).await?)
            }
        }
    }

    pub async fn execute(&self, pg_query: &str, sqlite_query: &str) -> Result<()> {
        match self {
            DatabasePool::Postgres(pool) => {
                sqlx::query(pg_query).execute(pool).await?;
                Ok(())
            }
            DatabasePool::Sqlite(pool) => {
                sqlx::query(sqlite_query).execute(pool).await?;
                Ok(())
            }
        }
    }

    pub async fn transaction<'a, F, R>(&'a self, f: F) -> Result<R>
    where
        F: for<'c> Fn(&'c mut Transaction<'_, Postgres>) -> BoxFuture<'c, Result<R>>
            + for<'c> Fn(&'c mut Transaction<'_, Sqlite>) -> BoxFuture<'c, Result<R>>
            + Copy,
        R: Send + 'static,
    {
        match self {
            DatabasePool::Postgres(pool) => {
                let mut tx = pool.begin().await?;
                let result = f(&mut tx).await?;
                tx.commit().await?;
                Ok(result)
            }
            DatabasePool::Sqlite(pool) => {
                let mut tx = pool.begin().await?;
                let result = f(&mut tx).await?;
                tx.commit().await?;
                Ok(result)
            }
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: i32, // user id
    pub exp: usize,
}

impl Claims {
    pub fn new(user_id: i32) -> Self {
        let exp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as usize
            + 24 * 60 * 60; // 24 hours from now

        Self { sub: user_id, exp }
    }
}

#[derive(Deserialize)]
pub struct CreateLink {
    pub url: String,
    pub source: Option<String>,
    pub custom_code: Option<String>,
}

#[derive(Serialize, FromRow)]
pub struct Link {
    pub id: i32,
    pub user_id: Option<i32>,
    pub original_url: String,
    pub short_code: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub clicks: i64,
}

#[derive(Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
    pub admin_token: Option<String>,
}

#[derive(Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: UserResponse,
}

#[derive(Serialize)]
pub struct UserResponse {
    pub id: i32,
    pub email: String,
}

#[derive(FromRow)]
pub struct User {
    pub id: i32,
    pub email: String,
    pub password_hash: String,
}

#[derive(sqlx::FromRow, Serialize)]
pub struct ClickStats {
    pub date: String,
    pub clicks: i64,
}

#[derive(sqlx::FromRow, Serialize)]
pub struct SourceStats {
    pub date: String,
    pub source: String,
    pub count: i64,
}
