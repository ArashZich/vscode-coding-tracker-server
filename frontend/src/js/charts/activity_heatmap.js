//@ts-check

let utils = require("../utils/utils"),
	dateTime = require("../utils/datetime"),
	echarts = require("../utils/echartsUtils");

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// GitHub-style color palette (from light to dark)
const COLORS = [
	"#ebedf0", // Light gray (almost no activity)
	"#9be9a8", // Light green
	"#40c463", // Medium green
	"#30a14e", // Darker green
	"#216e39", // Very dark green
];

let base = require("./_base").createBaseChartClass();
module.exports = {
	recommendedChartId: "activity_heatmap",
	init: base.init,
	update,
};

/**
 * Update the heatmap with coding data in GitHub style
 * @param {CodingWatchingMap} dataGroupByDay
 */
function update(dataGroupByDay) {
	// Prepare data for calendar view
	const dates = Object.keys(dataGroupByDay).sort();
	if (dates.length === 0) {
		base.getCharts().setOption({
			title: {
				text: "Coding Activity Heatmap",
				left: "center",
				top: "10",
				subtext:
					"No data available. Start coding to see your activity!",
			},
		});
		return;
	}

	// Find date range
	const firstDate = new Date(dates[0]);
	const lastDate = new Date(dates[dates.length - 1]);

	// Make sure we display at least the last 12 weeks (GitHub style)
	const minWeeks = 12;
	let startDate = new Date(lastDate);
	startDate.setDate(startDate.getDate() - minWeeks * 7);
	if (firstDate > startDate) {
		startDate = new Date(firstDate);
	}

	// Create full date range for display
	const range = [];
	const currentDate = new Date(startDate);
	while (currentDate <= lastDate) {
		range.push(dateTime.getYYYYMMDD(currentDate));
		currentDate.setDate(currentDate.getDate() + 1);
	}

	// Process activity data
	const activityData = [];
	let maxValue = 1; // Default max for scale

	range.forEach((dateStr) => {
		const date = new Date(dateStr);
		const dayData = dataGroupByDay[dateStr] || { coding: 0 };

		// Convert coding time to minutes for easier reading
		const value = dayData.coding / 60000; // Convert ms to minutes

		// Update max value for scale
		if (value > maxValue) {
			maxValue = value;
		}

		// Format: [Date, Value]
		activityData.push([
			dateStr,
			value > 0 ? Math.round(value) : 0, // Round to whole minutes
		]);
	});

	// Calculate color thresholds based on max value (GitHub style)
	const colorThresholds = [
		0,
		Math.max(1, Math.ceil(maxValue / 20)), // Minimal activity
		Math.ceil(maxValue / 10),
		Math.ceil(maxValue / 4),
		Math.ceil(maxValue),
	];

	base.getCharts().setOption({
		title: {
			top: "10",
			left: "center",
			text: "Coding Activity Heatmap (GitHub Style)",
			textStyle: {
				fontSize: 16,
			},
			subtext: "Each cell represents minutes spent coding per day",
			subtextStyle: {
				fontSize: 12,
			},
		},
		tooltip: {
			position: "top",
			formatter: function (params) {
				const date = new Date(params.data[0]);
				return (
					dateTime.getReadableDateWithAbbr(params.data[0]) +
					`<br>Coding time: <b>${params.data[1]}</b> mins`
				);
			},
		},
		visualMap: {
			min: 0,
			max: colorThresholds[colorThresholds.length - 1],
			calculable: true,
			orient: "horizontal",
			left: "center",
			bottom: "5%",
			textStyle: {
				fontSize: 10,
			},
			inRange: {
				color: COLORS,
			},
			controller: {
				inRange: {
					color: COLORS,
				},
			},
			pieces: [
				{ min: 0, max: 0, color: COLORS[0] },
				{
					min: colorThresholds[1],
					max: colorThresholds[2] - 1,
					color: COLORS[1],
				},
				{
					min: colorThresholds[2],
					max: colorThresholds[3] - 1,
					color: COLORS[2],
				},
				{
					min: colorThresholds[3],
					max: colorThresholds[4] - 1,
					color: COLORS[3],
				},
				{ min: colorThresholds[4], color: COLORS[4] },
			],
		},
		calendar: {
			top: 80,
			left: 40,
			right: 40,
			bottom: 60,
			cellSize: ["auto", 15], // GitHub-like square cells
			range: [range[0], range[range.length - 1]],
			itemStyle: {
				borderWidth: 1,
				borderColor: "#fff",
			},
			yearLabel: { show: true },
			dayLabel: {
				firstDay: 0, // Start with Sunday
				nameMap: DAYS_OF_WEEK,
				fontSize: 10,
			},
			monthLabel: {
				nameMap: "en",
				fontSize: 10,
				align: "center",
			},
		},
		series: {
			type: "heatmap",
			coordinateSystem: "calendar",
			data: activityData,
			label: {
				show: false,
			},
			emphasis: {
				itemStyle: {
					shadowBlur: 5,
					shadowColor: "rgba(0, 0, 0, 0.5)",
				},
			},
		},
	});
}
