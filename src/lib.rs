use rand::Rng;
use sqlx::PgPool;
use std::fs::File;
use std::io::Write;
use tracing::info;

pub mod auth;
pub mod error;
pub mod handlers;
pub mod models;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub admin_token: Option<String>,
}

pub async fn check_and_generate_admin_token(pool: &sqlx::PgPool) -> anyhow::Result<Option<String>> {
    // Check if any users exist
    let user_count = sqlx::query!("SELECT COUNT(*) as count FROM users")
        .fetch_one(pool)
        .await?
        .count
        .unwrap_or(0);

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
