import TabSwitch from "@/components/custom-ui/tab-switch";
import TaskReview from "./task-review";
import TaskCardGrid from "@/components/tasks/task-card";
import ReviewChecklist from "./review-checklist";

interface Task {
    task_type: string;
    parent_task_chain?: { id: number; name: string }[];
    review_checklist?: {
        checklist_id: number;
        checklist_name: string;
        is_completed: boolean;
        created_by: number;
        created_by_name: string;
        created_at: string;
    }[];
}

export default function ReviewTaskTabSwitch({ task, setTask }: { task: Task; setTask: (task: Task) => void }) {
    const tabs = [
        {
            label: "Task Review",
            component: <TaskReview task={task} setTask={setTask} />,
            condition: task.task_type === "Review",
        },
        {
            label: "Review Checklist",
            component: <ReviewChecklist review_checklist={task.review_checklist} />,
        },
        {
            label: "Parent Tasks",
            component: <TaskCardGrid taskList={task.parent_task_chain || []} showDeleteButton={false} />,
            condition: task.task_type === "Review",
        },
    ].filter((tab) => tab.condition === undefined || tab.condition);

    return <TabSwitch tabs={tabs} defaultTab="Task Review" />;
}
