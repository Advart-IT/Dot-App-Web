
interface ReviewChecklistProps {
  review_checklist?: {
    checklist_id: number;
    checklist_name: string;
    is_completed: boolean;
    created_by: number;
    created_by_name: string;
    created_at: string;
  }[];
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  const hours = date.getHours();
  const period = hours < 12 ? "AM" : "PM";
  const formattedHour = hours % 12 || 12;
  return `${formattedHour} ${period}`;
}

export default function ReviewChecklist({ review_checklist }: ReviewChecklistProps) {
  const groupedChecklist = review_checklist?.reduce((acc: Record<string, Record<string, any[]>>, checklist) => {
    const date = new Date(checklist.created_at).toLocaleDateString();
    const hour = formatTime(checklist.created_at);
    if (!acc[date]) acc[date] = {};
    if (!acc[date][hour]) acc[date][hour] = [];
    acc[date][hour].push(checklist);
    return acc;
  }, {});

  return (
    <div className="review-checklist-container">
      {groupedChecklist ? (
        Object.entries(groupedChecklist).map(([date, timeGroups]) => (
          <div key={date} className="review-checklist-group">
            <h3 className="review-checklist-date">{date}</h3>
            {Object.entries(timeGroups).map(([hour, checklists]) => (
              <div key={hour}>
                <h4 className="review-checklist-time">{hour}</h4>
                <ul className="review-checklist-list">
                  {checklists.map((checklist) => (
                    <li key={checklist.checklist_id} className="review-checklist-item">
                      <div>
                        <strong className="review-checklist-name">{checklist.checklist_name}</strong>
                        <p className="review-checklist-meta">
                          Created by: {checklist.created_by_name}
                        </p>
                      </div>
                      <span
                        className={`review-checklist-status ${
                          checklist.is_completed ? "completed" : "pending"
                        }`}
                      >
                        {checklist.is_completed ? "Completed" : "Pending"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))
      ) : (
        <p className="review-checklist-empty">No review checklist available.</p>
      )}
    </div>
  );
}
