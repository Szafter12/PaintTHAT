using Microsoft.EntityFrameworkCore;
using WebApi.Models;

namespace WebApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<GameSession> Games => Set<GameSession>();
    public DbSet<RoundRecord> Rounds => Set<RoundRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<GameSession>()
            .HasMany(g => g.Rounds)
            .WithOne(r => r.GameSession)
            .HasForeignKey(r => r.GameSessionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}