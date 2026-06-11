using BatikNareswara.Api.Features.Orders.Entities;
using Npgsql;

namespace BatikNareswara.Api.Features.Orders.Repositories;

/// <summary>
/// Dapper-free Outbox repository using raw NpgsqlCommand for Native AOT compliance.
/// Uses SELECT ... FOR UPDATE SKIP LOCKED to prevent duplicate processing
/// in multi-instance deployment scenarios.
/// </summary>
public sealed class OutboxRepository : IOutboxRepository
{
    private readonly string _connectionString;

    public OutboxRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("SupabaseConnection")
            ?? throw new InvalidOperationException(
                "Connection string 'SupabaseConnection' is not configured.");
    }

    public async Task InsertAsync(OutboxMessage message, NpgsqlTransaction transaction, CancellationToken cancellationToken = default)
    {
        var connection = transaction.Connection
            ?? throw new InvalidOperationException("Transaction has no associated connection.");

        const string sql = @"
            INSERT INTO outbox_messages (id, type, content, created_at, processed_at)
            VALUES (@Id, @Type, @Content, @CreatedAt, @ProcessedAt)";

        await using var cmd = new NpgsqlCommand(sql, connection, transaction);
        cmd.Parameters.AddWithValue("Id", message.Id);
        cmd.Parameters.AddWithValue("Type", message.Type);
        cmd.Parameters.AddWithValue("Content", message.Content);
        cmd.Parameters.AddWithValue("CreatedAt", message.CreatedAt);
        cmd.Parameters.AddWithValue("ProcessedAt", (object?)message.ProcessedAt ?? DBNull.Value);

        await cmd.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<OutboxMessage>> GetUnprocessedAsync(int batchSize, CancellationToken cancellationToken = default)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        // FOR UPDATE SKIP LOCKED ensures concurrent workers don't process the same message.
        // This is critical for horizontal scaling where multiple API instances
        // each run their own OutboxProcessorWorker.
        const string sql = @"
            SELECT id, type, content, created_at, processed_at
            FROM outbox_messages
            WHERE processed_at IS NULL
            ORDER BY created_at ASC
            LIMIT @BatchSize
            FOR UPDATE SKIP LOCKED";

        await using var tx = await connection.BeginTransactionAsync(cancellationToken);
        await using var cmd = new NpgsqlCommand(sql, connection, tx);
        cmd.Parameters.AddWithValue("BatchSize", batchSize);

        var results = new List<OutboxMessage>();
        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))
        {
            results.Add(new OutboxMessage
            {
                Id = reader.GetGuid(0),
                Type = reader.GetString(1),
                Content = reader.GetString(2),
                CreatedAt = reader.GetFieldValue<DateTimeOffset>(3),
                ProcessedAt = reader.IsDBNull(4) ? null : reader.GetFieldValue<DateTimeOffset>(4)
            });
        }

        await tx.CommitAsync(cancellationToken);
        return results;
    }

    public async Task MarkAsProcessedAsync(Guid messageId, CancellationToken cancellationToken = default)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        const string sql = @"
            UPDATE outbox_messages
            SET processed_at = NOW()
            WHERE id = @MessageId AND processed_at IS NULL";

        await using var cmd = new NpgsqlCommand(sql, connection);
        cmd.Parameters.AddWithValue("MessageId", messageId);

        await cmd.ExecuteNonQueryAsync(cancellationToken);
    }
}
