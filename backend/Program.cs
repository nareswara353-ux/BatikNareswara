// ...existing code...
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Sockets;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using BatikNareswara.Api.Features.Orders.Commands;
using BatikNareswara.Api.Features.Orders.Repositories;
using BatikNareswara.Api.Features.Orders.Serialization;
using BatikNareswara.Api.Features.Orders.Workers;
using BatikNareswara.Api.Features.SemanticSearch;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

// ────────────────────────────────────────────────────────────────────────
//  1. APPLICATION BOOTSTRAP (Top-Level Statements Harus Paling Atas!)
// ────────────────────────────────────────────────────────────────────────

var builder = WebApplication.CreateBuilder(args);

// CORS: allow common dev origins, with optional broad allow in development via env DEV_ALLOW_ANY_ORIGIN=true
var allowedOrigins = new List<string> { "http://localhost:5173", "http://localhost:3000" };
var extraOrigin =
    builder.Configuration["NEXT_PUBLIC_ORIGIN"]
    ?? Environment.GetEnvironmentVariable("NEXT_PUBLIC_ORIGIN");
if (!string.IsNullOrEmpty(extraOrigin))
    allowedOrigins.Add(extraOrigin);

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowFrontend",
        policy =>
        {
            var allowAny =
                builder.Environment.IsDevelopment()
                && (
                    builder.Configuration["DEV_ALLOW_ANY_ORIGIN"] == "true"
                    || Environment.GetEnvironmentVariable("DEV_ALLOW_ANY_ORIGIN") == "true"
                );
            if (allowAny)
            {
                policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
            }
            else
            {
                policy
                    .WithOrigins(allowedOrigins.ToArray())
                    .AllowAnyMethod()
                    .AllowAnyHeader()
                    .AllowCredentials();
            }
        }
    );
});

// Configure Kestrel port from environment (PORT) or default to 5000 in dev to avoid needing admin for port 80
var portFromEnv = Environment.GetEnvironmentVariable("PORT") ?? builder.Configuration["PORT"];
if (int.TryParse(portFromEnv, out var portNum))
{
    builder.WebHost.ConfigureKestrel(options => options.ListenAnyIP(portNum));
}
else
{
    // Do not force port 80 by default; use 5000 which is more likely to work under git bash without admin.
    builder.WebHost.ConfigureKestrel(options => options.ListenAnyIP(5000));
}

// Database: prefer configured SupabaseConnection; fall back to environment or in-memory for Development so app can start without a real DB
// Prefer in-memory DB during development unless explicitly told to use production DB via USE_PROD_DB=true
var useProdDb =
    (builder.Configuration["USE_PROD_DB"] ?? Environment.GetEnvironmentVariable("USE_PROD_DB"))
    == "true";
var connectionString =
    builder.Configuration.GetConnectionString("SupabaseConnection")
    ?? Environment.GetEnvironmentVariable("ConnectionStrings__SupabaseConnection")
    ?? Environment.GetEnvironmentVariable("SUPABASE_CONNECTION");

if (!useProdDb)
{
    // Unless explicitly requested, do not use the production SupabaseConnection from appsettings.
    connectionString = null;
}

if (string.IsNullOrWhiteSpace(connectionString))
{
    // Use InMemory for development convenience. Suppress TransactionIgnoredWarning which is expected for InMemory provider.
    builder.Services.AddDbContext<AppDbContext>(options =>
        options
            .UseInMemoryDatabase("DevDb")
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
    );
}
else
{
    builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));
}

// Rust image processor HTTP client + service registration (single instance)
builder.Services.AddHttpClient(
    "RustProcessor",
    client =>
    {
        var rustUrl = builder.Configuration["RustService:Url"] ?? "http://localhost:8080";
        client.BaseAddress = new Uri(rustUrl.TrimEnd('/'));
        client.Timeout = TimeSpan.FromSeconds(30);
    }
);
builder.Services.AddScoped<IImageCompressionService, RustImageCompressionService>();

// Supabase Storage HttpClient: tolerate missing service role key by using anon key as fallback and skip auth if none present
var supabaseUrl =
    builder.Configuration["Supabase:Url"]
    ?? builder.Configuration["NEXT_PUBLIC_SUPABASE_URL"]
    ?? Environment.GetEnvironmentVariable("NEXT_PUBLIC_SUPABASE_URL");
var supabaseServiceKey =
    builder.Configuration["Supabase:ServiceRoleKey"]
    ?? Environment.GetEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY")
    ?? builder.Configuration["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
    ?? Environment.GetEnvironmentVariable("NEXT_PUBLIC_SUPABASE_ANON_KEY");

builder.Services.AddHttpClient(
    "SupabaseStorage",
    client =>
    {
        if (!string.IsNullOrEmpty(supabaseUrl))
        {
            client.BaseAddress = new Uri(supabaseUrl.TrimEnd('/'));
        }
        if (!string.IsNullOrEmpty(supabaseServiceKey))
        {
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
                "Bearer",
                supabaseServiceKey
            );
            client.DefaultRequestHeaders.Add("apikey", supabaseServiceKey);
        }
        client.Timeout = TimeSpan.FromSeconds(30);
    }
);

