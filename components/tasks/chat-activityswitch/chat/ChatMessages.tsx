
import React from "react";
import { format } from "date-fns";
import { Message } from "./types";
import { useUser } from "@/hooks/usercontext";


function isNewDay(current: Date, previous?: Date): boolean {
    if (!previous) return true;
    return (
        current.getDate() !== previous.getDate() ||
        current.getMonth() !== previous.getMonth() ||
        current.getFullYear() !== previous.getFullYear()
    );
}

export const ChatMessages = ({ messages, scrollRef, setTopMessageRef }: { messages: Message[]; scrollRef: React.RefObject<HTMLDivElement | null>; setTopMessageRef?: (el: HTMLDivElement | null) => void }) => {
    const { user } = useUser(); // Access current user

    console.log("🔍 Current User:", user); // Log the current user

    return (
        <div
            ref={scrollRef}
            className="flex flex-col flex-grow overflow-y-auto p-3 bg-[#f0eae3] space-y-3"
            style={{ minHeight: 0, maxHeight: "100%" }}
        >
            <div className="flex-grow" /> {/* Spacer pushes messages down */}

                        {messages.map((msg, index) => {
                const prevMsg = messages[index - 1];
                const showDate = isNewDay(new Date(msg.timestamp), prevMsg && new Date(prevMsg.timestamp));
            
                // Determine if this is the first message from the sender in the group
                const isFirstMessageFromSender = !prevMsg || prevMsg.sender_id !== msg.sender_id;
            
                // Check if the current message is from the logged-in user
                const isCurrentUser = msg.sender_id === user?.employee_id;
            
                // Adjust margin based on whether the sender is the same as the previous message
                const marginTop = !prevMsg || prevMsg.sender_id !== msg.sender_id ? "12px" : "2px";
            
                return (
                    <div
                        key={msg.message_id}
                        className="flex flex-col items-stretch"
                        ref={index === 0 && setTopMessageRef ? setTopMessageRef : undefined}
                        style={{ marginTop }} // Dynamically set the margin
                    >
                        {/* Show date separator */}
                        {showDate && (
                            <div className="text-xs text-center text-[#00000099] my-3">
                                <div className="px-3 py-1 bg-[#ffffffe6] inline rounded-[5px]">
                                    {format(new Date(msg.timestamp), "dd/MM/yyyy")}
                                </div>
                            </div>
                        )}
            
                        {/* Show sender name for the first message in a group */}
                        {!isCurrentUser && isFirstMessageFromSender && (
                            <p className="text-xs text-gray-500 font-semibold mb-1">
                                {msg.sender_name || "Unknown"}
                            </p>
                        )}
            
                        {/* Message bubble */}
                        <div
                            className={`relative max-w-xs px-2 py-2 text-sm shadow-sm whitespace-pre-wrap break-words overflow-x-auto rounded-[7.5px] ${
                                isCurrentUser
                                    ? "ml-auto bg-[#d9fdd3] text-gray-900 rounded-tr-none"
                                    : "mr-auto bg-white text-gray-900 border border-gray-300 rounded-tl-none"
                            }`}
                            style={{ wordBreak: "break-word" }}
                        >
                            <div className="inline-block w-full">
                                <span className="inline break-words break-all">{msg.message}</span>
                                <span className="float-right text-[8px] text-[#00000099] pl-2 whitespace-nowrap">
                                    {format(new Date(msg.timestamp), "p")}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};