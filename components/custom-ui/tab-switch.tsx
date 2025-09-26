
import { useState, ReactNode } from "react";

interface TabSwitchProps {
    tabs: { label: string; component: ReactNode }[];
    defaultTab?: string;
    tabClassName?: string;
    activeTabClassName?: string;
    inactiveTabClassName?: string;
}

export default function TabSwitch({
    tabs,
    defaultTab,
    tabClassName = "tab-button",
    activeTabClassName = "tab-button-active",
    inactiveTabClassName = "tab-button-inactive",
}: TabSwitchProps) {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.label);

    return (
        <div>
            <div className="tab-container">
                {tabs.map((tab) => (
                    <button
                        key={tab.label}
                        onClick={() => setActiveTab(tab.label)}
                        className={`${tabClassName} ${
                            activeTab === tab.label ? activeTabClassName : inactiveTabClassName
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div>
                {tabs.map(
                    (tab) =>
                        activeTab === tab.label && (
                            <div key={tab.label} className="tab-content">
                                {tab.component}
                            </div>
                        )
                )}
            </div>
        </div>
    );
}
