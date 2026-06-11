using BatikNareswara.Api.Features.Orders.Entities;

namespace BatikNareswara.Api.Features.Orders.Repositories;

/// <summary>
/// Repository interface for Order persistence operations.
/// Implementations use Dapper with parameterized SQL for AOT compatibility.
/// </summary>
public interface IOrderRepository
{
    /// <summary>
    /// Persists a new order within the provided transaction scope.
    /// The caller is responsible for committing or rolling back the transaction.
    /// </summary>
    Task CreateOrderAsync(Order order, Npgsql.NpgsqlTransaction transaction, CancellationToken cancellationToken = default);

    /// <summary>
    /// Retrieves an order by its unique identifier. Returns null if not found.
    /// </summary>
    Task<Order?> GetOrderByIdAsync(Guid orderId, CancellationToken cancellationToken = default);
}
