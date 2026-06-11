using Microsoft.AspNetCore.Mvc;

namespace BatikNareswara.Api.Features.SemanticSearch;

[ApiController]
[Route("api/products")]
public class SemanticSearchController : ControllerBase
{
    private readonly IGeminiEmbeddingService _embeddingService;
    private readonly IProductSemanticRepository _repository;
    private readonly ILogger<SemanticSearchController> _logger;

    public SemanticSearchController(
        IGeminiEmbeddingService embeddingService,
        IProductSemanticRepository repository,
        ILogger<SemanticSearchController> logger
    )
    {
        _embeddingService = embeddingService;
        _repository = repository;
        _logger = logger;
    }

    [HttpGet("search-semantic")]
    public async Task<IActionResult> SearchSemantic(
        [FromQuery] string q,
        CancellationToken cancellationToken
    )
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return BadRequest(new { error = "Query parameter 'q' is required." });
        }

        try
        {
            // 1. Convert natural language query to embedding vector via Gemini
            var queryVector = await _embeddingService.GenerateEmbeddingAsync(q, cancellationToken);

            // 2. Search database using Cosine Distance
            var results = await _repository.SearchAsync(queryVector, limit: 6, cancellationToken);

            return Ok(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during semantic search for query: {Query}", q);
            return StatusCode(
                500,
                new { error = "An error occurred while processing your semantic search request." }
            );
        }
    }
}