builder.Services.AddSingleton<SupabaseStorageService>();

// NOTE: Rust client/service already registered above. Removed duplicate registrations.

// ── Semantic Search (Gemini) ──
builder.Services.AddHttpClient<IGeminiEmbeddingService, GeminiEmbeddingService>();
builder.Services.AddScoped<IProductSemanticRepository, ProductSemanticRepository>();

// ✅ KODE BARU: Mengizinkan data varian dibaca tanpa bikin server pusing muter-muter
builder
    .Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System
            .Text
            .Json
            .Serialization
            .ReferenceHandler
            .IgnoreCycles;
    });

// ── Transactional Outbox Pattern (CQRS + Background Worker) ──
// Register order/outbox handlers conditionally: use production (SQL + background worker) only when USE_PROD_DB=true
if (useProdDb)
{
    builder.Services.AddScoped<IPlaceOrderCommandHandler, PlaceOrderCommandHandler>();
    builder.Services.AddScoped<IOrderRepository, OrderRepository>();
    builder.Services.AddScoped<IOutboxRepository, OutboxRepository>();
    builder.Services.AddHostedService<OutboxProcessorWorker>();
}
else
{
    // In-memory implementations to allow local development without external DB
    builder.Services.AddScoped<IPlaceOrderCommandHandler, InMemoryPlaceOrderCommandHandler>();
    // OrderRepository/OutboxRepository are not registered; in-memory handler uses AppDbContext directly.
}
builder.Services.AddHttpClient(
    "OutboxWebhook",
    client =>
    {
        client.Timeout = TimeSpan.FromSeconds(15);
    }
);

// ── Response Compression: Brotli (primary) + Gzip (fallback) ──
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes;
});

builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
    options.Level = CompressionLevel.Fastest
);

builder.Services.Configure<GzipCompressionProviderOptions>(options =>
    options.Level = CompressionLevel.Fastest
);

// ── Build ──
var app = builder.Build();

app.UseCors("AllowFrontend");

