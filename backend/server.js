const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());


// ===============================
// SENSOR DATA
// ===============================

let weatherData = {
  deviceId: "nova-weather-01",
  temperature: null,
  humidity: null,
  rain: "UNKNOWN",
  wifi: "OFFLINE",
  lastUpdate: null
};


// ===============================
// INTERNET WEATHER DATA
// ===============================

let internetWeather = {
  location: process.env.WEATHER_LOCATION || "Not configured",
  temperature: null,
  feelsLike: null,
  condition: "Unavailable",
  humidity: null,
  wind: null,
  rainProbability: null,
  lastUpdate: null
};


// Weather API cache
let lastWeatherFetch = 0;

const WEATHER_CACHE_TIME = 10 * 60 * 1000;


// ===============================
// HOME ROUTE
// ===============================

app.get("/", (req, res) => {
  res.json({
    project: "NOVA WeatherSense",
    status: "ONLINE",
    message: "WeatherSense backend is running"
  });
});


// ===============================
// HEALTH CHECK
// ===============================

app.get("/api/health", (req, res) => {
  res.json({
    status: "ONLINE",
    time: new Date().toISOString()
  });
});


// ===============================
// RECEIVE ESP8266 SENSOR DATA
// ===============================

app.post("/api/sensor", (req, res) => {

  const {
    deviceId,
    temperature,
    humidity,
    rain
  } = req.body;


  if (
    typeof temperature !== "number" ||
    typeof humidity !== "number"
  ) {

    return res.status(400).json({
      success: false,
      message: "temperature and humidity must be numbers"
    });

  }


  weatherData = {

    deviceId: deviceId || "nova-weather-01",

    temperature,

    humidity,

    rain: rain || "UNKNOWN",

    wifi: "ONLINE",

    lastUpdate: new Date().toISOString()

  };


  console.log(
    "Sensor Data Received:",
    weatherData
  );


  res.json({

    success: true,

    message: "Sensor data received",

    data: weatherData

  });

});


// ===============================
// GET SENSOR DATA
// ===============================

app.get("/api/sensor", (req, res) => {

  res.json(weatherData);

});


// ===============================
// FETCH INTERNET WEATHER
// ===============================

async function fetchInternetWeather() {

  const apiKey =
    process.env.OPENWEATHER_API_KEY;

  const lat =
    process.env.WEATHER_LAT;

  const lon =
    process.env.WEATHER_LON;


  // Check configuration

  if (!apiKey || !lat || !lon) {

    throw new Error(
      "Weather API configuration missing"
    );

  }


  // Current weather API

  const currentURL =
    `https://api.openweathermap.org/data/2.5/weather` +
    `?lat=${lat}` +
    `&lon=${lon}` +
    `&appid=${apiKey}` +
    `&units=metric`;


  // Forecast API

  const forecastURL =
    `https://api.openweathermap.org/data/2.5/forecast` +
    `?lat=${lat}` +
    `&lon=${lon}` +
    `&appid=${apiKey}` +
    `&units=metric`;


  // Call both APIs

  const [
    currentResponse,
    forecastResponse
  ] = await Promise.all([

    fetch(currentURL),

    fetch(forecastURL)

  ]);


  // Check current weather response

  if (!currentResponse.ok) {

    throw new Error(
      `Current weather API error: ${currentResponse.status}`
    );

  }


  // Check forecast response

  if (!forecastResponse.ok) {

    throw new Error(
      `Forecast API error: ${forecastResponse.status}`
    );

  }


  const current =
    await currentResponse.json();

  const forecast =
    await forecastResponse.json();


  // ===============================
  // RAIN PROBABILITY
  // Next 24 hours
  // ===============================

  const next24Hours =
    forecast.list.slice(0, 8);


  const rainProbability = Math.round(

    Math.max(

      ...next24Hours.map(item =>

        Number(item.pop || 0) * 100

      )

    )

  );


  // ===============================
  // SAVE WEATHER DATA
  // ===============================

  internetWeather = {

    location:
      process.env.WEATHER_LOCATION ||
      current.name ||
      "Unknown",


    temperature:
      current.main?.temp ?? null,


    feelsLike:
      current.main?.feels_like ?? null,


    condition:
      current.weather?.[0]?.description ||
      "Unknown",


    humidity:
      current.main?.humidity ?? null,


    wind:
      current.wind?.speed ?? null,


    rainProbability,


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

}


// ===============================
// WEATHER API ENDPOINT
// ===============================

app.get("/api/weather", async (req, res) => {

  try {

    // Fetch new weather data
    // only every 10 minutes

    if (
      Date.now() - lastWeatherFetch >
      WEATHER_CACHE_TIME
    ) {

      await fetchInternetWeather();

    }


    res.json({

      success: true,

      data: internetWeather

    });

  }

  catch (error) {

    console.error(
      "Weather Error:",
      error.message
    );


    res.status(500).json({

      success: false,

      message:
        "Unable to fetch internet weather"

    });

  }

});


// ===============================
// START SERVER
// ===============================

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `NOVA WeatherSense running on port ${PORT}`
    );

  }
);