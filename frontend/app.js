// =====================================================
// NOVA WeatherSense
// Frontend Application
// =====================================================

const API_URL =
    "https://nova-weathersense.onrender.com";


// =====================================================
// ELEMENTS
// =====================================================

const connection =
    document.getElementById("connection");

const condition =
    document.getElementById("condition");

const updated =
    document.getElementById("updated");

const deviceId =
    document.getElementById("deviceId");

const temp =
    document.getElementById("temp");

const humidity =
    document.getElementById("humidity");

const rain =
    document.getElementById("rain");

const deviceStatus =
    document.getElementById("deviceStatus");

const locationElement =
    document.getElementById("location");

const forecast =
    document.getElementById("forecast");

const rainProbability =
    document.getElementById("rainProbability");

const wind =
    document.getElementById("wind");

const smartStatus =
    document.getElementById("smartStatus");

const historyCount =
    document.getElementById("historyCount");


// =====================================================
// CHART VARIABLES
// =====================================================

let temperatureChart = null;

let humidityChart = null;


// =====================================================
// SENSOR DATA
// =====================================================

async function updateSensorData() {

    try {

        const response =
            await fetch(
                `${API_URL}/api/sensor`
            );

        if (!response.ok) {

            throw new Error(
                "Sensor API error"
            );

        }

        const data =
            await response.json();


        // Connection

        connection.textContent =
            "● ONLINE";

        connection.className =
            "status online";


        // Device

        deviceId.textContent =
            data.deviceId ||
            "nova-weather-01";


        // Temperature

        if (
            typeof data.temperature ===
            "number"
        ) {

            temp.textContent =
                data.temperature.toFixed(1);

        } else {

            temp.textContent =
                "--";

        }


        // Humidity

        if (
            typeof data.humidity ===
            "number"
        ) {

            humidity.textContent =
                data.humidity.toFixed(1);

        } else {

            humidity.textContent =
                "--";

        }


        // Rain

        rain.textContent =
            data.rain ||
            "UNKNOWN";


        // Device status

        deviceStatus.textContent =
            data.wifi ||
            "OFFLINE";


        // Last update

        if (data.lastUpdate) {

            const time =
                new Date(
                    data.lastUpdate
                );

            updated.textContent =
                "Last sensor update: " +
                time.toLocaleString();

        }


        // Condition

        if (
            data.rain === "WET"
        ) {

            condition.textContent =
                "Rain Detected";

        } else {

            condition.textContent =
                "Weather Monitoring Active";

        }


        updateSmartStatus();

    }

    catch (error) {

        console.error(
            "Sensor error:",
            error
        );

        connection.textContent =
            "● OFFLINE";

        connection.className =
            "status offline";

        deviceStatus.textContent =
            "OFFLINE";

        condition.textContent =
            "Device Offline";

    }

}


// =====================================================
// INTERNET WEATHER
// =====================================================

async function updateInternetWeather() {

    try {

        const response =
            await fetch(
                `${API_URL}/api/weather`
            );

        if (!response.ok) {

            throw new Error(
                "Weather API error"
            );

        }

        const result =
            await response.json();

        if (
            !result.success ||
            !result.data
        ) {

            throw new Error(
                "Invalid weather response"
            );

        }

        const data =
            result.data;


        // Location

        locationElement.textContent =
            data.location ||
            "Unknown";


        // Weather

        forecast.textContent =
            capitalize(
                data.condition ||
                "Unavailable"
            );


        // Rain probability

        if (
            typeof data.rainProbability ===
            "number"
        ) {

            rainProbability.textContent =
                `${Math.round(
                    data.rainProbability
                )}%`;

        } else {

            rainProbability.textContent =
                "--";

        }


        // Wind

        if (
            typeof data.wind ===
            "number"
        ) {

            wind.textContent =
                `${data.wind.toFixed(1)} m/s`;

        } else {

            wind.textContent =
                "--";

        }


        updateSmartStatus();

    }

    catch (error) {

        console.error(
            "Weather error:",
            error
        );

        forecast.textContent =
            "Unavailable";

        rainProbability.textContent =
            "--";

        wind.textContent =
            "--";

    }

}


// =====================================================
// SENSOR HISTORY
// =====================================================