// ── 🛠️ ROBUST DATABASE INIT: DNS CHECK + RETRIES (MENANGKAP "No such host is known") ──
using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
    var db = scope.ServiceProvider.GetService<AppDbContext>();

    if (db is null)
    {
        logger.LogWarning("AppDbContext not available from DI. Skipping database initialization.");
    }
    else
    {
        // If USE_PROD_DB is set to true, attempt robust DNS+EnsureCreated against configured SupabaseConnection.
        if (useProdDb)
        {
            var conn = config.GetConnectionString("SupabaseConnection");
            string? host = null;

            if (!string.IsNullOrWhiteSpace(conn))
            {
                var segments = conn.Split(';', StringSplitOptions.RemoveEmptyEntries);
                foreach (var seg in segments)
                {
                    var idx = seg.IndexOf('=', StringComparison.Ordinal);
                    if (idx > 0)
                    {
                        var key = seg.Substring(0, idx).Trim();
                        var val = seg.Substring(idx + 1).Trim();
                        if (
                            key.Equals("Host", StringComparison.OrdinalIgnoreCase)
                            || key.Equals("Server", StringComparison.OrdinalIgnoreCase)
                        )
                        {
                            host = val;
                            break;
                        }
                    }
                }
            }

            if (string.IsNullOrWhiteSpace(host))
            {
                try
                {
                    db.Database.EnsureCreated();
                    logger.LogInformation("Database EnsureCreated executed (host not parsed).");
                }
                catch (Exception ex)
                {
                    logger.LogError(
                        ex,
                        "Database initialization failed and host could not be parsed. Check SupabaseConnection in appsettings.json."
                    );
                }
            }
            else
            {
                if (
                    host.Contains("{{")
                    || host.Contains("xxxxx")
                    || host.Contains("YOUR")
                    || host.Contains("example")
                )
                {
                    logger.LogError(
                        "SupabaseConnection host appears to be a placeholder ('{Host}'). Update backend/appsettings.json or environment variables with the real Supabase host and restart.",
                        host
                    );
                }
                else
                {
                    const int maxAttempts = 5;
                    var initialized = false;
                    for (var attempt = 1; attempt <= maxAttempts; attempt++)
                    {
                        try
                        {
                            var addresses = await Dns.GetHostAddressesAsync(host);
                            if (addresses is { Length: > 0 })
                            {
                                logger.LogInformation(
                                    "Resolved DB host '{Host}' => {Count} address(es). Attempting EnsureCreated (attempt {Attempt}/{Max}).",
                                    host,
                                    addresses.Length,
                                    attempt,
                                    maxAttempts
                                );

                                try
                                {
                                    db.Database.EnsureCreated();
                                    logger.LogInformation("Database EnsureCreated succeeded.");
                                    initialized = true;
                                    break;
                                }
                                catch (Exception dex)
                                {
                                    logger.LogWarning(
                                        dex,
                                        "EnsureCreated attempt {Attempt} failed: {Message}",
                                        attempt,
                                        dex.Message
                                    );
                                }
                            }
                            else
                            {
                                logger.LogWarning(
                                    "DNS lookup returned no addresses for host '{Host}' (attempt {Attempt}/{Max}).",
                                    host,
                                    attempt,
                                    maxAttempts
                                );
                            }
                        }
                        catch (SocketException sex)
                        {
                            logger.LogWarning(
                                sex,
                                "DNS resolution SocketException for host '{Host}' (attempt {Attempt}/{Max}): {Message}",
                                host,
                                attempt,
                                maxAttempts,
                                sex.Message
                            );
                        }
                        catch (Exception ex)
                        {
                            logger.LogWarning(
                                ex,
                                "DNS lookup failed for host '{Host}' (attempt {Attempt}/{Max}): {Message}",
                                host,
                                attempt,
                                maxAttempts,
                                ex.Message
                            );
                        }

                        var delaySeconds = Math.Min(30, Math.Pow(2, attempt));
                        logger.LogDebug(
                            "Waiting {Delay}s before next DNS/DB attempt...",
                            delaySeconds
                        );
                        await Task.Delay(TimeSpan.FromSeconds(delaySeconds));
                    }

                    if (!initialized)
                    {
                        logger.LogError(
                            "Unable to resolve or connect to DB host '{Host}' after {Attempts} attempts. Application will continue starting, but DB operations will fail until connection is fixed. Verify connection string and network/DNS.",
                            host,
                            maxAttempts
                        );
                    }
                }
            }
        }
        else
        {
            // Development-friendly path: use InMemory database and seed sample data if empty.
            try
            {
                db.Database.EnsureCreated();
                logger.LogInformation("Using InMemory DB; EnsureCreated completed.");
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "EnsureCreated for InMemory DB failed (continuing).");
            }
        }
    }
}

// ── Middleware pipeline (order matters) ──
app.UseResponseCompression();
app.UseCors("AllowFrontend");

// Security headers middleware
app.Use(
    async (context, next) =>
    {
        context.Response.Headers["X-Content-Type-Options"] = "nosniff";
        context.Response.Headers["X-Frame-Options"] = "DENY";
        context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
        context.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
        context.Response.Headers["X-XSS-Protection"] = "0";
        await next();
    }
);

// ────────────────────────────────────────────────────────────────────────
//  2. ENDPOINT DEFINITIONS
// ────────────────────────────────────────────────────────────────────────

var api = app.MapGroup("/api");
var admin = app.MapGroup("/api/admin");

