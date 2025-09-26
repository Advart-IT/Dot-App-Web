"use client";

import React, { useState } from "react";

interface CalendarProps {
    renderDayContent: (day: number, currentMonth: number, currentYear: number) => React.ReactNode;
    title?: string;
    headerComponent?: React.ReactNode;
    topComponent?: React.ReactNode;
    onMonthChange?: (month: number, year: number) => void; // Add this callback
}

const Calendar: React.FC<CalendarProps> = ({
    renderDayContent,
    title,
    headerComponent,
    topComponent,
    onMonthChange
}) => {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());

    // Get total days in month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0=Sun

    // Get previous month info
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();

    // Get next month info
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

    const goToPrevMonth = () => {
        let newMonth, newYear;

        if (currentMonth === 0) {
            newMonth = 11;
            newYear = currentYear - 1;
        } else {
            newMonth = currentMonth - 1;
            newYear = currentYear;
        }

        setCurrentMonth(newMonth);
        setCurrentYear(newYear);

        // Call the callback with new month/year
        if (onMonthChange) {
            onMonthChange(newMonth, newYear);
        }
    };

    const goToNextMonth = () => {
        let newMonth, newYear;

        if (currentMonth === 11) {
            newMonth = 0;
            newYear = currentYear + 1;
        } else {
            newMonth = currentMonth + 1;
            newYear = currentYear;
        }

        setCurrentMonth(newMonth);
        setCurrentYear(newYear);

        // Call the callback with new month/year
        if (onMonthChange) {
            onMonthChange(newMonth, newYear);
        }
    };

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    // Create calendar grid data with day info
    const calendarData = [];
    let currentWeek = [];

    // Add days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        currentWeek.push({
            day,
            month: prevMonth,
            year: prevYear,
            isCurrentMonth: false,
            isPrevMonth: true
        });
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
        currentWeek.push({
            day,
            month: currentMonth,
            year: currentYear,
            isCurrentMonth: true,
            isPrevMonth: false
        });

        // If week is complete (7 days), push to calendar
        if (currentWeek.length === 7) {
            calendarData.push([...currentWeek]);
            currentWeek = [];
        }
    }

    // Add days from next month to complete the last week
    if (currentWeek.length > 0) {
        let nextMonthDay = 1;
        while (currentWeek.length < 7) {
            currentWeek.push({
                day: nextMonthDay,
                month: nextMonth,
                year: nextYear,
                isCurrentMonth: false,
                isPrevMonth: false
            });
            nextMonthDay++;
        }
        calendarData.push([...currentWeek]);
    }

    return (
        <div className="w-full mx-auto space-y-4">
            {/* Updated header with centered navigation */}
            <div className="flex justify-center items-center border-b border-gray-200 pb-4 space-x-4">
                {/* Center-aligned navigation group */}
                <div className="flex items-center gap-4">
                    <button onClick={goToPrevMonth} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">
                        Prev
                    </button>
                    <h2 className="text-xl font-bold">
                        {title && `${title} - `}{monthNames[currentMonth]} {currentYear}
                    </h2>
                    <button onClick={goToNextMonth} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">
                        Next
                    </button>
                </div>
            </div>

            {/* Right: custom headerComponent (like filters) */}
            {headerComponent && (
                <div className="w-full">
                    {headerComponent}
                </div>
            )}

            {topComponent && (
                <div className="w-full">
                    {topComponent}
                </div>
            )}

            <div className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Day headers */}
                <div className="grid grid-cols-7 bg-gray-100">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                        <div key={day} className="text-center font-semibold text-gray-600 py-2 border-r border-gray-200 last:border-r-0">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar rows */}
                {calendarData.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7 border-t border-gray-200">
                        {week.map((dayInfo, dayIndex) => (
                            <div
                                key={`${weekIndex}-${dayIndex}`}
                                className={`border-r border-gray-200 last:border-r-0 min-h-[120px] flex flex-col relative ${dayInfo.isCurrentMonth
                                    ? 'bg-white'
                                    : 'bg-gray-50'
                                    }`}
                                style={{
                                    minHeight: '120px',
                                    maxHeight: 'none'
                                }}
                            >
                                <div className={`text-xs font-bold p-2 pb-1 ${dayInfo.isCurrentMonth
                                    ? 'text-gray-700'
                                    : 'text-gray-400'
                                    }`}>
                                    {dayInfo.day}
                                </div>
                                <div className="flex-1 p-2 pt-0">
                                    {/* Pass the ACTUAL month/year for each day */}
                                    {renderDayContent(dayInfo.day, dayInfo.month, dayInfo.year)}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Calendar;
