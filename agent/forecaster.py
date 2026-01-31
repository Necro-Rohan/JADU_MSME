import structlog

log = structlog.get_logger()

class Forecaster:
    def __init__(self, db_conn):
        self.db_conn = db_conn

    def predict_demand(self, item_id: str) -> float:
        log.info("predicting_demand", item_id=item_id)
        return 5.0  # dummy value