//@ts-check

let utils = require("../utils/utils"),
	dateTime = require("../utils/datetime"),
	echarts = require("../utils/echartsUtils");

let base = require("./_base").createBaseChartClass();
module.exports = {
	recommendedChartId: "weekly_trend",
	init: base.init,
	update,
};

/**
 * Update the weekly trend chart
 * @param {CodingWatchingMap} dataGroupByDay
 */
function update(dataGroupByDay) {
	// Group data by weeks
	const weeklyData = getWeeklyData(dataGroupByDay);

	// Prepare series data
	const weeks = Object.keys(weeklyData).sort();
	const codingData = [];
	const watchingData = [];

	// Safely convert values to hours
	for (let i = 0; i < weeks.length; i++) {
		const week = weeks[i];
		const coding = weeklyData[week].coding;
		const watching = weeklyData[week].watching;

		// Make sure we're dealing with numbers
		codingData.push(coding > 0 ? coding / 3600000 : 0);
		watchingData.push(watching > 0 ? watching / 3600000 : 0);
	}

	// Format dates for display
	const formattedWeeks = [];
	for (let i = 0; i < weeks.length; i++) {
		const parts = weeks[i].split("-W");
		const year = parts[0];
		const weekNum = parts[1];
		formattedWeeks.push(`W${weekNum}\n${year}`);
	}

	base.getCharts().setOption({
		title: {
			text: "Weekly Coding Trends",
			left: "center",
		},
		tooltip: {
			trigger: "axis",
			formatter: function (params) {
				const weekLabel = params[0].axisValue;
				let result = weekLabel + "<br>";

				params.forEach((param) => {
					const color = param.color;
					const seriesName = param.seriesName;
					const value = param.value;
					result += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${color};"></span>`;
					result += `${seriesName}: <strong>${value.toFixed(
						2
					)} hours</strong><br>`;
				});

				return result;
			},
		},
		legend: {
			data: ["Coding", "Watching"],
			top: 30,
		},
		grid: {
			left: "3%",
			right: "4%",
			bottom: "3%",
			top: 70,
			containLabel: true,
		},
		toolbox: {
			feature: {
				saveAsImage: {},
			},
		},
		xAxis: {
			type: "category",
			boundaryGap: false,
			data: formattedWeeks,
			axisLabel: {
				interval: 0,
				rotate: 45,
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
				name: "Coding",
				type: "line",
				stack: "Total",
				data: codingData,
				lineStyle: {
					width: 3,
					color: "#1b5e20",
				},
				itemStyle: {
					color: "#1b5e20",
				},
				areaStyle: {
					color: "#4caf50",
					opacity: 0.4,
				},
				emphasis: {
					focus: "series",
				},
				markPoint: {
					data: [
						{ type: "max", name: "Max" },
						{ type: "min", name: "Min" },
					],
				},
				markLine: {
					data: [{ type: "average", name: "Avg" }],
				},
			},
			{
				name: "Watching",
				type: "line",
				stack: "Total",
				data: watchingData,
				lineStyle: {
					width: 3,
					color: "#01579b",
				},
				itemStyle: {
					color: "#01579b",
				},
				areaStyle: {
					color: "#2196f3",
					opacity: 0.4,
				},
				emphasis: {
					focus: "series",
				},
			},
		],
	});
}

/**
 * Group daily data by ISO weeks
 * @param {CodingWatchingMap} dataGroupByDay
 * @returns {Object} Weekly accumulated data
 */
function getWeeklyData(dataGroupByDay) {
	const weeklyData = {};

	Object.keys(dataGroupByDay).forEach((dateStr) => {
		try {
			const date = new Date(dateStr);

			// Get ISO week and year
			const weekYear = getISOWeekYear(date);
			const weekKey =
				weekYear.year +
				"-W" +
				weekYear.week.toString().padStart(2, "0");

			// Initialize week data if not exists
			if (!weeklyData[weekKey]) {
				weeklyData[weekKey] = {
					coding: 0,
					watching: 0,
				};
			}

			// Add data - ensure we're dealing with numbers
			const dayData = dataGroupByDay[dateStr] || {
				coding: 0,
				watching: 0,
			};
			weeklyData[weekKey].coding += Number(dayData.coding) || 0;
			weeklyData[weekKey].watching += Number(dayData.watching) || 0;
		} catch (e) {
			console.error("Error processing date:", dateStr, e);
		}
	});

	return weeklyData;
}

/**
 * Get ISO week and year from date
 * @param {Date} date
 * @returns {Object} Object with week and year properties
 */
function getISOWeekYear(date) {
	// Create a copy of the date object
	const d = new Date(date.getTime());

	// Set to nearest Thursday (to get the correct ISO week number)
	d.setDate(d.getDate() + 4 - (d.getDay() || 7));

	// Get first day of year
	const yearStart = new Date(d.getFullYear(), 0, 1);

	// Calculate full weeks to nearest Thursday
	const daysSinceYearStart = (d.getTime() - yearStart.getTime()) / 86400000; // Days
	const weekNum = Math.ceil((daysSinceYearStart + 1) / 7);

	// Return week number and year
	return { week: weekNum, year: d.getFullYear() };
}
