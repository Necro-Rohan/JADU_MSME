import os
import structlog
import psycopg2
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Dict, Any
from apscheduler.schedulers.background import BackgroundScheduler
from contextlib import asynccontextmanager

from decision_engine import DecisionEngine

log = structlog.get_logger()

# DB Connection
def get_db_connection():
    return psycopg2.connect(os.getenv("DATABASE_URL"))

# Scheduled Job
def scheduled_agent_job():
    log.info("cron_job_started")
    try:
        conn = get_db_connection()
        engine = DecisionEngine(conn)
        engine.run_cycle('CRON', {})
        conn.close()
    except Exception as e:
        log.error("cron_job_failed", error=str(e))

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    log.info("agent_startup")
    scheduler = BackgroundScheduler()
    # Run every 30 minutes. For demo purposes, maybe every 1 minute is better to see results?
    # Let's set it to 15 minutes for "Production-like" MVP.
    scheduler.add_job(scheduled_agent_job, 'interval', minutes=15)
    scheduler.start()
    yield
    # Shutdown
    scheduler.shutdown()

app = FastAPI(lifespan=lifespan)

class AgentRunRequest(BaseModel):
    trigger: str
    payload: Optional[Dict[str, Any]] = {}

@app.get("/")
def read_root():
    return {"status": "Agent is Running with Scheduler"}

def run_agent_task(trigger: str, payload: dict):
    conn = None
    try:
        conn = get_db_connection()
        engine = DecisionEngine(conn)
        engine.run_cycle(trigger, payload)
    except Exception as e:
        log.error("agent_task_failed", error=str(e))
    finally:
        if conn:
            conn.close()

@app.post("/agent/run")
async def trigger_agent(request: AgentRunRequest, background_tasks: BackgroundTasks):
    log.info("agent_trigger_received", trigger=request.trigger)
    background_tasks.add_task(run_agent_task, request.trigger, request.payload)
    return {"status": "Agent run initiated", "trigger": request.trigger}
