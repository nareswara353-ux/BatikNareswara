using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BatikNareswara.Api.Features.Orders.Entities;

[Table("outbox_messages")]
public sealed class OutboxMessage
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Required]
    [Column("type")]
    [MaxLength(255)]
    public string Type { get; set; } = string.Empty;

    [Required]
    [Column("content")]
    public string Content { get; set; } = string.Empty;

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }

    [Column("processed_at")]
    public DateTimeOffset? ProcessedAt { get; set; }
}
