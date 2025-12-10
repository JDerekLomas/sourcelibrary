import { useEffect, useState } from "react";
import { api } from "../api";

export function SharedInfrastructure() {
  const [status, setStatus] = useState(null);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    api.getInfraStatus().then(setStatus);
    api.getRequests().then(setRequests);
  }, []);

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Shared Infrastructure</h2>
          <p>Monitor pipelines, queues, and outstanding diff reviews.</p>
        </div>
      </header>

      {status ? (
        <div className="status-grid">
          {Object.entries(status).map(([key, value]) => (
            <div key={key} className="status-card">
              <h4>{key.replace(/_/g, " ")}</h4>
              <p>{value}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>Loading status...</p>
      )}

      <h3>Pending Edit Requests</h3>
      <ul className="request-list">
        {requests.map((request) => (
          <li key={request.id}>
            <div>
              <strong>{request.request_type.toUpperCase()}</strong> · Page {request.page_id.slice(0, 5)}
            </div>
            <small>{new Date(request.created_at).toLocaleString()}</small>
            <span className={`pill pill--${request.status}`}>{request.status}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
