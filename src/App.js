import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import background from "./assets/clouds-bg.jpg";

const API_KEY = process.env.REACT_APP_API_KEY;

const App = () => {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [unit, setUnit] = useState("metric");
  const [loading, setLoading] = useState(false);
  const [savedCities, setSavedCities] = useState(
    JSON.parse(localStorage.getItem("savedCities")) || []
  );
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const getWeather = async (query) => {
    setLoading(true);
    try {
      const weatherRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${API_KEY}&units=${unit}`
      );
      const forecastRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?q=${query}&appid=${API_KEY}&units=${unit}`
      );
      setWeather(weatherRes.data);
      setForecast(filterForecast(forecastRes.data.list));
    } catch {
      alert("City not found!");
    }
    setLoading(false);
  };

  const filterForecast = (list) => {
    const daily = [];
    const seen = new Set();
    list.forEach((entry) => {
      const date = entry.dt_txt.split(" ")[0];
      if (!seen.has(date) && entry.dt_txt.includes("12:00:00")) {
        seen.add(date);
        daily.push(entry);
      }
    });
    return daily.slice(0, 5);
  };

  const handleSearch = () => {
    if (city.trim()) getWeather(city);
  };

  
  const handleSaveCity = () => {
    if (weather && !savedCities.includes(weather.name)) {
      const updated = [...savedCities, weather.name];
      setSavedCities(updated);
      localStorage.setItem("savedCities", JSON.stringify(updated));
    }
  };

  const handleSelectSavedCity = (cityName) => {
    setCity(cityName);
    getWeather(cityName);
  };

  const handleLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        setLoading(true);
        try {
          const res = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=${unit}`
          );
          const forecastRes = await axios.get(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=${unit}`
          );
          setWeather(res.data);
          setForecast(filterForecast(forecastRes.data.list));
          setCity(res.data.name);
        } catch {
          alert("Could not fetch your location's weather.");
        }
        setLoading(false);
      });
    } else {
      alert("Geolocation not supported.");
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const getCountryFlag = (code) =>
    code ? `https://flagsapi.com/${code}/flat/32.png` : "🌍";

  const getWeatherIcon = (icon) =>
    `https://openweathermap.org/img/wn/${icon}@2x.png`;
  
const toggleUnit = () => {
  setUnit((prevUnit) => (prevUnit === "metric" ? "imperial" : "metric"));
};


  return (
    <div className="app-container" style={{ backgroundImage: `url(${background})` }}>
      <nav className="navbar">
        <div className="logo">🌤️ NovaWeather</div>
        <div className="nav-controls">
          <div className="search-group">
            <input
              type="text"
              placeholder="Search city..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button onClick={handleSearch}>Search</button>
          </div>
        <div className="unit-toggle" onClick={toggleUnit}>
  <span className={unit === "metric" ? "active" : ""}>°C</span>
  <span className={unit === "imperial" ? "active" : ""}>°F</span>
</div>

          <button onClick={handleLocation}>📍 My Location</button>
          <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </div>
      </nav>

      <div className="overlay">
        <header>
          <h1>Weather Forecast</h1>
          <div className="date">{new Date().toLocaleString()}</div>
        </header>

        {loading ? (
          <div className="loader">Loading weather...</div>
        ) : (
          weather && (
            <div className="weather-info"style={{ color: "black" }}>
              <h2>
                {weather.name}, {weather.sys.country}{" "}
                <img
                  src={getCountryFlag(weather.sys.country)}
                  alt="flag"
                  style={{ verticalAlign: "middle" }}
                />
              </h2>
              <img
                src={getWeatherIcon(weather.weather[0].icon)}
                alt="weather icon"
              />
              <h3>{weather.weather[0].description}</h3>
              {weather && weather.main && (
  <h1 className="temp">
    {Math.round(weather.main.temp)}° {unit === "metric" ? "C" : "F"}
  </h1>
)}

              <p>Humidity: {weather.main.humidity}%</p>
              <p>Wind: {weather.wind.speed} {unit === "metric" ? "m/s" : "mph"}</p>
              <button onClick={handleSaveCity}>📌 Save City</button>

              {forecast.length > 0 && (
                <div className="forecast-container">
                  {forecast.map((day, idx) => (
                    <div className="forecast-card" key={idx}>
                      <h5>{formatDate(day.dt)}</h5>
                      <img
                        src={getWeatherIcon(day.weather[0].icon)}
                        alt="forecast icon"
                      />
                      <p>{Math.round(day.main.temp)}°{unit === "metric" ? "C" : "F"}</p>
                      <p>{day.weather[0].main}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        )}

        {savedCities.length > 0 && (
          <div className="saved-cities">
            <h4>Saved Cities:</h4>
            {savedCities.map((c, idx) => (
              <button
                className="city-btn"
                key={idx}
                onClick={() => handleSelectSavedCity(c)}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
