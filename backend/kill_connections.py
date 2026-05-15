import asyncio
import asyncpg

async def kill():
    conn = await asyncpg.connect("postgresql://postgres:password@localhost:5432/postgres")
    result = await conn.execute("""
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = 'book_platform' AND pid <> pg_backend_pid()
    """)
    await conn.close()
    print("Conexiones terminadas:", result)

asyncio.run(kill())