// GET /api/products (Sudah support Search, Filter Category, dan Sorting!)
api.MapGet(
    "/products",
    async (string? search, string? category, string? sort, AppDbContext db) =>
    {
        // 1. Mulai query dasar dengan eager loading untuk Images & Variants
        var query = db
            .Products.AsNoTracking()
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .AsQueryable();

        // 2. FILTER KATEGORI: kalau kategorinya bukan "all", saring berdasarkan kategori tersebut
        if (
            !string.IsNullOrEmpty(category)
            && !category.Equals("all", StringComparison.OrdinalIgnoreCase)
        )
        {
            // Catatan: Pastikan di class Product kamu ada properti 'Category' ya!
            query = query.Where(p =>
                p.Category != null && p.Category.ToLower() == category.ToLower()
            );
        }

        // 3. FILTER SEARCH STANDARD: cari kata di dalam Judul atau Deskripsi produk
        if (!string.IsNullOrEmpty(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(p =>
                p.Title.ToLower().Contains(searchLower)
                || (p.Description != null && p.Description.ToLower().Contains(searchLower))
            );
        }

        // 4. SORTING DATA: Urutkan berdasarkan kemauan user
        query = sort?.ToLower() switch
        {
            "price-low" => query.OrderBy(p =>
                p.DiscountPrice.HasValue && p.DiscountPrice > 0 ? p.DiscountPrice : p.OriginalPrice
            ),
            "price-high" => query.OrderByDescending(p =>
                p.DiscountPrice.HasValue && p.DiscountPrice > 0 ? p.DiscountPrice : p.OriginalPrice
            ),
            "newest" => query.OrderByDescending(p => p.CreatedAt),
            _ => query.OrderByDescending(p => p.CreatedAt), // Default urutan terbaru
        };

        // 5. Eksekusi query ke database Supabase (Lengkap dengan data varian/stok)
        var products = await query.Include(p => p.Variants).ToListAsync();
        // 6. Transformasi ke format DTO yang dimengerti Next.js
        var dtos = products
            .Select(p =>
            {
                var primaryImage =
                    p.Images.Where(i => i.IsPrimary).Select(i => i.ImageUrl).FirstOrDefault()
                    ?? p.Images.Select(i => i.ImageUrl).FirstOrDefault();

                var galleryImages = p
                    .Images.Where(i => !i.IsPrimary)
                    .Select(i => i.ImageUrl)
                    .ToList();

                var variants = p.Variants.Select(v => new VariantDto(v.Size, v.Stock)).ToList();

                return new ProductDto(
                    Id: p.Id,
                    Title: p.Title,
                    Description: p.Description ?? "",
                    OriginalPrice: p.OriginalPrice,
                    DiscountPrice: p.DiscountPrice ?? 0,
                    PrimaryImage: primaryImage,
                    GalleryImages: galleryImages,
                    Variants: variants,
                    CreatedAt: p.CreatedAt
                );
            })
            .ToList();

        return Results.Ok(dtos);
    }
);

//  GET /api/stories
api.MapGet(
    "/stories",
    async (AppDbContext db) =>
    {
        var cutoff = DateTimeOffset.UtcNow.AddHours(-24);

        var stories = await db
            .Stories.AsNoTracking()
            .Where(s => s.CreatedAt >= cutoff)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new StoryDto(s.Id, s.ImageOrVideoUrl, s.Caption, s.CreatedAt))
            .ToListAsync();

        return Results.Ok(stories);
    }
);

//  POST /api/admin/products
admin.MapPost(
    "/products",
    async (
        HttpRequest request,
        AppDbContext db,
        SupabaseStorageService storage,
        IImageCompressionService compressor,
        ILogger<Program> logger,
        CancellationToken cancellationToken
    ) =>
    {
        if (!request.HasFormContentType)
        {
            return Results.BadRequest(new { error = "Request must be multipart/form-data." });
        }

        IFormCollection form;
        try
        {
            form = await request.ReadFormAsync();
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to parse form data.");
            return Results.BadRequest(new { error = "Malformed form data." });
        }

        var title = form["Title"].ToString().Trim();
        var description = form["Description"].ToString().Trim();
        var originalPriceRaw = form["OriginalPrice"].ToString();
        var discountPriceRaw = form["DiscountPrice"].ToString();
        var variantsJson = form["Variants"].ToString();

        if (string.IsNullOrWhiteSpace(title))
        {
            return Results.BadRequest(new { error = "Title is required and cannot be empty." });
        }

        if (
            !decimal.TryParse(
                originalPriceRaw,
                NumberStyles.Any,
                CultureInfo.InvariantCulture,
                out var originalPrice
            )
            || originalPrice <= 0
        )
        {
            return Results.BadRequest(
                new { error = "OriginalPrice must be a positive number greater than zero." }
            );
        }

        if (
            !decimal.TryParse(
                discountPriceRaw,
                NumberStyles.Any,
                CultureInfo.InvariantCulture,
                out var discountPrice
            )
        )
        {
            discountPrice = 0m;
        }

        var imageFiles = form.Files.GetFiles("Images");
        if (!imageFiles.Any())
        {
            imageFiles = form.Files;
        }

        if (!imageFiles.Any())
        {
            return Results.BadRequest(new { error = "At least one image file is required." });
        }

        foreach (var file in imageFiles)
        {
            if (file.Length == 0)
            {
                return Results.BadRequest(
                    new { error = $"File '{Path.GetFileName(file.FileName)}' is empty." }
                );
            }

            if (file.Length > FileValidation.MaxFileSizeBytes)
            {
                return Results.BadRequest(
                    new
                    {
                        error = $"File '{Path.GetFileName(file.FileName)}' exceeds the 10 MB limit.",
                    }
                );
            }

            if (!FileValidation.IsAllowedExtension(file.FileName))
            {
                return Results.BadRequest(
                    new
                    {
                        error = $"File '{Path.GetFileName(file.FileName)}' has a disallowed extension. "
                            + "Allowed: .jpg, .jpeg, .png, .webp",
                    }
                );
            }

            await using var probe = file.OpenReadStream();
            if (!await FileValidation.HasValidMagicBytesAsync(probe, file.FileName))
            {
                return Results.BadRequest(
                    new
                    {
                        error = $"File '{Path.GetFileName(file.FileName)}' content does not match its claimed extension.",
                    }
                );
            }
        }

        var variants = new List<VariantInput>();
        if (!string.IsNullOrWhiteSpace(variantsJson))
        {
            try
            {
                variants =
                    JsonSerializer.Deserialize<List<VariantInput>>(
                        variantsJson,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                    ) ?? new();
            }
            catch (JsonException)
            {
                return Results.BadRequest(
                    new
                    {
                        error = "Variants must be a valid JSON array of { \"Size\": \"...\", \"Stock\": N } objects.",
                    }
                );
            }
        }

        await using var transaction = await db.Database.BeginTransactionAsync();
        var uploadedPaths = new List<string>();

        try
        {
            var product = new Product
            {
                Id = Guid.NewGuid(),
                Title = title,
                Description = description,
                OriginalPrice = originalPrice,
                DiscountPrice = discountPrice,
                CreatedAt = DateTimeOffset.UtcNow,
            };

            db.Products.Add(product);
            await db.SaveChangesAsync();

            var isFirst = true;
            foreach (var file in imageFiles)
            {
                using var sourceStream = file.OpenReadStream();
                var webpBytes = await compressor.CompressToWebpAsync(
                    sourceStream,
                    file.FileName,
                    cancellationToken
                );

                var storagePath =
                    $"products/{product.Id}/{FileValidation.GenerateSafeWebpFileName()}";
                using var uploadStream = new MemoryStream(webpBytes);
                var publicUrl = await storage.UploadFileAsync(
                    uploadStream,
                    storagePath,
                    "image/webp"
                );

                uploadedPaths.Add(storagePath);

                db.ProductImages.Add(
                    new ProductImage
                    {
                        Id = Guid.NewGuid(),
                        ProductId = product.Id,
                        ImageUrl = publicUrl,
                        IsPrimary = isFirst,
                    }
                );

                isFirst = false;
            }

            foreach (var v in variants)
            {
                if (string.IsNullOrWhiteSpace(v.Size))
                    continue;

                db.ProductVariants.Add(
                    new ProductVariant
                    {
                        Id = Guid.NewGuid(),
                        ProductId = product.Id,
                        Size = v.Size.Trim(),
                        Stock = Math.Max(0, v.Stock),
                    }
                );
            }

            await db.SaveChangesAsync();
            await transaction.CommitAsync();

            logger.LogInformation(
                "Product {ProductId} created successfully with {ImageCount} images.",
                product.Id,
                uploadedPaths.Count
            );

            return Results.Created($"/api/products/{product.Id}", new { id = product.Id });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Product creation failed — rolling back transaction.");
            await transaction.RollbackAsync();

            if (uploadedPaths.Count > 0)
            {
                await storage.DeleteFilesAsync(uploadedPaths);
            }

            return Results.Problem(
                title: "Product creation failed.",
                detail: "An internal error occurred. The transaction has been rolled back.",
                statusCode: StatusCodes.Status500InternalServerError
            );
        }
    }
);

