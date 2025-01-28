use std::time::{SystemTime, UNIX_EPOCH};

use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

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
    pub date: NaiveDate,
    pub clicks: i64,
}

#[derive(sqlx::FromRow, Serialize)]
pub struct SourceStats {
    pub source: String,
    pub count: i64,
}
