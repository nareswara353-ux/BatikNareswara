use axum::{
    extract::Multipart,
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::post,
    Router,
};
use bytes::Bytes;
use tower_http::cors::CorsLayer;
use tracing::{error, info};

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    info!("Starting Batik Processor microservice...");

    // Build router
    let app = Router::new()
        .route("/api/compress", post(compress_image))
        .layer(CorsLayer::permissive());

    // Run server
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080")
        .await
        .expect("Failed to bind to 0.0.0.0:8080");

    info!("Server running on http://0.0.0.0:8080");

    axum::serve(listener, app)
        .await
        .expect("Server error");
}

#[derive(Debug)]
enum CompressError {
    InvalidImage(String),
    CompressionFailed(String),
    NoFileProvided,
    IoError(String),
}

impl IntoResponse for CompressError {
    fn into_response(self) -> Response {
        match self {
            CompressError::InvalidImage(msg) => {
                error!("Invalid image: {}", msg);
                (StatusCode::BAD_REQUEST, format!("Invalid image: {}", msg)).into_response()
            }
            CompressError::CompressionFailed(msg) => {
                error!("Compression failed: {}", msg);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Compression failed: {}", msg),
                )
                    .into_response()
            }
            CompressError::NoFileProvided => {
                error!("No file provided in multipart request");
                (
                    StatusCode::BAD_REQUEST,
                    "No file provided in multipart request",
                )
                    .into_response()
            }
            CompressError::IoError(msg) => {
                error!("I/O error: {}", msg);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("I/O error: {}", msg),
                )
                    .into_response()
            }
        }
    }
}

/// Compress image to WebP format
async fn compress_image(mut multipart: Multipart) -> Result<Bytes, CompressError> {
    let mut image_data: Option<Vec<u8>> = None;

    // Extract image file from multipart form data
    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| CompressError::IoError(e.to_string()))?
    {
        let name = field.name().unwrap_or("").to_string();

        // Look for the "image" field
        if name == "image" {
            image_data = Some(
                field
                    .bytes()
                    .await
                    .map_err(|e| CompressError::IoError(e.to_string()))?
                    .to_vec(),
                );
            break;
        }
    }

    let image_data = image_data.ok_or(CompressError::NoFileProvided)?;

    if image_data.is_empty() {
        return Err(CompressError::InvalidImage(
            "Provided image file is empty".to_string(),
        ));
    }

    // 🔥 FIX UTAMA: Menggunakan load_from_memory yang kompatibel dengan image v0.24.
    // Fungsi ini otomatis menebak format gambar & men-decode-nya tanpa butuh ImageReader/Cursor.
    let img = image::load_from_memory(&image_data)
        .map_err(|e| CompressError::InvalidImage(format!("Failed to decode image: {}", e)))?;

    info!(
        "Decoded image: {}x{} pixels",
        img.width(),
        img.height()
    );

    // Convert to RGB8 if necessary
    let rgb_image = img.to_rgb8();

    // Compress to WebP with quality 80
    let webp_data = webp::Encoder::from_rgb(&rgb_image, rgb_image.width(), rgb_image.height())
        .encode(80.0)
        .to_vec();

    info!(
        "Compressed image: {} bytes -> {} bytes ({:.1}% reduction)",
        image_data.len(),
        webp_data.len(),
        (1.0 - webp_data.len() as f64 / image_data.len() as f64) * 100.0
    );

    Ok(Bytes::from(webp_data))
}