//  DELETE /api/admin/products/{id}
admin.MapDelete(
    "/products/{id:guid}",
    async (Guid id, AppDbContext db, SupabaseStorageService storage, ILogger<Program> logger) =>
    {
        var product = await db.Products.Include(p => p.Images).FirstOrDefaultAsync(p => p.Id == id);

        if (product is null)
        {
            return Results.NotFound(new { error = $"Product with ID '{id}' was not found." });
        }

        var storagePaths = product
            .Images.Select(img => storage.ExtractStoragePath(img.ImageUrl))
            .Where(path => path is not null)
            .Cast<string>()
            .ToList();

        if (storagePaths.Count > 0)
        {
            await storage.DeleteFilesAsync(storagePaths);
            logger.LogInformation(
                "Deleted {Count} storage object(s) for product {ProductId}.",
                storagePaths.Count,
                id
            );
        }

        db.Products.Remove(product);
        await db.SaveChangesAsync();

        logger.LogInformation("Product {ProductId} deleted successfully.", id);

        return Results.NoContent();
    }
);

// ────────────────────────────────────────────────────────────────────────
//  TRANSACTIONAL OUTBOX ENDPOINTS (CQRS)
// ────────────────────────────────────────────────────────────────────────

//  POST /api/orders — Place a new order (atomic Order + OutboxMessage write)
api.MapPost(
    "/orders",
    async (HttpContext httpContext, IPlaceOrderCommandHandler handler, ILogger<Program> logger) =>
    {
        PlaceOrderCommand? command;
        try
        {
            command = await httpContext.Request.ReadFromJsonAsync(
                OutboxJsonContext.Default.PlaceOrderCommand
            );
        }
        catch (JsonException)
        {
            return Results.BadRequest(
                new ErrorResponse(
                    "Request body must be valid JSON matching PlaceOrderCommand schema."
                )
            );
        }

        if (command is null)
        {
            return Results.BadRequest(new ErrorResponse("Request body is required."));
        }

        if (string.IsNullOrWhiteSpace(command.CustomerName))
        {
            return Results.BadRequest(new ErrorResponse("CustomerName is required."));
        }

        if (string.IsNullOrWhiteSpace(command.CustomerEmail))
        {
            return Results.BadRequest(new ErrorResponse("CustomerEmail is required."));
        }

        if (command.ProductId == Guid.Empty)
        {
            return Results.BadRequest(new ErrorResponse("ProductId is required."));
        }

        if (command.Quantity < 1 || command.Quantity > 100)
        {
            return Results.BadRequest(new ErrorResponse("Quantity must be between 1 and 100."));
        }

        try
        {
            var response = await handler.HandleAsync(command, httpContext.RequestAborted);
            return Results.Created($"/api/orders/{response.OrderId}", response);
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(new ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled error placing order.");
            return Results.Problem(
                title: "Order placement failed.",
                detail: "An internal error occurred. Please try again.",
                statusCode: StatusCodes.Status500InternalServerError
            );
        }
    }
);

//  GET /api/orders/{id} — Retrieve order status
api.MapGet(
    "/orders/{id:guid}",
    async (Guid id, AppDbContext db, ILogger<Program> logger) =>
    {
        try
        {
            // If production repository is registered, prefer it for SQL-backed retrieval.
            var repo = db; // use EF DbContext for both InMemory and SQL scenarios by default.
            var orderEntity = await db.Set<BatikNareswara.Api.Features.Orders.Entities.Order>()
                .FindAsync(new object[] { id });
            if (orderEntity is null)
            {
                return Results.NotFound(new ErrorResponse($"Order with ID '{id}' was not found."));
            }

            var dto = new OrderStatusDto(
                Id: orderEntity.Id,
                CustomerName: orderEntity.CustomerName,
                CustomerEmail: orderEntity.CustomerEmail,
                ProductId: orderEntity.ProductId,
                Quantity: orderEntity.Quantity,
                TotalPrice: orderEntity.TotalPrice,
                Status: orderEntity.Status,
                CreatedAt: orderEntity.CreatedAt
            );

            return Results.Ok(dto);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error retrieving order {OrderId}.", id);
            return Results.Problem(
                title: "Failed to retrieve order.",
                detail: "An internal error occurred.",
                statusCode: StatusCodes.Status500InternalServerError
            );
        }
    }
);

// Map Controllers for Semantic Search
app.MapControllers();

//  LAUNCH THE ENGINE!
// Respect environment configuration for URLs; default will be used if none provided.
app.Run("http://0.0.0.0:5000");

// Image compression service types (MUST be placed after app.Run() to satisfy top-level statements)
public interface IImageCompressionService
{
    Task<byte[]> CompressToWebpAsync(
        Stream imageStream,
        string fileName,
        CancellationToken cancellationToken = default
    );
}

public sealed class RustImageCompressionService : IImageCompressionService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<RustImageCompressionService> _logger;

    public RustImageCompressionService(
        IHttpClientFactory httpClientFactory,
        ILogger<RustImageCompressionService> logger
    )
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<byte[]> CompressToWebpAsync(
        Stream imageStream,
        string fileName,
        CancellationToken cancellationToken = default
    )
    {
        if (imageStream is null)
            throw new ArgumentNullException(nameof(imageStream));
        if (string.IsNullOrWhiteSpace(fileName))
            throw new ArgumentException("File name is required.", nameof(fileName));

        await using var buffer = new MemoryStream();
        await imageStream.CopyToAsync(buffer, cancellationToken);
        var originalBytes = buffer.ToArray();

        try
        {
            var client = _httpClientFactory.CreateClient("RustProcessor");

            using var content = new MultipartFormDataContent();
            using var imageContent = new ByteArrayContent(originalBytes);
            imageContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(
                "application/octet-stream"
            );
            content.Add(imageContent, "image", fileName);

            var response = await client.PostAsync("/api/compress", content, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError(
                    "Rust image compression service returned {StatusCode} for {FileName}. Response body: {ResponseBody}",
                    (int)response.StatusCode,
                    fileName,
                    body
                );
                return originalBytes;
            }

            var compressed = await response.Content.ReadAsByteArrayAsync(cancellationToken);
            if (compressed is null || compressed.Length == 0)
            {
                _logger.LogWarning(
                    "Rust compression returned empty payload for {FileName}; falling back to original.",
                    fileName
                );
                return originalBytes;
            }

            return compressed;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to compress image {FileName} with RustProcessor. Falling back to original bytes.",
                fileName
            );
            return originalBytes;
        }
    }
}

