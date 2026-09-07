const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 10000;

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());
app.use(express.json());

// =====================================================
// CURRENT SENSOR DATA
// =====================================================

let weatherData = {
  deviceId: "nova-weather-01",
  temperature: null,
  humidity: null,
  rain: "UNKNOWN",
  wifi: "OFFLINE",
  lastUpdate: null
};

// =====================================================
// SENSOR HISTORY
// =====================================================

// Keep latest 60 readings
// ESP sends every 10 seconds
// 60 readings ≈ 10 minutes

let sensorHistory = [];

const MAX_HISTORY = 60;

// =====================================================
// INTERNET WEATHER
// =====================================================

let internetWeather = {
  location: process.env.WEATHER_LOCATION || "Begusarai, Bihar",
  temperature: null,
  feelsLike: null,
  condition: "Unavailable",
  humidity: null,
  wind: null,
  rainProbability: null,
  lastUpdate: null
};

// =====================================================
// WEATHER CACHE
// =====================================================

let lastWeatherFetch = 0;

const WEATHER_CACHE_TIME =
  10 * 60 * 1000;

// =====================================================
// OPENWEATHER
// =====================================================

async function fetchInternetWeather() {

  const apiKey =
    process.env.OPENWEATHER_API_KEY;

  const lat =
    process.env.WEATHER_LAT;

  const lon =
    process.env.WEATHER_LON;

  if (!apiKey || !lat || !lon) {

    console.log(
      "OpenWeather configuration missing"
    );

    return internetWeather;
  }

  // Use cached weather if available

  if (
    Date.now() - lastWeatherFetch <
    WEATHER_CACHE_TIME &&
    internetWeather.lastUpdate
  ) {

    return internetWeather;
  }

  try {

    // ==========================================
    // CURRENT WEATHER
    // ==========================================

    const currentURL =
      "https://api.openweathermap.org/data/2.5/weather" +
      `?lat=${lat}` +
      `&lon=${lon}` +
      `&appid=${apiKey}` +
      `&units=metric`;

    const currentResponse =
      await fetch(currentURL);

    if (!currentResponse.ok) {

      throw new Error(
        `Current weather HTTP ${currentResponse.status}`
      );
    }

    const current =
      await currentResponse.json();

    // ==========================================
    // FORECAST
    // ==========================================

    const forecastURL =
      "https://api.openweathermap.org/data/2.5/forecast" +
      `?lat=${lat}` +
      `&lon=${lon}` +
      `&appid=${apiKey}` +
      `&units=metric`;

    const forecastResponse =
      await fetch(forecastURL);

    if (!forecastResponse.ok) {

      throw new Error(
        `Forecast HTTP ${forecastResponse.status}`
      );
    }

    const forecast =
      await forecastResponse.json();

    // ==========================================
    // RAIN PROBABILITY
    // ==========================================

    let maxRainProbability = 0;

    if (
      forecast.list &&
      forecast.list.length
    ) {

      // Next 24 hours
      const next24Hours =
        forecast.list.slice(0, 8);

      for (
        const item of next24Hours
      ) {

        if (
          typeof item.pop === "number"
        ) {

          const probability =
            item.pop * 100;

          if (
            probability >
            maxRainProbability
          ) {

            maxRainProbability =
              probability;
          }
        }
      }
    }

    // ==========================================
    // SAVE WEATHER
    // ==========================================

    internetWeather = {

      location:
        process.env.WEATHER_LOCATION ||
        "Begusarai, Bihar",

      temperature:
        current.main?.temp ?? null,

      feelsLike:
        current.main?.feels_like ?? null,

      condition:
        current.weather?.[0]?.description ||
        "Unavailable",

      humidity:
        current.main?.humidity ?? null,

      wind:
        current.wind?.speed ?? null,

      rainProbability:
        Math.round(
          maxRainProbability
        ),

      lastUpdate:
        new Date().toISOString()
    };

    lastWeatherFetch =
      Date.now();

    console.log(
      "Internet Weather Updated:",
      internetWeather
    );

    return internetWeather;

  } catch (error) {

    console.error(
      "Weather API Error:",
      error.message
    );

    return internetWeather;
  }
}

// =====================================================
// HOME
// =====================================================

app.get("/", (req, res) => {

  res.json({

    project:
      "NOVA WeatherSense",

    status:
      "ONLINE",

    message:
      "WeatherSense backend is running"

  });

});

// =====================================================
// HEALTH
// =====================================================

app.get(
  "/api/health",
  (req, res) => {

    res.json({

      status:
        "ONLINE",

      time:
        new Date().toISOString()

    });

  }
);

// =====================================================
// RECEIVE SENSOR DATA
// =====================================================

app.post(
  "/api/sensor",
  (req, res) => {

    const {
      deviceId,
      temperature,
      humidity,
      rain
    } = req.body;

    // Validate sensor data

    if (
      typeof temperature !== "number" ||
      typeof humidity !== "number"
    ) {

      return res.status(400).json({

        success:
          false,

        message:
          "temperature and humidity must be numbers"

      });

    }

    // ==========================================
    // UPDATE CURRENT DATA
    // ==========================================

    weatherData = {

      deviceId:
        deviceId ||
        "nova-weather-01",

      temperature,

      humidity,

      rain:
        rain ||
        "UNKNOWN",

      wifi:
        "ONLINE",

      lastUpdate:
        new Date().toISOString()

    };

    // ==========================================
    // ADD TO HISTORY
    // ==========================================

    sensorHistory.push({

      temperature,

      humidity,

      rain:
        rain ||
        "UNKNOWN",

      timestamp:
        new Date().toISOString()

    });

    // ==========================================
    // LIMIT HISTORY
    // ==========================================

    if (
      sensorHistory.length >
      MAX_HISTORY
    ) {

      sensorHistory.shift();

    }

    console.log(
      "Sensor Data Received:",
      weatherData
    );

    console.log(
      `History Points: ${sensorHistory.length}`
    );

    // ==========================================
    // RESPONSE
    // ==========================================

    res.json({

      success:
        true,

      message:
        "Sensor data received",

      data:
        weatherData

    });

  }
);

// =====================================================
// CURRENT SENSOR DATA
// =====================================================

app.get(
  "/api/sensor",
  (req, res) => {

    res.json(
      weatherData
    );

  }
);

// =====================================================
// SENSOR HISTORY
// =====================================================

app.get(
  "/api/history",
  (req, res) => {

    res.json({

      success:
        true,

      count:
        sensorHistory.length,

      data:
        sensorHistory

    });

  }
);

// =====================================================
// INTERNET WEATHER
// =====================================================

app.get(
  "/api/weather",
  async (req, res) => {

    const data =
      await fetchInternetWeather();

    res.json({

      success:
        true,

      data

    });

  }
);

// =====================================================
// START SERVER
// =====================================================

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `NOVA WeatherSense running on port ${PORT}`
    );

  }
);