async function updateHistory() {

    try {

        const response =
            await fetch(
                `${API_URL}/api/history`
            );

        if (!response.ok) {

            throw new Error(
                "History API error"
            );

        }

        const result =
            await response.json();

        if (
            !result.success ||
            !Array.isArray(result.data)
        ) {

            return;

        }

        const history =
            result.data;


        historyCount.textContent =
            `${history.length} readings`;


        if (history.length === 0) {

            return;

        }


        // =================================================
        // LABELS
        // =================================================

        const labels =
            history.map(
                item => {

                    const date =
                        new Date(
                            item.timestamp
                        );

                    return date.toLocaleTimeString(
                        [],
                        {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit"
                        }
                    );

                }
            );


        // =================================================
        // TEMPERATURE VALUES
        // =================================================

        const temperatures =
            history.map(
                item =>
                    item.temperature
            );


        // =================================================
        // HUMIDITY VALUES
        // =================================================

        const humidities =
            history.map(
                item =>
                    item.humidity
            );


        // =================================================
        // TEMPERATURE CHART
        // =================================================

        const temperatureCanvas =
            document.getElementById(
                "temperatureChart"
            );

        if (temperatureChart) {

            temperatureChart.destroy();

        }


        temperatureChart =
            new Chart(
                temperatureCanvas,
                {

                    type: "line",

                    data: {

                        labels,

                        datasets: [

                            {

                                label:
                                    "Temperature °C",

                                data:
                                    temperatures,

                                tension:
                                    0.35,

                                fill:
                                    false,

                                pointRadius:
                                    2

                            }

                        ]

                    },

                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,

                        animation:
                            false,

                        plugins: {

                            legend: {

                                display:
                                    true

                            }

                        },

                        scales: {

                            y: {

                                title: {

                                    display:
                                        true,

                                    text:
                                        "°C"

                                }

                            },

                            x: {

                                ticks: {

                                    maxTicksLimit:
                                        8

                                }

                            }

                        }

                    }

                }
            );


        // =================================================
        // HUMIDITY CHART
        // =================================================

        const humidityCanvas =
            document.getElementById(
                "humidityChart"
            );

        if (humidityChart) {

            humidityChart.destroy();

        }


        humidityChart =
            new Chart(
                humidityCanvas,
                {

                    type: "line",

                    data: {

                        labels,

                        datasets: [

                            {

                                label:
                                    "Humidity %",

                                data:
                                    humidities,

                                tension:
                                    0.35,

                                fill:
                                    false,

                                pointRadius:
                                    2

                            }

                        ]

                    },

                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,

                        animation:
                            false,

                        plugins: {

                            legend: {

                                display:
                                    true

                            }

                        },

                        scales: {

                            y: {

                                title: {

                                    display:
                                        true,

                                    text:
                                        "%"

                                },

                                min:
                                    0,

                                max:
                                    100

                            },

                            x: {

                                ticks: {

                                    maxTicksLimit:
                                        8

                                }

                            }

                        }

                    }

                }
            );

    }

    catch (error) {

        console.error(
            "History error:",
            error
        );

    }

}


// =====================================================
// SMART WEATHER STATUS
// =====================================================

function updateSmartStatus() {

    const localRain =
        rain.textContent
            .trim()
            .toUpperCase();


    const probabilityText =
        rainProbability.textContent
            .replace(
                "%",
                ""
            )
            .trim();


    const probability =
        parseFloat(
            probabilityText
        );


    if (
        localRain ===
        "WET"
    ) {

        smartStatus.textContent =
            "🌧️ RAIN DETECTED";

        return;

    }


    if (
        !Number.isNaN(
            probability
        ) &&
        probability >= 60
    ) {

        smartStatus.textContent =
            "🌦️ RAIN MAY OCCUR";

        return;

    }


    if (
        !Number.isNaN(
            probability
        ) &&
        probability < 30
    ) {

        smartStatus.textContent =
            "☀️ LOW CHANCE OF RAIN";

        return;

    }


    smartStatus.textContent =
        "🌥️ WEATHER UNCERTAIN";

}


// =====================================================
// CAPITALIZE
// =====================================================

function capitalize(text) {

    if (!text) {

        return "";

    }

    return text
        .toString()
        .replace(
            /\b\w/g,
            char =>
                char.toUpperCase()
        );

}


// =====================================================
// INITIAL LOAD
// =====================================================

updateSensorData();

updateInternetWeather();

updateHistory();


// =====================================================
// LIVE SENSOR
// =====================================================

setInterval(
    updateSensorData,
    3000
);


// =====================================================
// HISTORY
// Refresh every 10 seconds
// =====================================================

setInterval(
    updateHistory,
    10000
);


// =====================================================
// INTERNET WEATHER
// Refresh every 10 minutes
// =====================================================

setInterval(
    updateInternetWeather,
    10 * 60 * 1000
);