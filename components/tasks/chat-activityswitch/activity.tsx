
"use client";

import { useEffect, useState } from "react";
import { fetchLogSummary } from "@/lib/tasks/task";

interface ActivityProps {
  task: { task_id: number };
}

export default function Activity({ task }: ActivityProps) {
  const [logSummary, setLogSummary] = useState<string[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoading(true);
        const response = await fetchLogSummary(task.task_id);
        setLogSummary(response.log_summary);
      } catch (err) {
        console.error("Error fetching log summary:", err);
        setError("Failed to fetch log summary.");
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, [task.task_id]);

  if (loading) {
    return <p className="activity-loading">Loading activity logs...</p>;
  }

  if (error) {
    return <p className="activity-error">{error}</p>;
  }

  if (!logSummary || logSummary.length === 0) {
    return <p className="activity-empty">No activity logs available.</p>;
  }

  return (
    <div className="activity-container p-4">
      <ul className="activity-list">
        {logSummary.map((log, index) => (
          <li key={index} className="activity-item">
            {log}
          </li>
        ))}
      </ul>
    </div>

  );
}
