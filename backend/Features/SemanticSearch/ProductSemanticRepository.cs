using System.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace BatikNareswara.Api.Features.SemanticSearch;

public record SemanticProductDto(
    int Id,
    string Name,
    string Description,
    decimal Price,
    string ImageUrl
);

public interface IProductSemanticRepository
{
    Task<IEnumerable<SemanticProductDto>> SearchAsync(
        float[] queryVector,
        int limit = 6,
        CancellationToken cancellationToken = default
    );
}

public class ProductSemanticRepository : IProductSemanticRepository
{
    private readonly AppDbContext _dbContext;

    public ProductSemanticRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IEnumerable<SemanticProductDto>> SearchAsync(
        float[] queryVector,
        int limit = 6,
        CancellationToken cancellationToken = default
    )
    {
        var results = new List<SemanticProductDto>();
        var connection = _dbContext.Database.GetDbConnection() as NpgsqlConnection;

        if (connection == null)
            throw new InvalidOperationException("Connection is not an NpgsqlConnection.");

        if (connection.State != ConnectionState.Open)
            await connection.OpenAsync(cancellationToken);

        // Convert the float[] array to PostgreSQL vector string format: "[0.1, 0.2, ...]"
        var vectorString = "[" + string.Join(",", queryVector) + "]";

        using var command = connection.CreateCommand();
        command.CommandText =
            @"
            SELECT id, name, description, price, image_url 
            FROM products_semantic 
            ORDER BY description_vector <=> @vector::vector 
            LIMIT @limit";

        command.Parameters.AddWithValue("vector", NpgsqlTypes.NpgsqlDbType.Text, vectorString);
        command.Parameters.AddWithValue("limit", limit);

        using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            results.Add(
                new SemanticProductDto(
                    Id: reader.GetInt32(0),
                    Name: reader.GetString(1),
                    Description: reader.IsDBNull(2) ? string.Empty : reader.GetString(2),
                    Price: reader.GetDecimal(3),
                    ImageUrl: reader.IsDBNull(4) ? string.Empty : reader.GetString(4)
                )
            );
        }

        return results;
    }
}
