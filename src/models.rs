use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Deserialize)]
pub struct CreateLink {
    pub url: String,
    pub source: Option<String>,
    pub custom_code: Option<String>,
}

#[derive(Serialize, FromRow)]
pub struct Link {
    pub id: i32,
    pub user_id: i32,
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
