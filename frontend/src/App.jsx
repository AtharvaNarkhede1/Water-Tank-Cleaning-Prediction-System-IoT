import React, { useMemo } from "react";
import useSWR from "swr";
import "./App.css";

// ⚠️ Change this to your PC's LAN IP if React runs in browser on another device
const BASE_URL = "http://10.186.52.197:8000";

const fetcher = (url) => fetch(`${BASE_URL}${url}`).then((res) => res.json());

export default function App() {
  const [tanks, setTanks] = React.useState([
    {
      id: "tank1",
      name: "Main Building",
      location: "Rooftop",
      capacity: 1500,
      imageUrl: "/tank1.jpg",
    },
    {
      id: "tank2",
      name: "Annex Building",
      location: "Underground",
      capacity: 1900,
      imageUrl: "/tank2.jpg",
    },
  ]);

  // Fetch sensor and prediction data
  const { data: sensorData, error: sensorError } = useSWR("/data", fetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: true,
    shouldRetryOnError: true,
  });

  const { data: predictionData, error: predictionError } = useSWR(
    "/prediction/advanced",
    fetcher,
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
      shouldRetryOnError: true,
    }
  );

  // Debug logs
  console.log("Sensor Data:", sensorData);
  console.log("Prediction Data:", predictionData);

  // Map readings to tank IDs
  const readings = useMemo(() => {
    if (!sensorData) return {};
    return {
      tank1: sensorData.tank1 || {},
      tank2: sensorData.tank2 || {},
    };
  }, [sensorData]);

  // Map predictions to tank IDs
  const predictions = useMemo(() => {
    if (!predictionData) return {};
    return {
      tank1: predictionData.tank1_prediction || {},
      tank2: predictionData.tank2_prediction || {},
    };
  }, [predictionData]);

  // Update tank status
  async function updateStatus(tank, status) {
    try {
      const res = await fetch(`${BASE_URL}/api/tanks/${tank.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      alert("✅ Status updated!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to update status");
    }
  }

  // Send notification
  async function sendNotification(tankId) {
    try {
      const res = await fetch(`${BASE_URL}/api/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tankId, type: "cleaning_required" }),
      });
      if (!res.ok) throw new Error("Failed to send notification");
      alert("📨 Notification sent!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to send notification");
    }
  }

  return (
    <div className="table-container">
      <h1>Water Tanks Dashboard</h1>
      <table>
        <caption>All tanks with live readings & predictions</caption>
        <thead>
          <tr>
            <th>Tank</th>
            <th>Location</th>
            <th>Capacity</th>
            <th>pH</th>
            <th>TDS</th>
            <th>Turbidity</th>
            <th>Status</th>
            <th>Predicted Due</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tanks.length === 0 && (
            <tr>
              <td colSpan="9" className="empty">
                No tanks yet. Use Add Tank to create one.
              </td>
            </tr>
          )}
          {tanks.map((tank) => {
            const r = readings[tank.id] || {};
            const p = predictions[tank.id] || {};

            const statusText =
              p.status ||
              (sensorError || predictionError ? "Error" : "Loading...");
            const due = p.predicted_date || "-";
            const days = p.days_remaining;

            console.log("Tank:", tank.id, "Reading:", r, "Prediction:", p);

            return (
              <tr key={tank.id}>
                <td className="tank-info">
                  <img
                    src={
                      tank.imageUrl ||
                      "https://via.placeholder.com/60x40?text=Tank"
                    }
                    alt={tank.name}
                    className="tank-img"
                  />
                  <div>
                    <div className="tank-name">{tank.name}</div>
                    <div className="tank-id">{tank.id}</div>
                  </div>
                </td>
                <td>{tank.location}</td>
                <td>{tank.capacity ? `${tank.capacity} L` : "-"}</td>
                <td>{r.ph ? r.ph.toFixed(2) : "-"}</td>
                <td>{r.tds ? Math.round(r.tds) : "-"}</td>
                <td>{r.turbidity ? r.turbidity.toFixed(2) : "-"}</td>
                <td>
                  <span
                    className={`badge ${
                      statusText === "Good"
                        ? "badge-secondary"
                        : statusText === "Moderate"
                        ? "badge-warning"
                        : statusText === "Poor"
                        ? "badge-danger"
                        : statusText === "Error"
                        ? "badge-danger"
                        : "badge-default"
                    }`}
                  >
                    {statusText}
                  </span>
                </td>
                <td>
                  {due !== "-" ? new Date(due).toLocaleDateString() : "-"}
                  {typeof days === "number" && (
                    <div className="due-text">in {Math.max(0, days)} day(s)</div>
                  )}
                </td>
                <td className="actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => updateStatus(tank, "done")}
                  >
                    Mark Done
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => updateStatus(tank, "pending")}
                  >
                    Set Pending
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => sendNotification(tank.id)}
                  >
                    Notify
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
