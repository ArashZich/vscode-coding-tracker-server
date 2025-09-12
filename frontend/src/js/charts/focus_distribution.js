//@ts-check

let base = require("./_base").createBaseChartClass();
let dateTime = require("../utils/datetime");

module.exports = {
    recommendedChartId: "focus_distribution",
    init: base.init,
    update,
};

/**
 * @param {import('../index').OverviewData} data
 */
function update(data) {
    const langData = data && data.groupBy && data.groupBy.language ? data.groupBy.language : {};

    let langArray = Object.keys(langData).map(lang => ({
        name: lang,
        value: langData[lang].coding, // Using coding time for focus
    }));

    // Sort by time spent and take top 6, group rest into 'Other'
    langArray.sort((a, b) => b.value - a.value);

    const topLangs = langArray.slice(0, 6);
    const otherLangs = langArray.slice(6);

    if (otherLangs.length > 0) {
        const otherValue = otherLangs.reduce((sum, lang) => sum + lang.value, 0);
        topLangs.push({ name: "Other", value: otherValue });
    }

    const chartData = topLangs.filter(lang => lang.value > 0); // Only show languages with time

    base.getCharts().setOption({
        title: {
            text: "Focus Distribution",
            subtext: "Time spent per language",
            left: "center",
            textStyle: { fontSize: 16 },
            subtextStyle: { fontSize: 12 },
        },
        tooltip: {
            trigger: "item",
            formatter: (params) => {
                const time = dateTime.getReadableTime(params.value);
                return `<strong>${params.name}</strong><br/>
                        ${time}<br/>
                        ${params.percent}%`;
            }
        },
        legend: {
            orient: "vertical",
            left: "left",
            top: "middle",
            data: chartData.map(d => d.name),
        },
        series: [
            {
                name: "Focus Distribution",
                type: "pie",
                radius: ["40%", "70%"], // Donut chart
                center: ["65%", "50%"], // Adjust center to accommodate legend
                avoidLabelOverlap: false,
                label: {
                    show: false,
                    position: "center",
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: "20",
                        fontWeight: "bold",
                    },
                },
                labelLine: {
                    show: false,
                },
                data: chartData,
            },
        ],
    });
}
