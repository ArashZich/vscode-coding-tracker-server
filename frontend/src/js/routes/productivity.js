//@ts-check

let utils = require("../utils/utils"),
    resizer = require("../utils/resizer"),
    reportFilter = require("../reportFilter"),
    API = require("../api"),
    { URL } = API;

// Components for this sub-page
let $page = $('<div class="page-productivity" style="display: none"></div>');
let $container = $('<div class="row"></div>');
$page.append($container);

// Add to main container
$("#bodyContainer").append($page);

// --- CHART MODULES ---
let weekdayWeekendChart = require("../charts/weekday_weekend"); // Replaced heatmap
let dailyActiveTimeChart = require("../charts/daily_active_time"); 
let focusDistributionChart = require("../charts/focus_distribution");
let projectsChart = require("../charts/projects");

/** @type {EChartsInstance[]} */
let charts = [];

module.exports = { name: utils.basename(__filename, ".js"), start, stop };

function stop() {
    charts.forEach((chart) => chart.dispose());
    $page.hide();
}

function start() {
    // Create chart containers for the new 2x2 grid layout
    if ($container.children().length === 0) {
        createChartContainers();
    }

    $page.show();

    // --- INITIALIZE CHARTS ---
    charts = [
        weekdayWeekendChart.init(utils.getChartDom("weekday_vs_weekend", $page)[0]),
        dailyActiveTimeChart.init(utils.getChartDom("daily_active_time", $page)[0]),
        focusDistributionChart.init(utils.getChartDom("focus_distribution", $page)[0]),
        projectsChart.init(utils.getChartDom("projects", $page)[0], null, 5),
    ];

    resizer.removeSubscriber();
    resizer.subscribe(charts);

    reportFilter.removeSubscribers();
    reportFilter.subscribe(loadChartData);

    loadChartData(reportFilter.getFilter());
}

function loadChartData(filter) {
    // Add groupBy parameter to fetch all necessary data for the charts
    const overviewUrl = API.URL.overview() + "&groupBy=31"; // 31 = 1(day)+2(hour)+4(language)+8(project)+16(vcs)
    API.requestSilent(overviewUrl, (data) => {
        // Update all charts with the new data structure
        weekdayWeekendChart.update(data.groupBy.day);
        dailyActiveTimeChart.update(data);
        focusDistributionChart.update(data);
        projectsChart.update(data.groupBy.project);
    });
}

function createChartContainers() {
    $container.html(`
        <!-- Top Row -->
        <div class="col-lg-6 mb-4">
            <div class="card h-100">
                <div class="card-body">
                    <div data-chart="weekday_vs_weekend" style="height: 350px"></div>
                </div>
            </div>
        </div>
        <div class="col-lg-6 mb-4">
            <div class="card h-100">
                <div class="card-body">
                    <div data-chart="daily_active_time" style="height: 350px"></div>
                </div>
            </div>
        </div>

        <!-- Bottom Row -->
        <div class="col-lg-6 mb-4">
            <div class="card h-100">
                <div class="card-body">
                    <div data-chart="focus_distribution" style="height: 350px"></div>
                </div>
            </div>
        </div>
        <div class="col-lg-6 mb-4">
            <div class="card h-100">
                <div class="card-body">
                    <div data-chart="projects" style="height: 350px"></div>
                </div>
            </div>
        </div>
    `);
}