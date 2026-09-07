// =====================================================
// NOVA WeatherSense - Frontend JavaScript
// =====================================================

const API_URL = "https://nova-weathersense.onrender.com";

// =====================================================
// ELEMENTS
// =====================================================

const connection = document.getElementById("connection");

const condition = document.getElementById("condition");
const updated = document.getElementById("updated");
const deviceId = document.getElementById("deviceId");

const temp = document.getElementById("temp");
const humidity = document.getElementById("humidity");
const rain = document.getElementById("rain");
const deviceStatus = document.getElementById("deviceStatus");

const locationElement = document.getElementById("location");
const forecast = document.getElementById("forecast");
const rainProbability = document.getElementById("rainProbability");
const wind = document.getElementById("wind");

const smartStatus = document.getElementById("smartStatus");

// =====================================================
// SENSOR DATA
// =====================================================

async function updateSensorData() {

    try {

        const response = await fetch(
            `${API_URL}/api/sensor`
        );

        if (!response.ok) {
            throw new Error("Sensor API error");
        }

        const data = await response.json();

        // -------------------------------
        // Connection
        // -------------------------------

        connection.textContent = "● ONLINE";
        connection.className = "status online";

        // -------------------------------
        // Device
        // -------------------------------

        deviceId.textContent =
            data.deviceId || "nova-weather-01";

        // -------------------------------
        // Temperature
        // -------------------------------

        if (
            typeof data.temperature === "number" &&
            !Number.isNaN(data.temperature)
        ) {

            temp.textContent =
                data.temperature.toFixed(1);

        } else {

            temp.textContent = "--";

        }

        // -------------------------------
        // Humidity
        // -------------------------------

        if (
            typeof data.humidity === "number" &&
            !Number.isNaN(data.humidity)
        ) {

            humidity.textContent =
                data.humidity.toFixed(1);

        } else {

            humidity.textContent = "--";

        }

        // -------------------------------
        // Rain Sensor
        // -------------------------------

        rain.textContent =
            data.rain || "UNKNOWN";

        // -------------------------------
        // Device Status
        // -------------------------------

        deviceStatus.textContent =
            data.wifi || "OFFLINE";

        // -------------------------------
        // Last Update
        // -------------------------------

        if (data.lastUpdate) {

            const time =
                new Date(data.lastUpdate);

            updated.textContent =
                "Last sensor update: " +
                time.toLocaleString();

        } else {

            updated.textContent =
                "No sensor data received yet";

        }

        // -------------------------------
        // Basic Condition
        // -------------------------------

        if (data.rain === "WET") {

            condition.textContent =
                "Rain Detected";

        } else if (data.rain === "DRY") {

            condition.textContent =
                "Weather Monitoring Active";

        } else {

            condition.textContent =
                "Monitoring Weather...";

        }

        // Update smart status
        updateSmartStatus();

    } catch (error) {

        console.error(
            "Sensor data error:",
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

        const response = await fetch(
            `${API_URL}/api/weather`
        );

        if (!response.ok) {
            throw new Error("Weather API error");
        }

        const result = await response.json();

        if (
            !result.success ||
            !result.data
        ) {

            throw new Error(
                "Invalid weather response"
            );

        }

        const data = result.data;

        // -------------------------------
        // Location
        // -------------------------------

        locationElement.textContent =
            data.location || "Unknown";

        // -------------------------------
        // Internet Weather
        // -------------------------------

        if (data.condition) {

            forecast.textContent =
                capitalize(data.condition);

        } else {

            forecast.textContent =
                "Unavailable";

        }

        // -------------------------------
        // Rain Probability
        // -------------------------------

        if (
            typeof data.rainProbability === "number"
        ) {

            rainProbability.textContent =
                `${Math.round(data.rainProbability)}%`;

        } else {

            rainProbability.textContent =
                "--";

        }

        // -------------------------------
        // Wind
        // -------------------------------

        if (
            typeof data.wind === "number"
        ) {

            wind.textContent =
                `${data.wind.toFixed(1)} m/s`;

        } else {

            wind.textContent =
                "--";

        }

        // Update smart status
        updateSmartStatus();

    } catch (error) {

        console.error(
            "Internet weather error:",
            error
        );

        locationElement.textContent =
            "Weather unavailable";

        forecast.textContent =
            "Unable to fetch weather";

        rainProbability.textContent =
            "--";

        wind.textContent =
            "--";

        updateSmartStatus();

    }

}


// =====================================================
// SMART WEATHER STATUS
// =====================================================

function updateSmartStatus() {

    const localRain =
        rain.textContent.trim().toUpperCase();

    const probabilityText =
        rainProbability.textContent
            .replace("%", "")
            .trim();

    const probability =
        parseFloat(probabilityText);

    // -------------------------------
    // Local sensor says WET
    // -------------------------------

    if (localRain === "WET") {

        smartStatus.textContent =
            "🌧️ RAIN DETECTED";

        return;

    }

    // -------------------------------
    // Rain probability is high
    // -------------------------------

    if (
        !Number.isNaN(probability) &&
        probability >= 60
    ) {

        smartStatus.textContent =
            "🌦️ RAIN MAY OCCUR";

        return;

    }

    // -------------------------------
    // Rain probability is low
    // -------------------------------

    if (
        !Number.isNaN(probability) &&
        probability < 30
    ) {

        smartStatus.textContent =
            "☀️ LOW CHANCE OF RAIN";

        return;

    }

    // -------------------------------
    // Otherwise
    // -------------------------------

    smartStatus.textContent =
        "🌥️ WEATHER UNCERTAIN";

}


// =====================================================
// CAPITALIZE TEXT
// =====================================================

function capitalize(text) {

    if (!text) {
        return "";
    }

    return text
        .toString()
        .replace(/\b\w/g, char =>
            char.toUpperCase()
        );

}


// =====================================================
// INITIAL LOAD
// =====================================================

updateSensorData();
updateInternetWeather();


// =====================================================
// LIVE SENSOR UPDATE
// Every 3 seconds
// =====================================================

setInterval(
    updateSensorData,
    3000
);


// =====================================================
// INTERNET WEATHER UPDATE
// Every 10 minutes
// =====================================================

setInterval(
    updateInternetWeather,
    10 * 60 * 1000
);