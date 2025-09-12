//@ts-check

let base = require("./_base").createBaseChartClass();
let dateTime = require("../utils/datetime");

module.exports = {
    recommendedChartId: "time_analysis_chart",
    init: base.init,
    update,
};

/**
 * Main update function
 * @param {import('../index').OverviewData} data
 * @param {string} statsContainerSelector
 */
function update(data, statsContainerSelector) {
    const dailyData = data.groupBy.day || {};
    const dates = Object.keys(dailyData).sort();

    if (dates.length === 0) {
        // Handle no data case
        base.getCharts().clear();
        $(statsContainerSelector).html('<p class="text-center">No data available for this period.</p>');
        return;
    }

    const codingData = [];
    const thinkingData = [];

    let totalCoding = 0;
    let totalThinking = 0;

    dates.forEach(date => {
        const day = dailyData[date];
        const watching = day.watching || 0;
        const coding = day.coding || 0;
        const thinking = Math.max(0, watching - coding);

        totalCoding += coding;
        totalThinking += thinking;

        codingData.push(parseFloat((coding / 3600000).toFixed(2)));
        thinkingData.push(parseFloat((thinking / 3600000).toFixed(2)));
    });

    const formattedDates = dates.map(d => dateTime.getMMDD(new Date(d)));

    base.getCharts().setOption({
        title: { text: "Daily Coding vs. Thinking/Review Time", left: "center", textStyle: { fontSize: 16 } },
        tooltip: {
            trigger: "axis",
            formatter: (params) => {
                let total = 0;
                let content = `<strong>${params[0].name}</strong><br/>`;
                params.forEach(param => { total += param.value; });

                params.forEach(param => {
                    const seriesName = param.seriesName;
                    const value = param.value;
                    const readableTime = dateTime.getReadableTime(value * 3600000);
                    const percent = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                    content += `${param.marker} ${seriesName}: <strong>${readableTime}</strong> (${percent}%)<br/>`;
                });
                return content;
            }
        },
        legend: { data: ["Active Coding", "Thinking/Review"], bottom: 5 },
        grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
        xAxis: { type: "category", boundaryGap: false, data: formattedDates },
        yAxis: { type: "value", name: "Hours", axisLabel: { formatter: "{value}h" } },
        series: [
            {
                name: "Active Coding",
                type: "line",
                areaStyle: { opacity: 0.6 },
                stack: "total",
                emphasis: { focus: "series" },
                color: "#91cc75", // Green
                data: codingData,
                markLine: {
                    data: [{ type: 'average', name: 'Avg Coding' }]
                }
            },
            {
                name: "Thinking/Review",
                type: "line",
                areaStyle: { opacity: 0.6 },
                stack: "total",
                emphasis: { focus: "series" },
                color: "#fac858", // Yellow
                data: thinkingData,
                markLine: {
                    data: [{ type: 'average', name: 'Avg Thinking' }]
                }
            },
        ],
    }, true);

    // Update stats
    updateStats(statsContainerSelector, totalCoding, totalThinking, dates.length);
}

/**
 * Helper to update the stats container
 * @param {string} containerSelector
 * @param {number} totalCoding
 * @param {number} totalThinking
 * @param {number} dayCount
 */
function updateStats(containerSelector, totalCoding, totalThinking, dayCount) {
    const avgCoding = dayCount > 0 ? totalCoding / dayCount : 0;
    const avgThinking = dayCount > 0 ? totalThinking / dayCount : 0;

    let html = `
        <div class="col-md-3 col-6 text-center">
            <div class="card card-body bg-light">
                <h6>Total Active Coding</h6>
                <p class="h4 mb-0">${dateTime.getReadableTime(totalCoding)}</p>
            </div>
        </div>
        <div class="col-md-3 col-6 text-center">
            <div class="card card-body bg-light">
                <h6>Total Thinking/Review</h6>
                <p class="h4 mb-0">${dateTime.getReadableTime(totalThinking)}</p>
            </div>
        </div>
        <div class="col-md-3 col-6 text-center">
            <div class="card card-body bg-light">
                <h6>Daily Avg Coding</h6>
                <p class="h4 mb-0">${dateTime.getReadableTime(avgCoding)}</p>
            </div>
        </div>
        <div class="col-md-3 col-6 text-center">
            <div class="card card-body bg-light">
                <h6>Daily Avg Thinking</h6>
                <p class="h4 mb-0">${dateTime.getReadableTime(avgThinking)}</p>
            </div>
        </div>
    `;
    $(containerSelector).html(html);
}