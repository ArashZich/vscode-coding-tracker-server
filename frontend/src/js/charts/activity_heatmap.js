//@ts-check

let base = require("./_base").createBaseChartClass();

module.exports = {
    recommendedChartId: "coding_rhythm",
    init: base.init,
    update,
};

/**
 * @param {import('../index').OverviewData} data
 */
function update(data) {
    const hourlyData = data && data.groupBy && data.groupBy.hour ? data.groupBy.hour : {};

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0') + ":00");

    // 7 days x 24 hours grid, initialized to 0
    let activityGrid = Array.from({ length: 7 }, () => Array(24).fill(0));

    for (const dateTimeStr in hourlyData) {
        const parts = dateTimeStr.split('-');
        if (parts.length < 4) continue;

        const hour = parseInt(parts[3], 10);
        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const dayOfWeek = date.getDay(); // 0 for Sunday, 1 for Monday, etc.

        const codingTime = hourlyData[dateTimeStr].coding || 0;
        const codingHours = codingTime / 3600000; // Convert ms to hours

        if (dayOfWeek >= 0 && dayOfWeek < 7 && hour >= 0 && hour < 24) {
            activityGrid[dayOfWeek][hour] += codingHours;
        }
    }

    // ECharts expects data in [x, y, value] format
    const heatmapData = [];
    let maxActivity = 0;
    for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
            const activity = activityGrid[day][hour];
            if (activity > 0) {
                // Format: [hour, day, activity]
                heatmapData.push([hour, day, parseFloat(activity.toFixed(2))]);
                if (activity > maxActivity) {
                    maxActivity = activity;
                }
            }
        }
    }

    base.getCharts().setOption({
        title: {
            text: "Weekly Coding Rhythm",
            subtext: "Your most active hours of the week",
            left: "center",
            textStyle: { fontSize: 16 },
            subtextStyle: { fontSize: 12 },
        },
        tooltip: {
            position: "top",
            formatter: (params) => {
                const [hour, day, activity] = params.data;
                return `<strong>${days[day]}, ${hours[hour]}</strong><br/>
                        Activity: <strong>${activity} hours</strong>`;
            }
        },
        grid: {
            height: "60%",
            top: "20%",
            left: "8%",
            right: "5%",
        },
        xAxis: {
            type: "category",
            data: hours,
            splitArea: { show: true },
            axisLabel: { interval: 2 } // Show label every 3 hours
        },
        yAxis: {
            type: "category",
            data: days,
            splitArea: { show: true },
        },
        visualMap: {
            min: 0,
            max: maxActivity,
            calculable: true,
            orient: "horizontal",
            left: "center",
            bottom: "0%",
            inRange: {
                color: ["#f9fafe", "#216e39"] // From light blue/grey to dark green
            }
        },
        series: [{
            name: "Coding Activity",
            type: "heatmap",
            data: heatmapData,
            label: { show: false },
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowColor: "rgba(0, 0, 0, 0.5)",
                },
            },
        }],
    });
}