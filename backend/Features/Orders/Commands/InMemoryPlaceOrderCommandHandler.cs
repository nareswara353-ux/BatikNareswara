using System.Text.Json;
using BatikNareswara.Api.Features.Orders.Entities;
using BatikNareswara.Api.Features.Orders.Repositories;
using BatikNareswara.Api.Features.Orders.Serialization;
using Microsoft.EntityFrameworkCore;

namespace BatikNareswara.Api.Features.Orders.Commands;

public sealed class InMemoryPlaceOrderCommandHandler : IPlaceOrderCommandHandler
{
    private readonly AppDbContext _db;
    private readonly ILogger<InMemoryPlaceOrderCommandHandler> _logger;

    public InMemoryPlaceOrderCommandHandler(AppDbContext db, ILogger<InMemoryPlaceOrderCommandHandler> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PlaceOrderResponse> HandleAsync(PlaceOrderCommand command, CancellationToken cancellationToken = default)
    {
        // Validate product exists and compute price
        var product = await _db.Products.FindAsync(new object[] { command.ProductId }, cancellationToken);
        if (product is null)
            throw new InvalidOperationException($"Product with ID '{command.ProductId}' was not found.");

        var price = (product.DiscountPrice.HasValue && product.DiscountPrice.Value > 0) ? product.DiscountPrice.Value : product.OriginalPrice;

        var order = new Order
        {
            Id = Guid.NewGuid(),
            CustomerName = command.CustomerName,
            CustomerEmail = command.CustomerEmail,
            ProductId = command.ProductId,
            Quantity = command.Quantity,
            TotalPrice = price * command.Quantity,
            Status = OrderStatus.Pending,
            CreatedAt = DateTimeOffset.UtcNow
        };

        var outbox = new BatikNareswara.Api.Features.Orders.Entities.OutboxMessage
        {
            Id = Guid.NewGuid(),
            Type = "OrderPlacedEvent",
            Content = JsonSerializer.Serialize(new OrderPlacedEvent(order.Id, order.CustomerName, order.CustomerEmail, order.ProductId, order.Quantity, order.TotalPrice, order.CreatedAt), OutboxJsonContext.Default.OrderPlacedEvent),
            CreatedAt = DateTimeOffset.UtcNow,
            ProcessedAt = null
        };

        // In-memory provider does not support transactions. Perform simple save with best-effort behavior.
        try
        {
            _db.Orders.Add(order);
            _db.OrdersOutbox.Add(outbox);
            await _db.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("(InMemory) Order {OrderId} created and outbox queued.", order.Id);
            return new PlaceOrderResponse(order.Id, order.Status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "(InMemory) Failed to place order.");
            throw;
        }
    }
}
