using WebApi.Models;
using Microsoft.EntityFrameworkCore;


namespace WebApi.Data
{

    public class app_db : DbContext
    {
        public app_db(DbContextOptions<app_db> options) : base(options) { }
        public DbSet<users> Users { get; set; }
        public DbSet<words> Words { get; set; }

    }
}

