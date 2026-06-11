using System.ComponentModel.DataAnnotations;

namespace BatikNareswara.Api.Features.Orders.Commands;

/// <summary>
/// CQRS command to place a new order. Validated at the endpoint level
/// before being dispatched to the handler.
/// </summary>
public sealed record PlaceOrderCommand(
    [property: Required, MaxLength(200)]
    string CustomerName,

    [property: Required, MaxLength(320), EmailAddress]
    string CustomerEmail,

    [property: Required]
    Guid ProductId,

    [property: Range(1, 100)]
    int Quantity
);

/// <summary>
/// Response returned after successful order placement.
/// </summary>
public sealed record PlaceOrderResponse(
    Guid OrderId,
    string Status
);
