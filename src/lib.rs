use sqlx::PgPool;

pub mod auth;
pub mod error;
pub mod handlers;
pub mod models;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
}
