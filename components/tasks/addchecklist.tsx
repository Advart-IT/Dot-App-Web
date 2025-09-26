import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { addChecklist } from "@/lib/tasks/task"; // Import the API function
import SmartInputBox from "@/components/custom-ui/input-box"; // Import SmartInputBox

interface AddChecklistProps {
    onAdd: (newChecklist: any) => void; // Callback to pass the newly added checklist to the parent
    task_id?: number; // Optional task_id to determine API behavior
}

// Use forwardRef to allow the parent to access the ref
const AddChecklist = forwardRef((props: AddChecklistProps, ref) => {
    const { onAdd, task_id } = props;
    const [checklistName, setChecklistName] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [localChecklistNames, setLocalChecklistNames] = useState<string[]>([]); // Store checklist names locally
    const inputRef = useRef<HTMLInputElement | null>(null); // Ref for SmartInputBox

    // Expose the reset function to the parent via ref
    useImperativeHandle(ref, () => ({
        reset: () => {
            setChecklistName(""); // Clear the input field
            setIsAdding(false); // Close the input box
            setLocalChecklistNames([]); // Clear local checklist names
        },
    }));

    const handleSave = async () => {
        // Check if the checklist name is empty
        if (!checklistName.trim()) {
            return; // Exit the function if the name is empty
        }
        if (task_id) {
            try {
                const payload = { task_id, checklist_names: [checklistName] };
                const newChecklist = await addChecklist(payload); // Call the API
                onAdd(newChecklist); // Pass the new checklist to the parent
            } catch (err) {
                console.error("❌ Failed to add checklist via API:", err);
            }
        } else {
            setLocalChecklistNames((prev) => {
                const updatedNames = [...prev, checklistName];
                onAdd(updatedNames.join(",")); // Send the updated names as a comma-separated string to the parent
                return updatedNames;
            });
        }

        // Reset the input field
        setChecklistName("");
        setIsAdding(false);
    };

    const handleFocusInput = (e: React.MouseEvent<HTMLDivElement>) => {
        if (inputRef.current) {
            inputRef.current.focus();
        } else {
            console.log("⚠️ Click ignored due to exempt element");
        }
    };

    return (
        <div className="checklist-container" onClick={handleFocusInput}>
            {/* Display Local Checklist Names */}
            {!task_id && localChecklistNames.length > 0 && (
                <div className="w-full">
                    <div className="space-y-2">
                        {localChecklistNames.map((name, index) => (
                            <div key={index} className="flex items-center space-x-2 w-full">
                                <SmartInputBox
                                    value={name}
                                    onChange={(updatedName) => {
                                        setLocalChecklistNames((prev) => {
                                            const updatedNames = [...prev];
                                            updatedNames[index] = updatedName; // Update the specific checklist name
                                            return updatedNames;
                                        });
                                    }}
                                    placeholder="Edit checklist name"
                                    rows={1}
                                    autoExpand={true}
                                    onChangeComplete={() => {
                                        onAdd(localChecklistNames.join(",")); // Send updated names to the parent
                                    }}
                                    showCancelButton={true}
                                    onCancel={() => {
                                        setLocalChecklistNames((prev) => {
                                            const updatedNames = prev.filter((_, i) => i !== index); // Remove the checklist
                                            onAdd(updatedNames.join(",")); // Send updated names to the parent
                                            return updatedNames;
                                        });
                                    }}
                                    isTextarea={true}
                                    className="flex-grow" // Ensure the input box spans the full width
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add Checklist Button */}
            <div className="w-full">
                {isAdding ? (
                    <div
                        onClick={(e) => {
                            const target = e.target as HTMLElement;

                            // Check if the clicked element is a <textarea>
                            if (target.tagName.toLowerCase() === "textarea") {
                                setTimeout(() => {
                                    if (inputRef.current) {
                                        inputRef.current.focus();
                                    } else {
                                        console.log("⚠️ Input/textarea ref is null after textarea click");
                                    }
                                }, 0); // Delay to ensure the textarea is rendered before focusing
                            } else {
                                console.log("⚠️ Click occurred outside the <textarea>");
                            }
                        }}
                        className="w-full"
                    >
                        <SmartInputBox
                            ref={inputRef} // Attach the ref to SmartInputBox
                            value={checklistName}
                            onChange={(value) => setChecklistName(value)}
                            placeholder="Enter checklist name"
                            rows={1} // Use a single row for the textarea
                            autoExpand={true} // Enable auto-expansion
                            onChangeComplete={() => {
                                if (checklistName.trim()) {
                                    handleSave(); // Save the checklist name
                                }
                            }}
                            showCancelButton={true} // Show the cancel button
                            onCancel={() => {
                                setChecklistName(""); // Clear the input field
                                setIsAdding(false); // Close the input box
                            }}
                            isTextarea={true}
                        />
                    </div>
                ) : (
                    <button
                        onClick={() => {
                            setIsAdding(true);
                            setTimeout(() => {
                                if (inputRef.current) {
                                    inputRef.current.focus();
                                } else {
                                    console.log("⚠️ Input/textarea ref is null after Add Checklist button click");
                                }
                            }, 0); // Delay to ensure the input is rendered before focusing
                        }}
                        className="add-checklist-button"
                    >
                        + Add Checklist
                    </button>
                )}
            </div>
        </div>
    );
});

export default AddChecklist;