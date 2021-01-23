from apscheduler.schedulers.background import BackgroundScheduler
from pytz import timezone

from service import quora_scraping_service

scheduler = BackgroundScheduler()

scheduler.add_job(func=quora_scraping_service.refresh_all_stats, trigger='cron', hour=0, timezone=timezone('Asia/Kolkata'))