using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using BatikNareswara.Api.Features.Orders.Repositories;
using BatikNareswara.Api.Features.Orders.Serialization;

namespace BatikNareswara.Api.Features.Orders.Workers;

/// <summary>
/// Background worker that periodically polls the outbox_messages table for unprocessed events,
/// dispatches them to a configurable webhook endpoint (or logs them as a fallback),
/// and marks them as processed upon successful delivery.
///
/// This completes the Transactional Outbox Pattern by decoupling event publishing
/// from the transactional boundary — ensuring at-least-once delivery semantics.
///
/// Configuration:
///   - Outbox:PollingIntervalSeconds (default: 5)
///   - Outbox:BatchSize (default: 10)
///   - Outbox:WebhookUrl (optional — falls back to structured logging if not set)
///   - Outbox:MaxRetries (default: 3)
/// </summary>
public sealed class OutboxProcessorWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<OutboxProcessorWorker> _logger;
    private readonly int _pollingIntervalSeconds;
    private readonly int _batchSize;
    private readonly string? _webhookUrl;
    private readonly int _maxRetries;

    public OutboxProcessorWorker(
        IServiceScopeFactory scopeFactory,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<OutboxProcessorWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _httpClientFactory = httpClientFactory;
        _logger = logger;

        _pollingIntervalSeconds = configuration.GetValue("Outbox:PollingIntervalSeconds", 5);
        _batchSize = configuration.GetValue("Outbox:BatchSize", 10);
        _webhookUrl = configuration["Outbox:WebhookUrl"];
        _maxRetries = configuration.GetValue("Outbox:MaxRetries", 3);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation(
            "OutboxProcessorWorker started. Polling every {Interval}s, batch size {BatchSize}, webhook: {Webhook}",
            _pollingIntervalSeconds,
            _batchSize,
            string.IsNullOrEmpty(_webhookUrl) ? "(logging fallback)" : _webhookUrl);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessOutboxBatchAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                // Graceful shutdown — exit the loop cleanly
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled error in OutboxProcessorWorker polling cycle.");
            }

            await Task.Delay(TimeSpan.FromSeconds(_pollingIntervalSeconds), stoppingToken);
        }

        _logger.LogInformation("OutboxProcessorWorker stopped.");
    }

    private async Task ProcessOutboxBatchAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var outboxRepository = scope.ServiceProvider.GetRequiredService<IOutboxRepository>();

        var messages = await outboxRepository.GetUnprocessedAsync(_batchSize, cancellationToken);

        if (messages.Count == 0)
        {
            return;
        }

        _logger.LogInformation("Processing {Count} outbox message(s).", messages.Count);

        foreach (var message in messages)
        {
            var dispatched = await DispatchWithRetryAsync(message, cancellationToken);

            if (dispatched)
            {
                await outboxRepository.MarkAsProcessedAsync(message.Id, cancellationToken);

                _logger.LogInformation(
                    "Outbox message {MessageId} ({Type}) dispatched and marked as processed.",
                    message.Id, message.Type);
            }
            else
            {
                _logger.LogWarning(
                    "Outbox message {MessageId} ({Type}) failed dispatch after {MaxRetries} retries. Will retry next cycle.",
                    message.Id, message.Type, _maxRetries);
            }
        }
    }

    /// <summary>
    /// Attempts to dispatch an outbox message with exponential backoff retry.
    /// Returns true if the message was successfully dispatched.
    /// </summary>
    private async Task<bool> DispatchWithRetryAsync(
        Entities.OutboxMessage message,
        CancellationToken cancellationToken)
    {
        for (var attempt = 1; attempt <= _maxRetries; attempt++)
        {
            try
            {
                await DispatchMessageAsync(message, cancellationToken);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Dispatch attempt {Attempt}/{MaxRetries} failed for outbox message {MessageId}.",
                    attempt, _maxRetries, message.Id);

                if (attempt < _maxRetries)
                {
                    // Exponential backoff: 1s, 2s, 4s ...
                    var delay = TimeSpan.FromSeconds(Math.Pow(2, attempt - 1));
                    await Task.Delay(delay, cancellationToken);
                }
            }
        }

        return false;
    }

    /// <summary>
    /// Dispatches a single outbox message. If a webhook URL is configured,
    /// sends an HTTP POST. Otherwise, logs the event payload as structured output
    /// for development/debugging purposes.
    /// </summary>
    private async Task DispatchMessageAsync(
        Entities.OutboxMessage message,
        CancellationToken cancellationToken)
    {
        var webhookPayload = new WebhookPayload(
            MessageId: message.Id,
            EventType: message.Type,
            Payload: message.Content,
            DispatchedAt: DateTimeOffset.UtcNow
        );

        if (!string.IsNullOrEmpty(_webhookUrl))
        {
            // ── Production path: HTTP POST to configured webhook endpoint ──
            var client = _httpClientFactory.CreateClient("OutboxWebhook");
            var jsonContent = JsonSerializer.Serialize(webhookPayload, OutboxJsonContext.Default.WebhookPayload);

            using var httpContent = new StringContent(jsonContent, Encoding.UTF8, "application/json");
            httpContent.Headers.ContentType = new MediaTypeHeaderValue("application/json");

            var response = await client.PostAsync(_webhookUrl, httpContent, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                throw new HttpRequestException(
                    $"Webhook dispatch failed (HTTP {(int)response.StatusCode}): {errorBody}");
            }

            _logger.LogInformation(
                "Webhook dispatched for {EventType} → {WebhookUrl} (HTTP {StatusCode})",
                message.Type, _webhookUrl, (int)response.StatusCode);
        }
        else
        {
            // ── Development fallback: structured logging as simulated dispatch ──
            _logger.LogInformation(
                "📨 [OUTBOX DISPATCH] Event: {EventType} | MessageId: {MessageId} | Payload: {Payload}",
                message.Type, message.Id, message.Content);

            // Simulate network latency for realistic development testing
            await Task.Delay(100, cancellationToken);
        }
    }
}
