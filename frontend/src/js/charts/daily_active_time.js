//@ts-check

let base = require("./_base").createBaseChartClass();
let dateTime = require("../utils/datetime");

module.exports = {
    recommendedChartId: "daily_active_time",
    init: base.init,
    update,
};

/**
 * @param {import('../index').OverviewData} data
 */
function update(data) {
    const dailyData = data && data.groupBy && data.groupBy.day ? data.groupBy.day : {};

    const dates = Object.keys(dailyData).sort();
    const codingData = [];
    const otherData = [];
    const totalData = [];

    dates.forEach(date => {
        const day = dailyData[date];
        const watching = day.watching || 0;
        const coding = day.coding || 0;
        const other = watching - coding;

        // Convert ms to hours, rounded to 2 decimal places
        const codingHours = parseFloat((coding / 3600000).toFixed(2));
        const otherHours = parseFloat((other / 3600000).toFixed(2));

        codingData.push(codingHours);
        otherData.push(otherHours);
        totalData.push(parseFloat((watching / 3600000).toFixed(2)));
    });

    const formattedDates = dates.map(d => dateTime.getMMDD(new Date(d)));

    base.getCharts().setOption({
        title: {
            text: "Daily Active Time",
            subtext: "Coding vs. Other Editor Time",
            left: "center",
            textStyle: { fontSize: 16 },
            subtextStyle: { fontSize: 12 },
        },
        tooltip: {
            trigger: "axis",
            axisPointer: { type: "shadow" },
            formatter: (params) => {
                let date = params[0].name;
                let codingTime = 0;
                let otherTime = 0;

                params.forEach(param => {
                    if (param.seriesName === "Coding Time") {
                        codingTime = param.value;
                    } else if (param.seriesName === "Other Time") {
                        otherTime = param.value;
                    }
                });

                const totalTime = codingTime + otherTime;
                const readableTotal = dateTime.getReadableTime(totalTime * 3600000);
                const readableCoding = dateTime.getReadableTime(codingTime * 3600000);
                const readableOther = dateTime.getReadableTime(otherTime * 3600000);

                return `<strong>${date}</strong><br/>
                        Total: <strong>${readableTotal}</strong><br/>
                        Coding: ${readableCoding}<br/>
                        Other: ${readableOther}`;
            }
        },
        legend: {
            data: ["Coding Time", "Other Time"],
            bottom: 5,
        },
        grid: {
            left: "3%",
            right: "4%",
            bottom: "10%",
            containLabel: true,
        },
        xAxis: {
            type: "category",
            data: formattedDates,
        },
        yAxis: {
            type: "value",
            name: "Hours",
            axisLabel: { formatter: "{value}h" },
        },
        series: [
            {
                name: "Coding Time",
                type: "bar",
                stack: "total",
                color: "#83a2ed", // A pleasant light blue
                data: codingData,
            },
            {
                name: "Other Time",
                type: "bar",
                stack: "total",
                color: "#e5e5e5", // A neutral light gray
                data: otherData,
            },
        ],
    });
}