// ════════════════════════════════════════════════════════════════════════

[Table("products")]
public class Product
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Required]
    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [Column("category")]
    public string? Category { get; set; }

    [Column("description")]
    public string? Description { get; set; }

    [Column("original_price")]
    public decimal OriginalPrice { get; set; }

    [Column("discount_price")]
    public decimal? DiscountPrice { get; set; }

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }

    public List<ProductImage> Images { get; set; } = new();
    public List<ProductVariant> Variants { get; set; } = new();
}

[Table("product_images")]
public class ProductImage
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("product_id")]
    public Guid ProductId { get; set; }

    [Required]
    [Column("image_url")]
    public string ImageUrl { get; set; } = string.Empty;

    [Column("is_primary")]
    public bool IsPrimary { get; set; }

    [ForeignKey(nameof(ProductId))]
    public Product Product { get; set; } = null!;
}

[Table("product_variants")]
public class ProductVariant
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("product_id")]
    public Guid ProductId { get; set; }

    [Required]
    [Column("size")]
    [MaxLength(10)]
    public string Size { get; set; } = string.Empty;

    [Column("stock")]
    public int Stock { get; set; }

    [ForeignKey(nameof(ProductId))]
    public Product Product { get; set; } = null!;
}

[Table("stories")]
public class Story
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Required]
    [Column("image_or_video_url")]
    public string ImageOrVideoUrl { get; set; } = string.Empty;

    [Column("caption")]
    [MaxLength(255)]
    public string? Caption { get; set; }

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }
}

