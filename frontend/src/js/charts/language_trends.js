//@ts-check

let utils = require("../utils/utils"),
	dateTime = require("../utils/datetime"),
	echarts = require("../utils/echartsUtils");

// Color palette for languages
const LANGUAGE_COLORS = {
	javascript: "#f1e05a",
	typescript: "#2b7489",
	python: "#3572A5",
	java: "#b07219",
	"c++": "#f34b7d",
	"c#": "#178600",
	html: "#e34c26",
	css: "#563d7c",
	php: "#4F5D95",
	ruby: "#701516",
	go: "#00ADD8",
	rust: "#dea584",
	default: "#8e8e8e", // For languages not in the list
};

let base = require("./_base").createBaseChartClass();
module.exports = {
	recommendedChartId: "language_trends",
	init: base.init,
	update,
};

/**
 * Update the language usage trends chart
 * @param {Object} data Combined data with day and language info
 */
function update(data) {
	// Safely extract the data we need
	const dailyData =
		data && data.groupBy && data.groupBy.day ? data.groupBy.day : {};

	const languageData =
		data && data.groupBy && data.groupBy.language
			? data.groupBy.language
			: {};

	// Get dates we have data for
	const dates = Object.keys(dailyData).sort();

	if (dates.length === 0) {
		// If no data, display an error message
		base.getCharts().setOption({
			title: {
				text: "Language Usage Trends",
				left: "center",
				subtext: "No data available. Start coding to see trends!",
			},
			grid: {
				left: "3%",
				right: "4%",
				bottom: "3%",
				top: "70", // Changed to string
				containLabel: true,
			},
		});
		return;
	}

	// Process language data
	const languages = {};
	Object.keys(languageData).forEach((lang) => {
		languages[lang] = {
			totalTime: 0,
			byDate: {},
		};
	});

	// Populate data for each date and language
	dates.forEach((date) => {
		const dayLanguages =
			dailyData[date] && dailyData[date].languages
				? dailyData[date].languages
				: {};

		Object.keys(dayLanguages).forEach((lang) => {
			let coding = 0;
			if (
				dayLanguages[lang] &&
				typeof dayLanguages[lang].coding === "number"
			) {
				coding = dayLanguages[lang].coding;
			}

			const minutes = Math.round(coding / 60000); // Convert ms to minutes

			if (!languages[lang]) {
				languages[lang] = {
					totalTime: 0,
					byDate: {},
				};
			}

			languages[lang].totalTime += minutes;
			languages[lang].byDate[date] = minutes;
		});
	});

	// Get top languages by total time
	const topLanguages = Object.keys(languages)
		.map((lang) => ({
			name: lang,
			totalTime: languages[lang].totalTime,
		}))
		.sort((a, b) => b.totalTime - a.totalTime)
		.slice(0, 5)
		.map((item) => item.name);

	// Create series data for the chart
	const seriesData = [];
	topLanguages.forEach((lang) => {
		const color =
			LANGUAGE_COLORS[lang.toLowerCase()] || LANGUAGE_COLORS.default;

		const langData = dates.map((date) => languages[lang].byDate[date] || 0);

		seriesData.push({
			name: lang,
			type: "line", // Explicitly set as "line" type
			stack: "Total",
			areaStyle: {
				color: color,
				opacity: 0.3,
			},
			lineStyle: {
				color: color,
				width: 2,
			},
			itemStyle: {
				color: color,
			},
			emphasis: {
				focus: "series",
			},
			data: langData,
		});
	});

	// If no languages were found, add a placeholder series
	if (seriesData.length === 0) {
		seriesData.push({
			name: "No data",
			type: "line", // Explicitly set as "line" type
			data: dates.map(() => 0),
		});
	}

	// Format dates for display
	const formattedDates = dates.map((date) => {
		const dateObj = new Date(date);
		return dateTime.getMMDD(dateObj);
	});

	// Create and apply the chart options
	base.getCharts().setOption({
		title: {
			text: "Language Usage Trends",
			left: "center",
			top: "5", // Changed to string
			textStyle: {
				fontSize: 16, // Reduced title size
			},
		},
		tooltip: {
			trigger: "axis",
			formatter: function (params) {
				const date = params[0].axisValue;
				let result = `<div>${date}</div>`;

				// Sort the params by value for better readability
				const sortedParams = params
					.slice()
					.sort((a, b) => b.value - a.value);

				let total = 0;
				for (let i = 0; i < sortedParams.length; i++) {
					const param = sortedParams[i];
					if (param.value > 0) {
						const color = param.color;
						const seriesName = param.seriesName;
						const value = param.value;
						total += value;

						result += `<div style="display:flex;justify-content:space-between;align-items:center;margin-top:5px;">
                            <span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${color};"></span>
                            <span style="flex:1;">${seriesName}:</span>
                            <strong>${value} min</strong>
                        </div>`;
					}
				}

				if (total > 0) {
					result += `<div style="margin-top:10px;border-top:1px solid #eee;padding-top:5px;">
                        <span>Total:</span>
                        <strong>${total} min</strong>
                    </div>`;
				}

				return result;
			},
			textStyle: {
				fontSize: 12, // Reduced tooltip text size
			},
		},
		legend: {
			data: topLanguages.length > 0 ? topLanguages : ["No data"],
			top: 30,
			textStyle: {
				fontSize: 12, // Reduced legend text size
			},
			itemWidth: 15, // Reduced legend icon size
			itemHeight: 10,
		},
		grid: {
			left: "40px", // Increased space for Y labels
			right: "40px", // Increased right space
			bottom: "40px", // Increased bottom space
			top: "80px", // Increased space for title and legend
			containLabel: true,
		},
		toolbox: {
			show: false, // Remove toolbox to save space
		},
		xAxis: {
			type: "category",
			boundaryGap: false,
			data: formattedDates,
			axisLabel: {
				interval: Math.max(1, Math.ceil(dates.length / 15)), // Show max 15 labels
				rotate: 45, // Rotate labels for better readability
				fontSize: 10, // Reduced font size
				margin: 8, // Reduced margin
			},
		},
		yAxis: {
			type: "value",
			name: "Minutes",
			nameTextStyle: {
				fontSize: 12, // Reduced axis name size
				padding: [0, 0, 5, 0], // Adjusted padding
			},
			axisLabel: {
				formatter: "{value} min",
				fontSize: 10, // Reduced Y-axis font size
			},
			splitLine: {
				lineStyle: {
					type: "dashed", // Dashed grid lines for better readability
					opacity: 0.7, // Reduced line opacity
				},
			},
		},
		series: seriesData, // Now seriesData contains items with explicit "line" type
	});
}
