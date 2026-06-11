using BatikNareswara.Api.Features.Orders.Entities;
using Npgsql;

namespace BatikNareswara.Api.Features.Orders.Repositories;

/// <summary>
/// Dapper-based Order repository using raw parameterized SQL.
/// Fully Native AOT compatible — no EF Core reflection, no dynamic LINQ.
/// </summary>
public sealed class OrderRepository : IOrderRepository
{
    private readonly string _connectionString;

    public OrderRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("SupabaseConnection")
            ?? throw new InvalidOperationException(
                "Connection string 'SupabaseConnection' is not configured.");
    }

    public async Task CreateOrderAsync(Order order, NpgsqlTransaction transaction, CancellationToken cancellationToken = default)
    {
        var connection = transaction.Connection
            ?? throw new InvalidOperationException("Transaction has no associated connection.");

        const string sql = @"
            INSERT INTO orders (id, customer_name, customer_email, product_id, quantity, total_price, status, created_at)
            VALUES (@Id, @CustomerName, @CustomerEmail, @ProductId, @Quantity, @TotalPrice, @Status, @CreatedAt)";

        await using var cmd = new NpgsqlCommand(sql, connection, transaction);
        cmd.Parameters.AddWithValue("Id", order.Id);
        cmd.Parameters.AddWithValue("CustomerName", order.CustomerName);
        cmd.Parameters.AddWithValue("CustomerEmail", order.CustomerEmail);
        cmd.Parameters.AddWithValue("ProductId", order.ProductId);
        cmd.Parameters.AddWithValue("Quantity", order.Quantity);
        cmd.Parameters.AddWithValue("TotalPrice", order.TotalPrice);
        cmd.Parameters.AddWithValue("Status", order.Status);
        cmd.Parameters.AddWithValue("CreatedAt", order.CreatedAt);

        await cmd.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task<Order?> GetOrderByIdAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        const string sql = @"
            SELECT id, customer_name, customer_email, product_id, quantity, total_price, status, created_at
            FROM orders
            WHERE id = @OrderId";

        await using var cmd = new NpgsqlCommand(sql, connection);
        cmd.Parameters.AddWithValue("OrderId", orderId);

        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return new Order
        {
            Id = reader.GetGuid(0),
            CustomerName = reader.GetString(1),
            CustomerEmail = reader.GetString(2),
            ProductId = reader.GetGuid(3),
            Quantity = reader.GetInt32(4),
            TotalPrice = reader.GetDecimal(5),
            Status = reader.GetString(6),
            CreatedAt = reader.GetFieldValue<DateTimeOffset>(7)
        };
    }
}
