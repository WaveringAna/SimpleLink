use actix_web::{web, HttpResponse, Responder, HttpRequest};
use crate::{AppState, error::AppError, models::{CreateLink, Link}};
use regex::Regex;
use lazy_static::lazy_static;

lazy_static! {
    static ref VALID_CODE_REGEX: Regex = Regex::new(r"^[a-zA-Z0-9_-]{1,32}$").unwrap();
}

pub async fn create_short_url(
    state: web::Data<AppState>,
    payload: web::Json<CreateLink>,
    req: HttpRequest,
) -> Result<impl Responder, AppError> {
    validate_url(&payload.url)?;
    
    let short_code = if let Some(ref custom_code) = payload.custom_code {
        validate_custom_code(custom_code)?;
        
        // Check if code is already taken
        if let Some(_) = sqlx::query_as::<_, Link>(
            "SELECT * FROM links WHERE short_code = $1"
        )
        .bind(custom_code)
        .fetch_optional(&state.db)
        .await? {
            return Err(AppError::InvalidInput(
                "Custom code already taken".to_string()
            ));
        }
        
        custom_code.clone()
    } else {
        generate_short_code()
    };
    
    // Start transaction
    let mut tx = state.db.begin().await?;

    let link = sqlx::query_as::<_, Link>(
        "INSERT INTO links (original_url, short_code) VALUES ($1, $2) RETURNING *"
    )
    .bind(&payload.url)
    .bind(&short_code)
    .fetch_one(&mut *tx)
    .await?;

    if let Some(ref source) = payload.source {
        sqlx::query(
            "INSERT INTO clicks (link_id, source) VALUES ($1, $2)"
        )
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
            "This code is reserved and cannot be used".to_string()
        ));
    }
    
    Ok(())
}

fn validate_url(url: &String) -> Result<(), AppError> {
    if url.is_empty() {
        return Err(AppError::InvalidInput("URL cannot be empty".to_string()));
    }
    if !url.starts_with("http://") && !url.starts_with("https://") {
        return Err(AppError::InvalidInput("URL must start with http:// or https://".to_string()));
    }
    Ok(())
}

pub async fn redirect_to_url(
    state: web::Data<AppState>,
    path: web::Path<String>,
    req: HttpRequest,
) -> Result<impl Responder, AppError> {
    let short_code = path.into_inner();
    
    let mut tx = state.db.begin().await?;

    let link = sqlx::query_as::<_, Link>(
        "UPDATE links SET clicks = clicks + 1 WHERE short_code = $1 RETURNING *"
    )
    .bind(&short_code)
    .fetch_optional(&mut *tx)
    .await?;

    match link {
        Some(link) => {
            // Record click with user agent as source
            let user_agent = req.headers()
                .get("user-agent")
                .and_then(|h| h.to_str().ok())
                .unwrap_or("unknown")
                .to_string();

            sqlx::query(
                "INSERT INTO clicks (link_id, source) VALUES ($1, $2)"
            )
            .bind(link.id)
            .bind(user_agent)
            .execute(&mut *tx)
            .await?;

            tx.commit().await?;

            Ok(HttpResponse::TemporaryRedirect()
                .append_header(("Location", link.original_url))
                .finish())
        },
        None => Err(AppError::NotFound),
    }
}

pub async fn get_all_links(
    state: web::Data<AppState>,
) -> Result<impl Responder, AppError> {
    let links = sqlx::query_as::<_, Link>(
        "SELECT * FROM links ORDER BY created_at DESC"
    )
    .fetch_all(&state.db)
    .await?;

    Ok(HttpResponse::Ok().json(links))
}

pub async fn health_check(
    state: web::Data<AppState>,
) -> impl Responder {
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
