import React from "react";


export const ChatHeaderActivity = ({ children }: { children?: React.ReactNode }) => {
    return (
        <div className="chat-header">
            {children}
        </div>
    );
};