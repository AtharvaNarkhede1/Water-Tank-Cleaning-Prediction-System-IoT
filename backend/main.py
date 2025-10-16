from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import date, timedelta

# --- Initialize FastAPI ---
app = FastAPI(
    title="Water Quality Monitor API",
    description="API for water tank monitoring and cleaning predictions"
)

# --- Enable CORS for frontend ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (adjust for production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
class SensorData(BaseModel):
    tds: float
    ph: float
    turbidity: float

class TankData(BaseModel):
    tank1: SensorData
    tank2: SensorData

# --- In-memory storage ---
latest_sensor_data = {}

# --- Health calculation helpers ---
def get_tds_health(tds: float) -> float:
    if tds < 300:
        return 100.0
    if tds > 1200:
        return 0.0
    return 100.0 - ((tds - 300) / (1200 - 300)) * 100.0

def get_ph_health(ph: float) -> float:
    if 6.5 <= ph <= 8.5:
        return 100.0
    deviation = min(abs(ph - 6.5), abs(ph - 8.5))
    return max(0.0, 100.0 - (deviation / 2.0) * 100.0)

def get_turbidity_health(turbidity: float) -> float:
    if turbidity < 1.0:
        return 100.0
    if turbidity > 10.0:
        return 0.0
    return 100.0 - ((turbidity - 1.0) / (10.0 - 1.0)) * 100.0

# --- API Endpoints ---

# ESP32 posts sensor data
@app.post("/data")
async def receive_data(data: TankData):
    global latest_sensor_data
    latest_sensor_data = data.dict()
    print("Received data from ESP32:", latest_sensor_data)
    return {"status": "success"}

# Frontend fetches latest sensor data
@app.get("/data")
async def get_data():
    if not latest_sensor_data:
        return {
            "tank1": {"tds": 0, "ph": 0, "turbidity": 0},
            "tank2": {"tds": 0, "ph": 0, "turbidity": 0}
        }
    return latest_sensor_data

# Advanced prediction logic
@app.get("/prediction/advanced")
async def get_advanced_prediction():
    if not latest_sensor_data:
        return {"error": "No sensor data available to make a prediction."}

    def calculate_prediction_for_tank(tank_data: dict):
        tds = tank_data.get("tds", 0)
        ph = tank_data.get("ph", 0)
        turbidity = tank_data.get("turbidity", 0)

        tds_health = get_tds_health(tds)
        ph_health = get_ph_health(ph)
        turbidity_health = get_turbidity_health(turbidity)

        weights = {"tds": 0.35, "ph": 0.25, "turbidity": 0.40}
        health_index = (
            tds_health * weights["tds"] +
            ph_health * weights["ph"] +
            turbidity_health * weights["turbidity"]
        )

        MIN_DAYS, MAX_DAYS = 1, 30
        days_to_cleaning = MIN_DAYS + round(((health_index / 100) ** 2) * (MAX_DAYS - MIN_DAYS))
        predicted_date = (date.today() + timedelta(days=days_to_cleaning)).isoformat()

        status = "Good"
        if 40 <= health_index < 75:
            status = "Moderate"
        elif health_index < 40:
            status = "Poor"

        return {
            "predicted_date": predicted_date,
            "days_remaining": days_to_cleaning,
            "status": status,
            "health_index": round(health_index, 2),
            "details": {
                "tds_health": round(tds_health, 2),
                "ph_health": round(ph_health, 2),
                "turbidity_health": round(turbidity_health, 2)
            }
        }

    prediction1 = calculate_prediction_for_tank(latest_sensor_data.get("tank1", {}))
    prediction2 = calculate_prediction_for_tank(latest_sensor_data.get("tank2", {}))

    return {"tank1_prediction": prediction1, "tank2_prediction": prediction2}

# Update tank status
@app.patch("/api/tanks/{tank_id}")
async def update_tank_status(tank_id: str, payload: dict):
    print(f"PATCH /api/tanks/{tank_id} with {payload}")
    return {"status": "success"}

# Send notification
@app.post("/api/notifications")
async def send_notification(payload: dict):
    print(f"POST /api/notifications with {payload}")
    return {"status": "success"}
