import { useEffect, useState } from 'react'
import './App.css'

const defaultCity = 'London'

function formatDay(timestamp) {
  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
  }).format(new Date(timestamp * 1000))
}

function formatTemperature(value) {
  return Math.round(value)
}

function buildFallbackWeather(query, unit) {
  const baseTemperature = unit === 'imperial' ? 70 : 21
  const baseFeelsLike = unit === 'imperial' ? 72 : 22
  const baseWind = unit === 'imperial' ? 9 : 14

  return {
    city: query || defaultCity,
    country: 'GB',
    temperature: baseTemperature,
    feelsLike: baseFeelsLike,
    humidity: 56,
    wind: baseWind,
    condition: 'Clear',
    description: 'clear sky',
    icon: '01d',
    sunrise: 1710000000,
    sunset: 1710050000,
  }
}

function buildFallbackForecast(unit) {
  const baseTemps = unit === 'imperial' ? [72, 68, 66, 64, 70] : [22, 20, 19, 18, 21]

  return baseTemps.map((temp, index) => ({
    date: Date.now() / 1000 + (index + 1) * 86400,
    temp,
    condition: ['Clear', 'Clouds', 'Rain', 'Clouds', 'Clear'][index],
    icon: ['01d', '02d', '10d', '03d', '01d'][index],
  }))
}

function App() {
  const [city, setCity] = useState(defaultCity)
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [unit, setUnit] = useState('metric')

  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY?.trim()
  const unitLabel = unit === 'imperial' ? '°F' : '°C'
  const windUnitLabel = unit === 'imperial' ? 'mph' : 'km/h'

  async function fetchWeather(query) {
    const resolvedCity = query.trim() || defaultCity
    const hasUsableApiKey =
      typeof apiKey === 'string' &&
      apiKey.length > 0 &&
      !apiKey.includes('your_') &&
      !apiKey.includes('replace') &&
      !apiKey.includes('your_openweather_api_key_here')

    if (!hasUsableApiKey) {
      setWeather(buildFallbackWeather(resolvedCity, unit))
      setForecast(buildFallbackForecast(unit))
      setIsDemoMode(true)
      setStatus('OpenWeatherMap API key is missing. Add a real key to .env.local and restart the dev server for live weather data.')
      setLoading(false)
      return
    }

    setLoading(true)
    setStatus('')
    setIsDemoMode(false)

    try {
      const [currentResponse, forecastResponse] = await Promise.all([
        fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(resolvedCity)}&appid=${apiKey}&units=${unit}`,
        ),
        fetch(
          `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(resolvedCity)}&appid=${apiKey}&units=${unit}`,
        ),
      ])

      if (currentResponse.status === 401 || forecastResponse.status === 401) {
        throw new Error('OpenWeatherMap rejected the request. Your API key may be invalid or inactive. Update .env.local with a real key and restart the server.')
      }

      if (!currentResponse.ok || !forecastResponse.ok) {
        throw new Error('City not found. Showing sample weather data instead.')
      }

      const currentData = await currentResponse.json()
      const forecastData = await forecastResponse.json()

      const dailyForecast = forecastData.list
        .filter((_, index) => index % 8 === 0)
        .slice(0, 5)
        .map((item) => ({
          date: item.dt,
          temp: Math.round(item.main.temp),
          condition: item.weather[0].main,
          icon: item.weather[0].icon,
        }))

      setWeather({
        city: currentData.name,
        country: currentData.sys.country,
        temperature: Math.round(currentData.main.temp),
        feelsLike: Math.round(currentData.main.feels_like),
        humidity: currentData.main.humidity,
        wind: Math.round(currentData.wind.speed),
        condition: currentData.weather[0].main,
        description: currentData.weather[0].description,
        icon: currentData.weather[0].icon,
        sunrise: currentData.sys.sunrise,
        sunset: currentData.sys.sunset,
      })
      setForecast(dailyForecast)
    } catch (err) {
      setWeather(buildFallbackWeather(resolvedCity, unit))
      setForecast(buildFallbackForecast(unit))
      setIsDemoMode(true)
      setStatus(err.message || 'Weather data could not be loaded right now. Showing sample data instead.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWeather(city)
  }, [apiKey, unit])

  function handleSubmit(event) {
    event.preventDefault()
    fetchWeather(city)
  }

  const conditionClass = weather?.condition?.toLowerCase() || 'default'

  return (
    <main className={`app-shell ${conditionClass}`}>
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Jo Jo's lovely weather guide</p>
          <h1>Weather updates. So you can change what you are wearing now.</h1>
          <p className="hero-text">
            Don't trust your instincts. Take a look how the weather will be look like today. Especially where you are going.
          </p>
        </div>

        <form className="search-bar" onSubmit={handleSubmit}>
          <input
            aria-label="City name"
            placeholder="Search for a city"
            value={city}
            onChange={(event) => setCity(event.target.value)}
          />
          <button type="submit">{loading ? 'Loading…' : 'Show weather'}</button>
        </form>

        <div className="unit-toggle" aria-label="Temperature unit selector">
          <button
            type="button"
            className={unit === 'metric' ? 'active' : ''}
            onClick={() => setUnit('metric')}
          >
            °C
          </button>
          <button
            type="button"
            className={unit === 'imperial' ? 'active' : ''}
            onClick={() => setUnit('imperial')}
          >
            °F
          </button>
        </div>
      </section>

      {status ? <p className={`status ${isDemoMode ? 'info' : 'error'}`}>{status}</p> : null}

      {weather ? (
        <>
          <section className="current-card">
            <div>
              <p className="eyebrow">Now in {weather.city}</p>
              <h2>
                {formatTemperature(weather.temperature)}{unitLabel}
                <span>{weather.description}</span>
              </h2>
              <p className="current-meta">
                Feels like {formatTemperature(weather.feelsLike)}{unitLabel} · Humidity {weather.humidity}% · Wind {formatTemperature(weather.wind)} {windUnitLabel}
              </p>
            </div>

            <div className="weather-badge">
              <img
                src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                alt={weather.description}
              />
              <div>
                <p>{weather.condition}</p>
                <small>{weather.city}, {weather.country}</small>
              </div>
            </div>
          </section>

          <section className="details-grid">
            <article>
              <span>Sunrise</span>
              <strong>{new Date(weather.sunrise * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</strong>
            </article>
            <article>
              <span>Sunset</span>
              <strong>{new Date(weather.sunset * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</strong>
            </article>
            <article>
              <span>Condition</span>
              <strong>{weather.condition}</strong>
            </article>
            <article>
              <span>Location</span>
              <strong>{weather.city}, {weather.country}</strong>
            </article>
          </section>

          <section className="forecast-section">
            <div className="section-heading">
              <h3>5-day outlook</h3>
              <p>Gentle transitions and clear skies ahead.</p>
            </div>
            <div className="forecast-grid">
              {forecast.map((day) => (
                <article key={day.date} className="forecast-card">
                  <p>{formatDay(day.date)}</p>
                  <img src={`https://openweathermap.org/img/wn/${day.icon}.png`} alt={day.condition} />
                  <strong>{formatTemperature(day.temp)}{unitLabel}</strong>
                  <span>{day.condition}</span>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </main>
  )
}

export default App
