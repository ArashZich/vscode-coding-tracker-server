//@ts-check

let base = require("./_base").createBaseChartClass();
let dateTime = require("../utils/datetime");

module.exports = {
    recommendedChartId: "flow_state",
    init: base.init,
    update,
};

/**
 * @param {import('../index').OverviewData} data
 */
function update(data) {
    const dailyData = data && data.groupBy && data.groupBy.day ? data.groupBy.day : {};

    const scatterData = Object.keys(dailyData).map(date => {
        const day = dailyData[date];
        const codingTime = day.coding || 0;
        const projectCount = day.project ? Object.keys(day.project).length : 0;

        if (codingTime === 0) return null; // Exclude days with no coding

        const codingHours = parseFloat((codingTime / 3600000).toFixed(2));

        // Format: [projectCount, codingHours, date]
        return [projectCount, codingHours, date];
    }).filter(Boolean); // Remove null entries

    base.getCharts().setOption({
        title: {
            text: "Deep Work vs. Fragmented Days",
            subtext: "Coding Time vs. Context Switching",
            left: "center",
            textStyle: { fontSize: 16 },
            subtextStyle: { fontSize: 12 },
        },
        tooltip: {
            trigger: "item",
            formatter: (params) => {
                const [projectCount, codingHours, date] = params.data;
                const formattedDate = dateTime.getMMDD(new Date(date));
                return `<strong>${formattedDate}</strong><br/>
                        Coding: <strong>${codingHours} hours</strong><br/>
                        Projects: <strong>${projectCount}</strong>`;
            }
        },
        grid: {
            left: "3%",
            right: "7%",
            bottom: "10%",
            containLabel: true,
        },
        xAxis: {
            type: "value",
            name: "Projects Worked On (Context Switching)",
            nameLocation: "middle",
            nameGap: 25,
            splitLine: { show: true, lineStyle: { type: 'dashed' } },
            axisLabel: { formatter: "{value}" },
        },
        yAxis: {
            type: "value",
            name: "Coding Time (Hours)",
            nameLocation: "middle",
            nameGap: 35,
            splitLine: { show: true, lineStyle: { type: 'dashed' } },
            axisLabel: { formatter: "{value}h" },
        },
        visualMap: {
            show: false,
            min: 0,
            max: Math.max(...scatterData.map(d => d[1])),
            dimension: 1, // Map color to the second dimension (codingHours)
            inRange: {
                color: ['#d94e5d', '#f08c5a', '#f9d46c', '#91cc75']
            }
        },
        series: [
            {
                name: "Daily Activity",
                type: "scatter",
                data: scatterData,
                symbolSize: 15,
                emphasis: {
                    focus: 'series',
                    label: {
                        show: true,
                        formatter: (param) => dateTime.getMMDD(new Date(param.data[2])),
                        position: 'top'
                    }
                }
            },
        ],
    });
}
