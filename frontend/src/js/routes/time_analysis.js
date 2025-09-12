//@ts-check

let utils = require("../utils/utils"),
    resizer = require("../utils/resizer"),
    reportFilter = require("../reportFilter"),
    API = require("../api"),
    { URL } = API;

// Chart module for this page
let timeAnalysisChart = require("../charts/time_analysis_chart");

// Page components
let $page = $('<div class="page-time-analysis" style="display: none"></div>');
let pageTitle = '<h2 class="text-center mb-4">Active Time Analysis</h2>';
let chartContainer = '<div data-chart="time_analysis_chart" style="height: 450px"></div>';
let statsContainer = '<div id="time-analysis-stats" class="row mt-4"></div>';

$page.append(pageTitle + chartContainer + statsContainer);

// Add to main container
$("#bodyContainer").append($page);

/** @type {EChartsInstance[]} */
let charts = [];

module.exports = { name: utils.basename(__filename, ".js"), start, stop };

function stop() {
    charts.forEach((chart) => chart.dispose());
    $page.hide();
}

function start() {
    $page.show();

    if (charts.length === 0) {
        charts.push(timeAnalysisChart.init(utils.getChartDom("time_analysis_chart", $page)[0]));
    }

    resizer.removeSubscriber();
    resizer.subscribe(charts);

    reportFilter.removeSubscribers();
    reportFilter.subscribe(loadChartData);

    loadChartData(reportFilter.getFilter());
}

function loadChartData(filter) {
    // Fetch overview data (no need for extra groupBy)
    API.requestSilent(URL.overview(), (data) => {
        // The chart module now only handles the 'overall' view
        timeAnalysisChart.update(data, "#time-analysis-stats");
    });
}