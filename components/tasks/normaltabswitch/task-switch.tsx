import TabSwitch from "@/components/custom-ui/tab-switch";
import TaskChecklist from "@/components/tasks/normaltabswitch/task-checklist";
import TaskOutput from "@/components/tasks/normaltabswitch/task-output";

interface Task {
    task_type: string;
    checklists?: { id: number; name: string }[]; // Adjust the type based on your data structure
}

export default function TaskTabSwitch({ task, setTask }: { task: Task; setTask: (task: Task) => void }) {
    const tabs = [
        {
            label: "Checklist",
            component: <TaskChecklist checklists={task.checklists || []} task={task} setTask={setTask} />,
            condition: task.task_type !== "Review" || (task.checklists && task.checklists.length > 0),
        },
        {
            label: "Output",
            component: <TaskOutput task={task} setTask={setTask} />,
        },

    ].filter((tab) => tab.condition === undefined || tab.condition); // Filter tabs based on conditions

    return <TabSwitch tabs={tabs} defaultTab={tabs[0]?.label || "Output"} />;
}