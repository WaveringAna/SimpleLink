use crate::{error::AppError, models::Claims};
use actix_web::{dev::Payload, FromRequest, HttpRequest};
use jsonwebtoken::{decode, DecodingKey, Validation};
use std::future::{ready, Ready};

pub struct AuthenticatedUser {
    pub user_id: i32,
}

impl FromRequest for AuthenticatedUser {
    type Error = AppError;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &HttpRequest, _: &mut Payload) -> Self::Future {
        let auth_header = req
            .headers()
            .get("Authorization")
            .and_then(|h| h.to_str().ok());

        if let Some(auth_header) = auth_header {
            if auth_header.starts_with("Bearer ") {
                let token = &auth_header[7..];
                let secret =
                    std::env::var("JWT_SECRET").unwrap_or_else(|_| "default_secret".to_string());
                match decode::<Claims>(
                    token,
                    &DecodingKey::from_secret(secret.as_bytes()),
                    &Validation::default(),
                ) {
                    Ok(token_data) => {
                        return ready(Ok(AuthenticatedUser {
                            user_id: token_data.claims.sub,
                        }));
                    }
                    Err(_) => return ready(Err(AppError::Unauthorized)),
                }
            }
        }
        ready(Err(AppError::Unauthorized))
    }
}