[Table("outbox_messages")]
public class OutboxMessageEntity
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Required]
    [Column("type")]
    public string Type { get; set; } = string.Empty;

    [Required]
    [Column("content")]
    public string Content { get; set; } = string.Empty;

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }

    [Column("processed_at")]
    public DateTimeOffset? ProcessedAt { get; set; }
}

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<Story> Stories => Set<Story>();

    // Orders & Outbox sets used when running with InMemory DB in dev mode
    public DbSet<BatikNareswara.Api.Features.Orders.Entities.Order> Orders =>
        Set<BatikNareswara.Api.Features.Orders.Entities.Order>();
    public DbSet<BatikNareswara.Api.Features.Orders.Entities.OutboxMessage> OrdersOutbox =>
        Set<BatikNareswara.Api.Features.Orders.Entities.OutboxMessage>();

    // ── 1. BERHASIL MENDAFTARKAN ENTITAS OUTBOX DI SINI ──
    public DbSet<OutboxMessageEntity> OutboxMessages => Set<OutboxMessageEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Product>(entity =>
        {
            entity
                .HasMany(p => p.Images)
                .WithOne(i => i.Product)
                .HasForeignKey(i => i.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
            entity
                .HasMany(p => p.Variants)
                .WithOne(v => v.Product)
                .HasForeignKey(v => v.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.Property(p => p.OriginalPrice).HasColumnType("numeric(12,2)");
            entity.Property(p => p.DiscountPrice).HasColumnType("numeric(12,2)");
            entity.Property(p => p.CreatedAt).HasDefaultValueSql("NOW()");
        });

        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.Property(i => i.IsPrimary).HasDefaultValue(false);
        });
        modelBuilder.Entity<ProductVariant>(entity =>
        {
            entity.Property(v => v.Stock).HasDefaultValue(0);
        });
        modelBuilder.Entity<Story>(entity =>
        {
            entity.Property(s => s.CreatedAt).HasDefaultValueSql("NOW()");
        });

        // ── 2. MAPPING TABEL MENGGUNAKAN TIPE DATA OUTBOXMESSAGEENTITY YANG BARU ──
        modelBuilder.Entity<OutboxMessageEntity>(entity =>
        {
            // Use a separate table name for the internal backend entity to avoid
            // conflicting mappings with the Orders Outbox entity used in dev.
            entity.ToTable("outbox_messages_backend");
            entity.Property(o => o.Id).HasColumnName("id");
            entity.Property(o => o.Type).HasColumnName("type");
            entity.Property(o => o.Content).HasColumnName("content");
            entity
                .Property(o => o.CreatedAt)
                .HasColumnName("created_at")
                .HasDefaultValueSql("NOW()");
            entity.Property(o => o.ProcessedAt).HasColumnName("processed_at");
        });
    }
}

public sealed record ProductDto(
    Guid Id,
    string Title,
    string Description,
    decimal OriginalPrice,
    decimal DiscountPrice,
    string? PrimaryImage,
    List<string> GalleryImages,
    List<VariantDto> Variants,
    DateTimeOffset CreatedAt
);

public sealed record VariantDto(string Size, int Stock);

public sealed record StoryDto(Guid Id, string MediaUrl, string? Caption, DateTimeOffset CreatedAt);

public sealed record VariantInput
{
    [JsonPropertyName("Size")]
    public string Size { get; init; } = string.Empty;

