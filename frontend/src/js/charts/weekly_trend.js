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
 * Format a time value in hours for better display
 * @param {number} value Time in hours
 * @param {boolean} useUnit Whether to include the unit (h or min)
 * @returns {string} Formatted time
 */
function formatTimeValue(value, useUnit = true) {
	if (value === 0) return useUnit ? "0 h" : "0";

	// If extremely small value (less than a minute), show as "<1 min"
	if (value < 0.016) {
		// Less than 1 minute (1/60 ≈ 0.016)
		return useUnit ? "<1 min" : "<1m";
	}

	// If less than 1 hour, convert to minutes
	if (value < 1) {
		return useUnit
			? Math.round(value * 60) + " min"
			: Math.round(value * 60) + "m";
	}

	// Round to one decimal place
	const roundedValue = Math.round(value * 10) / 10;

	// If it's a whole number, don't show decimal
	if (roundedValue === Math.floor(roundedValue)) {
		return useUnit
			? Math.floor(roundedValue) + " h"
			: Math.floor(roundedValue) + "h";
	}

	// Otherwise show with one decimal place
	return useUnit ? roundedValue + " h" : roundedValue + "h";
}

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
			top: "5",
			textStyle: {
				fontSize: 16,
			},
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

					// Format with our helper function
					const formattedValue = formatTimeValue(value);

					result += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${color};"></span>`;
					result += `${seriesName}: <strong>${formattedValue}</strong><br>`;
				});

				return result;
			},
			textStyle: {
				fontSize: 12,
			},
		},
		legend: {
			data: ["Coding", "Watching"],
			top: 30,
			textStyle: {
				fontSize: 12,
			},
			itemWidth: 15,
			itemHeight: 10,
		},
		grid: {
			left: "40px",
			right: "20px",
			bottom: "60px",
			top: "70px",
			containLabel: true,
		},
		toolbox: {
			show: false,
		},
		xAxis: {
			type: "category",
			boundaryGap: false,
			data: formattedWeeks,
			axisLabel: {
				interval: 0,
				rotate: 45,
				fontSize: 10,
				margin: 8,
			},
		},
		yAxis: {
			type: "value",
			name: "Hours",
			nameTextStyle: {
				fontSize: 12,
				padding: [0, 0, 0, 0],
			},
			axisLabel: {
				formatter: function (value) {
					return formatTimeValue(value);
				},
				fontSize: 10,
			},
			splitLine: {
				lineStyle: {
					type: "dashed",
					opacity: 0.7,
				},
			},
		},
		series: [
			{
				name: "Coding",
				type: "line",
				stack: "Total",
				data: codingData,
				lineStyle: {
					width: 2.5,
					color: "#1b5e20",
				},
				itemStyle: {
					color: "#1b5e20",
				},
				areaStyle: {
					color: "#4caf50",
					opacity: 0.3,
				},
				emphasis: {
					focus: "series",
				},
				markPoint: {
					data: [
						{
							type: "max",
							name: "Max",
							symbolSize: 50,
							label: {
								formatter: function (params) {
									return formatTimeValue(
										params.data.value,
										false
									);
								},
								fontSize: 10,
							},
						},
						{
							type: "min",
							name: "Min",
							symbolSize: 50,
							label: {
								formatter: function (params) {
									return formatTimeValue(
										params.data.value,
										false
									);
								},
								fontSize: 10,
							},
						},
					],
				},
				markLine: {
					data: [
						{
							type: "average",
							name: "Avg",
							label: {
								formatter: function (params) {
									return (
										"Avg: " +
										formatTimeValue(params.value, false)
									);
								},
								fontSize: 10,
							},
						},
					],
				},
			},
			{
				name: "Watching",
				type: "line",
				stack: "Total",
				data: watchingData,
				lineStyle: {
					width: 2.5,
					color: "#01579b",
				},
				itemStyle: {
					color: "#01579b",
				},
				areaStyle: {
					color: "#2196f3",
					opacity: 0.3,
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
