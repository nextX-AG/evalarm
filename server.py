import asyncio
from aiohttp import web
import os
from aiohttp_cors import setup as cors_setup, ResourceOptions

async def start_static_server():
    app = web.Application()
    
    # CORS konfigurieren
    cors = cors_setup(app, defaults={
        "*": ResourceOptions(
            allow_credentials=True,
            expose_headers="*",
            allow_headers="*",
            allow_methods="*",
            max_age=3600
        )
    })
    
    # Statische Dateien mit CORS
    static_resource = app.router.add_static('/static/', path='./static/', name='static')
    cors.add(static_resource)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, 'localhost', 8076)
    await site.start()
    print("Static server started at http://localhost:8076")
    try:
        while True:
            await asyncio.sleep(3600)  # Keep the server running
    except KeyboardInterrupt:
        await runner.cleanup()

if __name__ == "__main__":
    asyncio.run(start_static_server()) 