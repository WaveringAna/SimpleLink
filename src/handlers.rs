use crate::auth::AuthenticatedUser;
use crate::{
    error::AppError,
    models::{
        AuthResponse, Claims, ClickStats, CreateLink, Link, LoginRequest, RegisterRequest,
        SourceStats, User, UserResponse,
    },
    AppState,
};
use actix_web::{web, HttpRequest, HttpResponse, Responder};
use argon2::{
    password_hash::{rand_core::OsRng, SaltString},
    PasswordVerifier,
};
use argon2::{Argon2, PasswordHash, PasswordHasher};
use jsonwebtoken::{encode, EncodingKey, Header};
use lazy_static::lazy_static;
use regex::Regex;

lazy_static! {
    static ref VALID_CODE_REGEX: Regex = Regex::new(r"^[a-zA-Z0-9_-]{1,32}$").unwrap();
}

pub async fn create_short_url(
    state: web::Data<AppState>,
    user: AuthenticatedUser,
    payload: web::Json<CreateLink>,
) -> Result<impl Responder, AppError> {
    tracing::debug!("Creating short URL with user_id: {}", user.user_id);

    validate_url(&payload.url)?;

    let short_code = if let Some(ref custom_code) = payload.custom_code {
        validate_custom_code(custom_code)?;

        tracing::debug!("Checking if custom code {} exists", custom_code);
        // Check if code is already taken
        if let Some(_) = sqlx::query_as::<_, Link>("SELECT * FROM links WHERE short_code = $1")
            .bind(custom_code)
            .fetch_optional(&state.db)
            .await?
        {
            return Err(AppError::InvalidInput(
                "Custom code already taken".to_string(),
            ));
        }

        custom_code.clone()
    } else {
        generate_short_code()
    };

    // Start transaction
    let mut tx = state.db.begin().await?;

    tracing::debug!("Inserting new link with short_code: {}", short_code);
    let link = sqlx::query_as::<_, Link>(
        "INSERT INTO links (original_url, short_code, user_id) VALUES ($1, $2, $3) RETURNING *",
    )
    .bind(&payload.url)
    .bind(&short_code)
    .bind(user.user_id)
    .fetch_one(&mut *tx)
    .await?;

    if let Some(ref source) = payload.source {
        tracing::debug!("Adding click source: {}", source);
        sqlx::query("INSERT INTO clicks (link_id, source) VALUES ($1, $2)")
            .bind(link.id)
            .bind(source)
            .execute(&mut *tx)
            .await?;
    }

    tx.commit().await?;
    Ok(HttpResponse::Created().json(link))
}

fn validate_custom_code(code: &str) -> Result<(), AppError> {
    if !VALID_CODE_REGEX.is_match(code) {
        return Err(AppError::InvalidInput(
            "Custom code must be 1-32 characters long and contain only letters, numbers, underscores, and hyphens".to_string()
        ));
    }

    // Add reserved words check
    let reserved_words = ["api", "health", "admin", "static", "assets"];
    if reserved_words.contains(&code.to_lowercase().as_str()) {
        return Err(AppError::InvalidInput(
            "This code is reserved and cannot be used".to_string(),
        ));
    }

    Ok(())
}

fn validate_url(url: &String) -> Result<(), AppError> {
    if url.is_empty() {
        return Err(AppError::InvalidInput("URL cannot be empty".to_string()));
    }
    if !url.starts_with("http://") && !url.starts_with("https://") {
        return Err(AppError::InvalidInput(
            "URL must start with http:// or https://".to_string(),
        ));
    }
    Ok(())
}

pub async fn redirect_to_url(
    state: web::Data<AppState>,
    path: web::Path<String>,
    req: HttpRequest,
) -> Result<impl Responder, AppError> {
    let short_code = path.into_inner();

    // Extract query source if present
    let query_source = req
        .uri()
        .query()
        .and_then(|q| web::Query::<std::collections::HashMap<String, String>>::from_query(q).ok())
        .and_then(|params| params.get("source").cloned());

    let mut tx = state.db.begin().await?;

    let link = sqlx::query_as::<_, Link>(
        "UPDATE links SET clicks = clicks + 1 WHERE short_code = $1 RETURNING *",
    )
    .bind(&short_code)
    .fetch_optional(&mut *tx)
    .await?;

    match link {
        Some(link) => {
            // Record click with both user agent and query source
            let user_agent = req
                .headers()
                .get("user-agent")
                .and_then(|h| h.to_str().ok())
                .unwrap_or("unknown")
                .to_string();

            sqlx::query("INSERT INTO clicks (link_id, source, query_source) VALUES ($1, $2, $3)")
                .bind(link.id)
                .bind(user_agent)
                .bind(query_source)
                .execute(&mut *tx)
                .await?;

            tx.commit().await?;

            Ok(HttpResponse::TemporaryRedirect()
                .append_header(("Location", link.original_url))
                .finish())
        }
        None => Err(AppError::NotFound),
    }
}

pub async fn get_all_links(
    state: web::Data<AppState>,
    user: AuthenticatedUser,
) -> Result<impl Responder, AppError> {
    let links = sqlx::query_as::<_, Link>(
        "SELECT * FROM links WHERE user_id = $1 ORDER BY created_at DESC",
    )
    .bind(user.user_id)
    .fetch_all(&state.db)
    .await?;

    Ok(HttpResponse::Ok().json(links))
}

pub async fn health_check(state: web::Data<AppState>) -> impl Responder {
    match sqlx::query("SELECT 1").execute(&state.db).await {
        Ok(_) => HttpResponse::Ok().json("Healthy"),
        Err(_) => HttpResponse::ServiceUnavailable().json("Database unavailable"),
    }
}

