using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace BatikNareswara.Api.Features.SemanticSearch;

public interface IGeminiEmbeddingService
{
    Task<float[]> GenerateEmbeddingAsync(
        string text,
        CancellationToken cancellationToken = default
    );
}

public class GeminiEmbeddingService : IGeminiEmbeddingService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GeminiEmbeddingService> _logger;

    public GeminiEmbeddingService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<GeminiEmbeddingService> logger
    )
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<float[]> GenerateEmbeddingAsync(
        string text,
        CancellationToken cancellationToken = default
    )
    {
        var apiKey = _configuration["Gemini:ApiKey"];
        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogError(
                "Gemini API Key is not configured. Please set 'Gemini:ApiKey' in appsettings.json."
            );
            throw new InvalidOperationException("Gemini API Key is not configured.");
        }

        var url =
            $"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={apiKey}";

        var payload = new
        {
            model = "models/text-embedding-004",
            content = new { parts = new[] { new { text = text } } },
        };

        var content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );
        var response = await _httpClient.PostAsync(url, content, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError(
                "Gemini API call failed: {StatusCode} - {ErrorBody}",
                response.StatusCode,
                errorBody
            );
            throw new HttpRequestException(
                $"Gemini API call failed with status code {response.StatusCode}"
            );
        }

        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
        var result = JsonSerializer.Deserialize<GeminiEmbeddingResponse>(
            responseBody,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
        );

        if (result?.Embedding?.Values == null || result.Embedding.Values.Count == 0)
        {
            throw new InvalidOperationException(
                "Gemini API returned an empty or invalid embedding."
            );
        }

        return result.Embedding.Values.ToArray();
    }

    private class GeminiEmbeddingResponse
    {
        [JsonPropertyName("embedding")]
        public GeminiEmbeddingData? Embedding { get; set; }
    }

    private class GeminiEmbeddingData
    {
        [JsonPropertyName("values")]
        public List<float>? Values { get; set; }
    }
}
