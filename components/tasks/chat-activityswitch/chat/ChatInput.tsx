import React, { useState, useRef, useEffect } from "react";
import SmartInputBox from "@/components/custom-ui/input-box";

import { EmojiPickerSimple } from "@/components/custom-ui/emojis";



export const ChatInput = ({ onSend }: { onSend: (text: string) => void }) => {
    const [text, setText] = useState("");
    const [showEmoji, setShowEmoji] = useState(false);
    const emojiPickerRef = useRef<HTMLDivElement>(null);


    const handleSend = () => {
        console.log("✉️ Attempting to send message:", text);

        if (text.trim()) {
            console.log("✅ Message sent:", text);
            onSend(text);
            setText("");
            setShowEmoji(false);
        } else {
            console.warn("⚠️ Cannot send empty or whitespace-only message.");
        }
    };




    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                emojiPickerRef.current &&
                !emojiPickerRef.current.contains(event.target as Node)
            ) {
                setShowEmoji(false);
            }
        }

        if (showEmoji) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showEmoji]);



    return (
        <div className="relative border rounded-[5px] bg-white p-2">
            {showEmoji && (


                <div ref={emojiPickerRef} className="absolute bottom-14 left-0 z-10 w-full max-w-md">
                    <EmojiPickerSimple onSelect={(emoji) => setText((prev) => prev + emoji)} />
                </div>

            )}

            <div className="flex items-end gap-2">
                <button
                    className="text-m"
                    onClick={() => setShowEmoji((prev) => !prev)}
                >
                    🙂
                </button>


                <SmartInputBox
                    value={text}
                    onChange={(value: string) => setText(value)}
                    onChangeComplete={handleSend}
                    placeholder="Type a message"
                    rows={1}
                    isTextarea={true}
                    autoExpand={true}
                    maxHeight="7 rows"
                    textareaClassName=" bg-transparent outline-none border-none text-[16px]  focus:ring-none w-full resize-none flex items-center h-full"
                    disableEvents={{
                        blur: true, // Disable `handleBlur`
                        keydown: false, // Allow `handleKeyDown`
                    }}
                />
            </div>
        </div>
    );
};




