//@ts-check

let utils = require("../utils/utils"),
	dateTime = require("../utils/datetime"),
	echarts = require("../utils/echartsUtils");

let base = require("./_base").createBaseChartClass();
module.exports = {
	recommendedChartId: "weekday_vs_weekend",
	init: base.init,
	update,
};

/**
 * Update the weekday vs weekend comparison chart
 * @param {CodingWatchingMap} dataGroupByDay
 */
function update(dataGroupByDay) {
	// Aggregate data by days of week
	const dayOfWeekData = aggregateByDayOfWeek(dataGroupByDay);

	// Format data for chart
	const days = [
		"Sunday",
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
	];
	const codingValues = days.map((day) => {
		const value = dayOfWeekData[day]?.coding || 0;
		return value ? Number(value) / 3600000 : 0; // Convert to hours
	});
	const watchingValues = days.map((day) => {
		const value = dayOfWeekData[day]?.watching || 0;
		return value ? Number(value) / 3600000 : 0;
	});

	// Calculate weekday and weekend averages
	const weekdayIndices = [1, 2, 3, 4, 5]; // Monday to Friday
	const weekendIndices = [0, 6]; // Sunday and Saturday

	let weekdayCoding = 0;
	let weekendCoding = 0;
	let weekdayWatching = 0;
	let weekendWatching = 0;

	weekdayIndices.forEach((i) => {
		weekdayCoding += codingValues[i] || 0;
		weekdayWatching += watchingValues[i] || 0;
	});

	weekendIndices.forEach((i) => {
		weekendCoding += codingValues[i] || 0;
		weekendWatching += watchingValues[i] || 0;
	});

	weekdayCoding =
		weekdayIndices.length > 0 ? weekdayCoding / weekdayIndices.length : 0;
	weekendCoding =
		weekendIndices.length > 0 ? weekendCoding / weekendIndices.length : 0;

	weekdayWatching =
		weekdayIndices.length > 0 ? weekdayWatching / weekdayIndices.length : 0;
	weekendWatching =
		weekendIndices.length > 0 ? weekendWatching / weekendIndices.length : 0;

	base.getCharts().setOption({
		title: {
			text: "Weekday vs Weekend Coding Patterns",
			left: "center",
			top: "0", // Changed to string
		},
		tooltip: {
			trigger: "axis",
		},
		legend: {
			data: ["Daily Average", "Weekday Avg", "Weekend Avg"],
			top: "30", // Changed to string
		},
		grid: {
			left: "3%",
			right: "4%",
			bottom: "3%",
			top: "80", // Changed to string
			containLabel: true,
		},
		xAxis: {
			type: "category",
			data: days,
			axisLabel: {
				interval: 0,
			},
		},
		yAxis: {
			type: "value",
			name: "Hours",
			axisLabel: {
				formatter: "{value} h",
			},
		},
		series: [
			{
				name: "Daily Average",
				type: "bar",
				data: codingValues,
				itemStyle: {
					color: function (params) {
						// Weekend days get a different color
						return params.dataIndex === 0 || params.dataIndex === 6
							? "#ff9800"
							: "#4caf50";
					},
				},
				markLine: {
					symbol: ["none", "none"],
					label: {
						formatter: "{b}: {c} h",
					},
					data: [
						{
							name: "Weekday Avg",
							yAxis: weekdayCoding,
							lineStyle: {
								color: "#4caf50",
								type: "dashed",
								width: 2,
							},
							label: {
								position: "end",
							},
						},
						{
							name: "Weekend Avg",
							yAxis: weekendCoding,
							lineStyle: {
								color: "#ff9800",
								type: "dashed",
								width: 2,
							},
							label: {
								position: "end",
							},
						},
					],
				},
			},
		],
	});

	// We can't directly modify DOM in this context because it's not available
	// The comparison box would be added in the route file
}

/**
 * Aggregate data by day of week
 * @param {CodingWatchingMap} dataGroupByDay
 * @returns {Object} Aggregated data by day of week
 */
function aggregateByDayOfWeek(dataGroupByDay) {
	const days = [
		"Sunday",
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
	];
	const dayData = {};
	const dayCounts = {};

	// Initialize data structure
	days.forEach((day) => {
		dayData[day] = { coding: 0, watching: 0 };
		dayCounts[day] = 0;
	});

	// Aggregate data
	Object.keys(dataGroupByDay).forEach((dateStr) => {
		const date = new Date(dateStr);
		const dayOfWeek = days[date.getDay()];
		const data = dataGroupByDay[dateStr];

		if (data && dayOfWeek) {
			dayData[dayOfWeek].coding += data.coding || 0;
			dayData[dayOfWeek].watching += data.watching || 0;
			dayCounts[dayOfWeek]++;
		}
	});

	// Calculate averages
	days.forEach((day) => {
		if (dayCounts[day] > 0) {
			dayData[day].coding /= dayCounts[day];
			dayData[day].watching /= dayCounts[day];
		}
	});

	return dayData;
}
