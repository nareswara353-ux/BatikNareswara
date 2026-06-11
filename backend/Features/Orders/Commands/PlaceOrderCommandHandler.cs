using System.Text.Json;
using BatikNareswara.Api.Features.Orders.Entities;
using BatikNareswara.Api.Features.Orders.Repositories;
using BatikNareswara.Api.Features.Orders.Serialization;
using Npgsql;

namespace BatikNareswara.Api.Features.Orders.Commands;

/// <summary>
/// CQRS command handler interface for the PlaceOrder flow.
/// </summary>
public interface IPlaceOrderCommandHandler
{
    Task<PlaceOrderResponse> HandleAsync(PlaceOrderCommand command, CancellationToken cancellationToken = default);
}

/// <summary>
/// Handles the PlaceOrderCommand by atomically persisting the Order
/// and an OutboxMessage within a single database transaction.
///
/// This guarantees that either both the order AND the outbox event
/// are committed, or neither is — eliminating the dual-write problem
/// where an order could be saved but the event notification lost.
/// </summary>
public sealed class PlaceOrderCommandHandler : IPlaceOrderCommandHandler
{
    private readonly IOrderRepository _orderRepository;
    private readonly IOutboxRepository _outboxRepository;
    private readonly ILogger<PlaceOrderCommandHandler> _logger;
    private readonly string _connectionString;

    public PlaceOrderCommandHandler(
        IOrderRepository orderRepository,
        IOutboxRepository outboxRepository,
        IConfiguration configuration,
        ILogger<PlaceOrderCommandHandler> logger)
    {
        _orderRepository = orderRepository;
        _outboxRepository = outboxRepository;
        _logger = logger;
        _connectionString = configuration.GetConnectionString("SupabaseConnection")
            ?? throw new InvalidOperationException(
                "Connection string 'SupabaseConnection' is not configured.");
    }

    public async Task<PlaceOrderResponse> HandleAsync(PlaceOrderCommand command, CancellationToken cancellationToken = default)
    {
        // Open a dedicated connection for the atomic transaction
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);

        try
        {
            // Validate product exists and retrieve its price for total calculation
            var productPrice = await GetProductPriceAsync(command.ProductId, connection, transaction, cancellationToken);
            if (productPrice is null)
            {
                throw new InvalidOperationException(
                    $"Product with ID '{command.ProductId}' was not found.");
            }

            // Construct the Order aggregate
            var order = new Order
            {
                Id = Guid.NewGuid(),
                CustomerName = command.CustomerName,
                CustomerEmail = command.CustomerEmail,
                ProductId = command.ProductId,
                Quantity = command.Quantity,
                TotalPrice = productPrice.Value * command.Quantity,
                Status = OrderStatus.Pending,
                CreatedAt = DateTimeOffset.UtcNow
            };

            // Construct the domain event for the Outbox
            var orderPlacedEvent = new OrderPlacedEvent(
                OrderId: order.Id,
                CustomerName: order.CustomerName,
                CustomerEmail: order.CustomerEmail,
                ProductId: order.ProductId,
                Quantity: order.Quantity,
                TotalPrice: order.TotalPrice,
                OccurredAt: order.CreatedAt
            );

            var outboxMessage = new OutboxMessage
            {
                Id = Guid.NewGuid(),
                Type = "OrderPlacedEvent",
                Content = JsonSerializer.Serialize(orderPlacedEvent, OutboxJsonContext.Default.OrderPlacedEvent),
                CreatedAt = DateTimeOffset.UtcNow,
                ProcessedAt = null
            };

            // ═══════════════════════════════════════════════════════════════
            //  ATOMIC WRITE: Order + OutboxMessage in a single transaction
            // ═══════════════════════════════════════════════════════════════
            await _orderRepository.CreateOrderAsync(order, transaction, cancellationToken);
            await _outboxRepository.InsertAsync(outboxMessage, transaction, cancellationToken);

            // Commit both writes atomically
            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation(
                "Order {OrderId} placed successfully. OutboxMessage {OutboxId} queued for dispatch.",
                order.Id, outboxMessage.Id);

            return new PlaceOrderResponse(order.Id, order.Status);
        }
        catch (Exception ex) when (ex is not InvalidOperationException)
        {
            _logger.LogError(ex, "Failed to place order — rolling back transaction.");
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    /// <summary>
    /// Retrieves the effective product price (discount_price if set, otherwise original_price).
    /// Uses the same connection/transaction to maintain isolation level consistency.
    /// </summary>
    private static async Task<decimal?> GetProductPriceAsync(
        Guid productId,
        NpgsqlConnection connection,
        NpgsqlTransaction transaction,
        CancellationToken cancellationToken)
    {
        const string sql = @"
            SELECT COALESCE(NULLIF(discount_price, 0), original_price)
            FROM products
            WHERE id = @ProductId";

        await using var cmd = new NpgsqlCommand(sql, connection, transaction);
        cmd.Parameters.AddWithValue("ProductId", productId);

        var result = await cmd.ExecuteScalarAsync(cancellationToken);
        if (result is null || result is DBNull)
        {
            return null;
        }

        return Convert.ToDecimal(result);
    }
}
