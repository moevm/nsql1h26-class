/**
 * utils/pairInterval.js
 * Преобразует дату и номер пары в ISO-интервал (start, end).
 */

const getPairInterval = (date, pair) => {
    const timings = {
        1: { s: "08:00", e: "09:30" },
        2: { s: "09:50", e: "11:20" },
        3: { s: "11:40", e: "13:10" },
        4: { s: "13:40", e: "15:10" },
        5: { s: "15:30", e: "17:00" },
        6: { s: "17:20", e: "18:50" },
        7: { s: "19:00", e: "20:30" }
    };
    const t = timings[pair] || timings[1];
    return {
        start: `${date}T${t.s}:00Z`,
        end: `${date}T${t.e}:00Z`
    };
};

export default getPairInterval;