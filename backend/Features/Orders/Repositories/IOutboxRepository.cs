using BatikNareswara.Api.Features.Orders.Entities;

namespace BatikNareswara.Api.Features.Orders.Repositories;

/// <summary>
/// Repository interface for Outbox message persistence operations.
/// Used by both the command handler (insert) and the background worker (poll + mark).
/// </summary>
public interface IOutboxRepository
{
    /// <summary>
    /// Inserts a new outbox message within the provided transaction scope.
    /// Must share the same transaction as the domain entity write for atomicity.
    /// </summary>
    Task InsertAsync(OutboxMessage message, Npgsql.NpgsqlTransaction transaction, CancellationToken cancellationToken = default);

    /// <summary>
    /// Fetches a batch of unprocessed outbox messages, ordered by creation time.
    /// Uses SELECT ... FOR UPDATE SKIP LOCKED for safe concurrent processing.
    /// </summary>
    Task<IReadOnlyList<OutboxMessage>> GetUnprocessedAsync(int batchSize, CancellationToken cancellationToken = default);

    /// <summary>
    /// Marks a specific outbox message as processed by setting its processed_at timestamp.
    /// </summary>
    Task MarkAsProcessedAsync(Guid messageId, CancellationToken cancellationToken = default);
}
