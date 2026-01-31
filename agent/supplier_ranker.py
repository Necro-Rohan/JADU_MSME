import structlog
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import MinMaxScaler
from typing import List, Dict

log = structlog.get_logger()

class SupplierRanker:
    def __init__(self, db_conn):
        self.db_conn = db_conn
        self.model = None
        self.scaler = MinMaxScaler()
        self._load_or_train_model()

    def _load_or_train_model(self):
        """Try to load or train a simple Random Forest from historical data"""
        try:
            # Example table: purchase_history
            # Columns: supplier_id, item_id, price, lead_time_days, reliability_score,
            #          urgency_level (1-10), actual_delay_days, satisfaction_score (target)
            query = """
                SELECT 
                    supplier_id, price, lead_time_days, reliability_score,
                    urgency_level, actual_delay_days, satisfaction_score
                FROM purchase_history
                WHERE satisfaction_score IS NOT NULL
            """
            df = pd.read_sql(query, self.db_conn)

            if len(df) < 10:
                log.warning("Not enough historical data for RF training — using fallback")
                self.model = None
                return

            # Features
            X = df[['price', 'lead_time_days', 'reliability_score', 'urgency_level', 'actual_delay_days']]
            y = df['satisfaction_score']  # target: higher = better supplier performance

            # Scale features (important for RF stability)
            X_scaled = self.scaler.fit_transform(X)

            # Train simple RF
            self.model = RandomForestRegressor(
                n_estimators=100,
                max_depth=6,
                random_state=42,
                n_jobs=-1
            )
            self.model.fit(X_scaled, y)
            log.info("RandomForest model trained", n_samples=len(df))

        except Exception as e:
            log.error("Failed to train RF model", error=str(e))
            self.model = None

    def rank_suppliers(self, item_id: str, urgency: str = 'NORMAL') -> List[Dict]:
        """
        Rank suppliers using Random Forest if trained, else fallback to rule-based.
        Returns list sorted by descending score.
        """
        cur = self.db_conn.cursor()

        # Fetch available suppliers for this item
        query = """
            SELECT s.id, s.name, s.reliability_score, si.price, si.lead_time_days
            FROM supplier_items si
            JOIN suppliers s ON si.supplier_id = s.id
            WHERE si.item_id = %s AND s.deleted_at IS NULL
        """
        cur.execute(query, (item_id,))
        suppliers = cur.fetchall()
        cur.close()

        if not suppliers:
            log.info("No suppliers found for item", item_id=item_id)
            return []

        # Convert urgency to numeric level
        urgency_level = 8 if urgency == 'URGENT' else 4  # example mapping

        scored_suppliers = []

        for s in suppliers:
            s_id, name, reliability, price, lead_time = s
            reliability = float(reliability or 70.0)
            price = float(price)
            lead_time = float(lead_time or 7)

            # Estimated delay (simple proxy if no real data)
            est_delay = lead_time * 0.2  # e.g. 20% delay on average

            if self.model is not None:
                # Prepare input for prediction (same order as training)
                features = np.array([[price, lead_time, reliability, urgency_level, est_delay]])
                features_scaled = self.scaler.transform(features)
                score = self.model.predict(features_scaled)[0]
            else:
                # Fallback rule-based (same as your original logic)
                price_score = 100 / max(price, 1)
                speed_score = 10 / max(lead_time, 1)
                w_price = 0.4
                w_speed = 0.5 if urgency == 'URGENT' else 0.3
                w_rel = 0.4 if urgency == 'URGENT' else 0.3
                score = (price_score * w_price) + (speed_score * w_speed) + (reliability * w_rel)

            scored_suppliers.append({
                "supplier_id": s_id,
                "name": name,
                "score": float(score),
                "details": {
                    "price": price,
                    "lead_time_days": lead_time,
                    "reliability": reliability,
                    "urgency_used": urgency_level
                }
            })

        # Sort descending by score
        scored_suppliers.sort(key=lambda x: x['score'], reverse=True)

        log.info("Suppliers ranked", item_id=item_id, urgency=urgency, count=len(scored_suppliers))
        return scored_suppliers