from aiohttp import web
import os

async def init_static_server():
    app = web.Application()
    app.router.add_static('/static/', path='./static/', name='static')
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, 'localhost', 8076)
    await site.start() 