    [JsonPropertyName("Stock")]
    public int Stock { get; init; }
}

public static class FileValidation
{
    public const long MaxFileSizeBytes = 10L * 1024 * 1024;

    private static readonly HashSet<string> AllowedExtensions = new(
        StringComparer.OrdinalIgnoreCase
    )
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
    };

    private static readonly Dictionary<string, byte[][]> MagicBytes = new(
        StringComparer.OrdinalIgnoreCase
    )
    {
        { ".jpg", new[] { new byte[] { 0xFF, 0xD8, 0xFF } } },
        { ".jpeg", new[] { new byte[] { 0xFF, 0xD8, 0xFF } } },
        { ".png", new[] { new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A } } },
        { ".webp", new[] { new byte[] { 0x52, 0x49, 0x46, 0x46 } } },
    };

    public static bool IsAllowedExtension(string fileName)
    {
        var ext = Path.GetExtension(fileName);
        return !string.IsNullOrEmpty(ext) && AllowedExtensions.Contains(ext);
    }

    public static async Task<bool> HasValidMagicBytesAsync(Stream stream, string fileName)
    {
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        if (!MagicBytes.TryGetValue(ext, out var signatures))
            return false;

        var maxLen = signatures.Max(s => s.Length);
        var header = new byte[maxLen];
        var originalPosition = stream.Position;

        var bytesRead = await stream.ReadAsync(header.AsMemory(0, maxLen));
        stream.Position = originalPosition;

        if (bytesRead < maxLen)
            return false;

        return signatures.Any(sig => header.AsSpan(0, sig.Length).SequenceEqual(sig));
    }

    public static string GetContentType(string fileName)
    {
        return Path.GetExtension(fileName).ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".webp" => "image/webp",
            _ => "application/octet-stream",
        };
    }

    public static string GenerateSafeFileName(string originalFileName)
    {
        var ext = Path.GetExtension(originalFileName).ToLowerInvariant();
        return $"{Guid.NewGuid()}{ext}";
    }

    public static string GenerateSafeWebpFileName()
    {
        return $"{Guid.NewGuid()}.webp";
    }
}

public sealed class SupabaseStorageService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string _bucketName;
    private readonly string _baseUrl;
    private readonly ILogger<SupabaseStorageService> _logger;

    public SupabaseStorageService(
        IHttpClientFactory httpClientFactory,
        IConfiguration config,
        ILogger<SupabaseStorageService> logger
    )
    {
        _httpClientFactory = httpClientFactory;
        _bucketName = "gambarBatik";
        // Use configured Supabase URL if present; fallback to prior hard-coded value if not.
        _baseUrl =
            config["Supabase:Url"]?.TrimEnd('/') ?? "https://btdfzxttyknywewfkayw.supabase.co";
        _logger = logger;
    } // <-- Pastiin ketutup rapi di sini

    public async Task<string> UploadFileAsync(
        Stream fileStream,
        string storagePath,
        string contentType
    )
    {
        var client = _httpClientFactory.CreateClient("SupabaseStorage");

        using var content = new StreamContent(fileStream);
        content.Headers.ContentType = new MediaTypeHeaderValue(contentType);

        var response = await client.PostAsync(
            $"/storage/v1/object/{_bucketName}/{storagePath}",
            content
        );

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync();
            _logger.LogError(
                "Supabase Storage upload failed for {Path}: {Status} — {Body}",
                storagePath,
                (int)response.StatusCode,
                errorBody
            );

            throw new InvalidOperationException(
                $"Storage upload failed (HTTP {(int)response.StatusCode}). Alasan Supabase: {errorBody}"
            );
        }

        return $"{_baseUrl}/storage/v1/object/public/{_bucketName}/{storagePath}";
    }

    public async Task DeleteFilesAsync(IReadOnlyList<string> storagePaths)
    {
        if (storagePaths.Count == 0)
            return;

        var client = _httpClientFactory.CreateClient("SupabaseStorage");

        var payload = JsonSerializer.Serialize(new { prefixes = storagePaths });
        var request = new HttpRequestMessage(HttpMethod.Delete, $"/storage/v1/object/{_bucketName}")
        {
            Content = new StringContent(payload, System.Text.Encoding.UTF8, "application/json"),
        };

        try
        {
            var response = await client.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                _logger.LogWarning(
                    "Supabase Storage delete returned {Status}: {Body}",
                    (int)response.StatusCode,
                    body
                );
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to delete storage objects: {Paths}",
                string.Join(", ", storagePaths)
            );
        }
    }

    public string? ExtractStoragePath(string publicUrl)
    {
        var prefix = $"{_baseUrl}/storage/v1/object/public/{_bucketName}/";
        if (publicUrl.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            return publicUrl[prefix.Length..];
        return null;
    }
}
