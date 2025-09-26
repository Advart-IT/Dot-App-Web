import React, { useEffect, useRef, useState } from "react";
import { fetchChatHistory } from "@/lib/tasks/task";
import { initializeWebSocket } from "@/lib/tasks/websocket";
import { ChatHeaderActivity } from "./ChatActivityHeader";
import { ChatMessages } from "./chat/ChatMessages";
import { ChatInput } from "./chat/ChatInput";
import { Message } from "./chat/types";
import Activity from "./activity";



function sendChatMessage(socket: WebSocket | null, content: string, userId: number) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    const payload = {
        message: content,
        sender_id: userId,
        visible_to: null,
    };

    console.log("📤 Sending WebSocket payload:", payload);
    socket.send(JSON.stringify(payload));
}

export const TaskChatActivity = ({ taskId, userId }: { taskId: number; userId: number }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const socketRef = useRef<WebSocket | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const lastFetchedTaskIdRef = useRef<string | null>(null);
    const [activeTab, setActiveTab] = useState<"Task Chat" | "Activity">("Task Chat");



    useEffect(() => {

        const fetchInitialMessages = async () => {
            if (lastFetchedTaskIdRef.current === taskId.toString()) {
                console.log("⚠️ Skipping fetch: Already fetched for taskId:", taskId);

                requestAnimationFrame(() => {
                    if (scrollRef.current) {
                        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                    }
                });


            }

            lastFetchedTaskIdRef.current = taskId.toString();
            if (userId === 0) { return; } // Skip if userId is 0
            const response = await fetchChatHistory(taskId, userId, 1, 30);
            const history = response.messages;
            const formatted = history.map((msg: any) => ({
                message_id: msg.message_id.toString(),
                message: msg.message,
                sender_id: msg.sender_id,
                sender_name: msg.sender_name,
                timestamp: new Date(msg.timestamp).toISOString(),
            }));
            setMessages(formatted);
            setHasMore(response.has_more);
            setPage(2);

            // ✅ Scroll to bottom after loading the first page
            requestAnimationFrame(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
            });
        };

        fetchInitialMessages();
        const cleanup = initializeWebSocket(taskId, userId, setMessages, socketRef);
        return () => cleanup();
    }, [taskId, userId]);

    const fetchMoreMessages = async () => {
        if (isFetching || !hasMore) return;
        setIsFetching(true);

        const scrollContainer = scrollRef.current;
        const prevScrollHeight = scrollContainer?.scrollHeight ?? 0;
        const prevScrollTop = scrollContainer?.scrollTop ?? 0;

        const response = await fetchChatHistory(taskId, userId, page, 30);
        const history = response.messages;
        const formatted = history.map((msg: any) => ({
            message_id: msg.message_id.toString(),
            content: msg.message,
            sender_id: msg.sender_id,
            sender_name: msg.sender_name,
            timestamp: new Date(msg.timestamp),
        }));

        setMessages((prev) => [...formatted, ...prev] as Message[]);

        // Wait for React to render messages before adjusting scroll
        requestAnimationFrame(() => {
            if (scrollContainer) {
                const newScrollHeight = scrollContainer.scrollHeight;
                scrollContainer.scrollTop = newScrollHeight - (prevScrollHeight - prevScrollTop);
            }
        });
        setHasMore(response.has_more);
        setPage((prev) => prev + 1);

        requestAnimationFrame(() => {
            if (scrollContainer) {
                const newScrollHeight = scrollContainer.scrollHeight;
                scrollContainer.scrollTop = newScrollHeight - (prevScrollHeight - prevScrollTop);
            }
        });

        setIsFetching(false);
    };


    const handleScroll = () => {
        const scroll = scrollRef.current;
        if (!scroll) return;
        if (scroll.scrollTop < 50) fetchMoreMessages();
    };

    useEffect(() => {
        const scroll = scrollRef.current;
        if (!scroll) return;
        scroll.addEventListener("scroll", handleScroll);
        return () => scroll.removeEventListener("scroll", handleScroll);
    }, [scrollRef.current, isFetching, hasMore]);

    const handleSend = (content: string) => {
        sendChatMessage(socketRef.current, content, userId);
        requestAnimationFrame(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        });
    };

    const handleTabSwitch = (tab: "Task Chat" | "Activity") => {
        setActiveTab(tab);

        if (tab === "Task Chat") {
            // Scroll to the bottom of the chat when switching back to "Task Chat"
            requestAnimationFrame(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
            });
        }
    };


    const topElRef = useRef<HTMLDivElement | null>(null);
    const setTopMessageRef = (el: HTMLDivElement | null) => {
        if (el) topElRef.current = el;
    };

    return (
        <div className="flex flex-col h-full max-h-screen">
            <ChatHeaderActivity>
                <div className="flex gap-[1rem] mb-[1px] shadow-[0px_2px_4px_0px_rgba(10,10,10,0.15)]">
                    <button
                        className={`tab-button ${activeTab === "Task Chat" ? "tab-button-active" : "tab-button-inactive"}`}
                        onClick={() => handleTabSwitch("Task Chat")}
                    >
                        Task Chat
                    </button>
                    <button
                        className={`tab-button ${activeTab === "Activity" ? "tab-button-active" : "tab-button-inactive"}`}
                        onClick={() => handleTabSwitch("Activity")}
                    >
                        Activity
                    </button>
                </div>
            </ChatHeaderActivity>

            {activeTab === "Task Chat" ? (
                <>
                    <ChatMessages messages={messages} scrollRef={scrollRef} setTopMessageRef={setTopMessageRef} />
                    <ChatInput onSend={handleSend} />
                </>
            ) : (
                <Activity task={{ task_id: taskId }} />
            )}
        </div>
    );
};