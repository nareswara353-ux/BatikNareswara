using System.Text.Json.Serialization;
using BatikNareswara.Api.Features.Orders.Commands;

namespace BatikNareswara.Api.Features.Orders.Serialization;

/// <summary>
/// System.Text.Json source generator context for Native AOT compliance.
/// All JSON-serializable types used in the Outbox pipeline must be registered here
/// to enable compile-time code generation and eliminate runtime reflection.
/// </summary>
[JsonSerializable(typeof(OrderPlacedEvent))]
[JsonSerializable(typeof(PlaceOrderCommand))]
[JsonSerializable(typeof(PlaceOrderResponse))]
[JsonSerializable(typeof(WebhookPayload))]
[JsonSerializable(typeof(OrderStatusDto))]
[JsonSerializable(typeof(ErrorResponse))]
[JsonSourceGenerationOptions(
    PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase,
    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    WriteIndented = false)]
public sealed partial class OutboxJsonContext : JsonSerializerContext;

/// <summary>
/// Domain event published when an order is successfully placed.
/// Serialized to JSON and stored in the outbox_messages table.
/// </summary>
public sealed record OrderPlacedEvent(
    Guid OrderId,
    string CustomerName,
    string CustomerEmail,
    Guid ProductId,
    int Quantity,
    decimal TotalPrice,
    DateTimeOffset OccurredAt
);

/// <summary>
/// Webhook dispatch envelope wrapping any outbox event for external delivery.
/// </summary>
public sealed record WebhookPayload(
    Guid MessageId,
    string EventType,
    string Payload,
    DateTimeOffset DispatchedAt
);

/// <summary>
/// DTO returned by the GET /api/orders/{id} endpoint.
/// </summary>
public sealed record OrderStatusDto(
    Guid Id,
    string CustomerName,
    string CustomerEmail,
    Guid ProductId,
    int Quantity,
    decimal TotalPrice,
    string Status,
    DateTimeOffset CreatedAt
);

/// <summary>
/// Standard error response DTO for API error payloads.
/// </summary>
public sealed record ErrorResponse(string Error);
