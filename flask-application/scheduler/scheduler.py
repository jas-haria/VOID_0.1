from apscheduler.schedulers.background import BackgroundScheduler
from pytz import timezone

from service import quora_scraping_service
import config

scheduler = BackgroundScheduler()

scheduler.add_job(func=quora_scraping_service.refresh_all_stats, trigger='cron', hour=config.run_scripts_at_hour, minute=config.run_scripts_at_minute, timezone=timezone('Asia/Kolkata'))