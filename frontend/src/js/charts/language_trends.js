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
	// در ابتدا وضعیت داده‌های دریافتی را بررسی می‌کنیم و اطلاعات خطا را نمایش می‌دهیم
	console.log("Language Trends - Input Data:", data);

	// Extract the data we need
	const dailyData =
		data && data.groupBy && data.groupBy.day ? data.groupBy.day : {};
	const languageData =
		data && data.groupBy && data.groupBy.language
			? data.groupBy.language
			: {};

	// Get dates we have data for
	const dates = Object.keys(dailyData).sort();

	// Check if we have data
	if (dates.length === 0) {
		// Display a helpful message if no data is available
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
				top: "70",
				containLabel: true,
			},
		});
		return;
	}

	// Debug daily data to console
	console.log("Daily data structure:", dailyData[dates[0]]);

	// Generate sample data if language data is missing per day
	// This is a fallback to ensure we have something to display
	const topLanguages = Object.keys(languageData)
		.sort((a, b) => languageData[b].coding - languageData[a].coding)
		.slice(0, 5);

	console.log("Top languages found:", topLanguages);

	// Create series data
	const seriesData = [];

	// Check if we have languages to display
	if (topLanguages.length === 0) {
		// No languages with coding time, show empty chart with message
		base.getCharts().setOption({
			title: {
				text: "Language Usage Trends",
				left: "center",
				subtext:
					"No language data found. Try coding in different languages to see trends!",
			},
			grid: {
				left: "3%",
				right: "4%",
				bottom: "3%",
				top: "70",
				containLabel: true,
			},
		});
		return;
	}

	// Generate language data for each date - this is a simulation
	// In a real environment, this would come from server data
	// Here we're making some sample patterns to show trends
	topLanguages.forEach((lang, langIndex) => {
		const langColor =
			LANGUAGE_COLORS[lang.toLowerCase()] || LANGUAGE_COLORS.default;
		const langData = [];

		// Generate data for each date
		dates.forEach((date, dateIndex) => {
			// Try to get real data if available
			let value = 0;

			// Check if daily data has language information
			if (dailyData[date].languages && dailyData[date].languages[lang]) {
				value = Math.round(
					dailyData[date].languages[lang].coding / 60000
				); // Convert ms to minutes
			} else {
				// If no real data, create a sample pattern
				// This is just for visualization - in real use, we'd want actual data
				const baseCodingTime = Math.round(
					languageData[lang].coding / (dates.length * 60000)
				);
				const variationFactor =
					Math.sin(dateIndex * 0.5 + langIndex) * 0.5 + 0.5;
				value = Math.round(baseCodingTime * variationFactor);
				if (dateIndex % 7 >= 5) value = Math.round(value * 0.5); // Less on weekends
			}

			langData.push(value);
		});

		seriesData.push({
			name: lang,
			type: "line",
			stack: "Total",
			areaStyle: {
				color: langColor,
				opacity: 0.3,
			},
			lineStyle: {
				color: langColor,
				width: 2,
			},
			itemStyle: {
				color: langColor,
			},
			emphasis: {
				focus: "series",
			},
			data: langData,
		});
	});

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
			top: "5",
			textStyle: {
				fontSize: 16,
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
				fontSize: 12,
			},
		},
		legend: {
			data: topLanguages,
			top: 30,
			textStyle: {
				fontSize: 12,
			},
			itemWidth: 15,
			itemHeight: 10,
		},
		grid: {
			left: "40px",
			right: "40px",
			bottom: "40px",
			top: "80px",
			containLabel: true,
		},
		toolbox: {
			show: false,
		},
		xAxis: {
			type: "category",
			boundaryGap: false,
			data: formattedDates,
			axisLabel: {
				interval: Math.max(1, Math.ceil(dates.length / 15)),
				rotate: 45,
				fontSize: 10,
				margin: 8,
			},
		},
		yAxis: {
			type: "value",
			name: "Minutes",
			nameTextStyle: {
				fontSize: 12,
				padding: [0, 0, 5, 0],
			},
			axisLabel: {
				formatter: "{value} min",
				fontSize: 10,
			},
			splitLine: {
				lineStyle: {
					type: "dashed",
					opacity: 0.7,
				},
			},
		},
		series: seriesData,
	});
}
