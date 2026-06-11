using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BatikNareswara.Api.Features.Orders.Entities;

[Table("orders")]
public sealed class Order
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Required]
    [Column("customer_name")]
    [MaxLength(200)]
    public string CustomerName { get; set; } = string.Empty;

    [Required]
    [Column("customer_email")]
    [MaxLength(320)]
    public string CustomerEmail { get; set; } = string.Empty;

    [Column("product_id")]
    public Guid ProductId { get; set; }

    [Column("quantity")]
    public int Quantity { get; set; }

    [Column("total_price")]
    public decimal TotalPrice { get; set; }

    [Required]
    [Column("status")]
    [MaxLength(50)]
    public string Status { get; set; } = OrderStatus.Pending;

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }
}

public static class OrderStatus
{
    public const string Pending = "pending";
    public const string Confirmed = "confirmed";
    public const string Processing = "processing";
    public const string Shipped = "shipped";
    public const string Delivered = "delivered";
    public const string Cancelled = "cancelled";
}
