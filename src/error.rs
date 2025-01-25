use actix_web::{HttpResponse, ResponseError};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    
    #[error("Not found")]
    NotFound,
    
    #[error("Invalid input: {0}")]
    InvalidInput(String),
    
    #[error("Authentication error: {0}")]
    Auth(String),
    
    #[error("Unauthorized")]
    Unauthorized,
}

impl ResponseError for AppError {
    fn error_response(&self) -> HttpResponse {
        match self {
            AppError::NotFound => HttpResponse::NotFound().json("Not found"),
            AppError::Database(err) => HttpResponse::InternalServerError().json(format!("Database error: {}", err)),  // Show actual error
            AppError::InvalidInput(msg) => HttpResponse::BadRequest().json(msg),
            AppError::Auth(msg) => HttpResponse::BadRequest().json(msg),
            AppError::Unauthorized => HttpResponse::Unauthorized().json("Unauthorized"),
        }
    }
}