fn generate_short_code() -> String {
    use base62::encode;
    use uuid::Uuid;

    let uuid = Uuid::new_v4();
    encode(uuid.as_u128() as u64).chars().take(8).collect()
}

pub async fn register(
    state: web::Data<AppState>,
    payload: web::Json<RegisterRequest>,
) -> Result<impl Responder, AppError> {
    // Check if any users exist
    let user_count = sqlx::query!("SELECT COUNT(*) as count FROM users")
        .fetch_one(&state.db)
        .await?
        .count
        .unwrap_or(0);

    // If users exist, registration is closed - no exceptions
    if user_count > 0 {
        return Err(AppError::Auth("Registration is closed".to_string()));
    }

    // Verify admin token for first user
    match (&state.admin_token, &payload.admin_token) {
        (Some(stored_token), Some(provided_token)) if stored_token == provided_token => {
            // Token matches, proceed with registration
        }
        _ => return Err(AppError::Auth("Invalid admin setup token".to_string())),
    }

    // Check if email already exists
    let exists = sqlx::query!("SELECT id FROM users WHERE email = $1", payload.email)
        .fetch_optional(&state.db)
        .await?;

    if exists.is_some() {
        return Err(AppError::Auth("Email already registered".to_string()));
    }

    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(payload.password.as_bytes(), &salt)
        .map_err(|e| AppError::Auth(e.to_string()))?
        .to_string();

    let user = sqlx::query_as!(
        User,
        "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *",
        payload.email,
        password_hash
    )
    .fetch_one(&state.db)
    .await?;

    let claims = Claims::new(user.id);
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "default_secret".to_string());
    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|e| AppError::Auth(e.to_string()))?;

    Ok(HttpResponse::Ok().json(AuthResponse {
        token,
        user: UserResponse {
            id: user.id,
            email: user.email,
        },
    }))
}

pub async fn login(
    state: web::Data<AppState>,
    payload: web::Json<LoginRequest>,
) -> Result<impl Responder, AppError> {
    let user = sqlx::query_as!(User, "SELECT * FROM users WHERE email = $1", payload.email)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::Auth("Invalid credentials".to_string()))?;

    let argon2 = Argon2::default();
    let parsed_hash =
        PasswordHash::new(&user.password_hash).map_err(|e| AppError::Auth(e.to_string()))?;

    if argon2
        .verify_password(payload.password.as_bytes(), &parsed_hash)
        .is_err()
    {
        return Err(AppError::Auth("Invalid credentials".to_string()));
    }

    let claims = Claims::new(user.id);
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "default_secret".to_string());
    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|e| AppError::Auth(e.to_string()))?;

    Ok(HttpResponse::Ok().json(AuthResponse {
        token,
        user: UserResponse {
            id: user.id,
            email: user.email,
        },
    }))
}

pub async fn delete_link(
    state: web::Data<AppState>,
    user: AuthenticatedUser,
    path: web::Path<i32>,
) -> Result<impl Responder, AppError> {
    let link_id = path.into_inner();

    // Start transaction
    let mut tx = state.db.begin().await?;

    // Verify the link belongs to the user
    let link = sqlx::query!(
        "SELECT id FROM links WHERE id = $1 AND user_id = $2",
        link_id,
        user.user_id
    )
    .fetch_optional(&mut *tx)
    .await?;

    if link.is_none() {
        return Err(AppError::NotFound);
    }

    // Delete associated clicks first due to foreign key constraint
    sqlx::query!("DELETE FROM clicks WHERE link_id = $1", link_id)
        .execute(&mut *tx)
        .await?;

    // Delete the link
    sqlx::query!("DELETE FROM links WHERE id = $1", link_id)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;

    Ok(HttpResponse::NoContent().finish())
}

pub async fn get_link_clicks(
    state: web::Data<AppState>,
    user: AuthenticatedUser,
    path: web::Path<i32>,
) -> Result<impl Responder, AppError> {
    let link_id = path.into_inner();

    // Verify the link belongs to the user
    let link = sqlx::query!(
        "SELECT id FROM links WHERE id = $1 AND user_id = $2",
        link_id,
        user.user_id
    )
    .fetch_optional(&state.db)
    .await?;

    if link.is_none() {
        return Err(AppError::NotFound);
    }

    let clicks = sqlx::query_as!(
        ClickStats,
        r#"
        SELECT 
            DATE(created_at)::date as "date!",
            COUNT(*)::bigint as "clicks!"
        FROM clicks
        WHERE link_id = $1
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) ASC  -- Changed from DESC to ASC
        LIMIT 30
        "#,
        link_id
    )
    .fetch_all(&state.db)
    .await?;

    Ok(HttpResponse::Ok().json(clicks))
}

pub async fn get_link_sources(
    state: web::Data<AppState>,
    user: AuthenticatedUser,
    path: web::Path<i32>,
) -> Result<impl Responder, AppError> {
    let link_id = path.into_inner();

    // Verify the link belongs to the user
    let link = sqlx::query!(
        "SELECT id FROM links WHERE id = $1 AND user_id = $2",
        link_id,
        user.user_id
    )
    .fetch_optional(&state.db)
    .await?;

    if link.is_none() {
        return Err(AppError::NotFound);
    }

    let sources = sqlx::query_as!(
        SourceStats,
        r#"
        SELECT 
            query_source as "source!",
            COUNT(*)::bigint as "count!"
        FROM clicks
        WHERE link_id = $1
            AND query_source IS NOT NULL
            AND query_source != ''
        GROUP BY query_source
        ORDER BY COUNT(*) DESC
        LIMIT 10
        "#,
        link_id
    )
    .fetch_all(&state.db)
    .await?;

    Ok(HttpResponse::Ok().json(sources))
}
