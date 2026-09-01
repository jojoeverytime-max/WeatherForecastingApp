import { useEffect, useState } from 'react'
import './App.css'

const defaultCity = 'London'

function formatDay(timestamp) {
  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
  }).format(new Date(timestamp * 1000))
}

function buildFallbackWeather(query) {
  return {
    city: query || defaultCity,
    country: 'GB',
    temperature: 21,
    feelsLike: 22,
    humidity: 56,
    wind: 14,
    condition: 'Clear',
    description: 'clear sky',
    icon: '01d',
    sunrise: 1710000000,
    sunset: 1710050000,
  }
}

function buildFallbackForecast() {
  return [
    { date: Date.now() / 1000 + 86400, temp: 22, condition: 'Clear', icon: '01d' },
    { date: Date.now() / 1000 + 172800, temp: 20, condition: 'Clouds', icon: '02d' },
    { date: Date.now() / 1000 + 259200, temp: 19, condition: 'Rain', icon: '10d' },
    { date: Date.now() / 1000 + 345600, temp: 18, condition: 'Clouds', icon: '03d' },
    { date: Date.now() / 1000 + 432000, temp: 21, condition: 'Clear', icon: '01d' },
  ]
}

function App() {
  const [city, setCity] = useState(defaultCity)
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [isDemoMode, setIsDemoMode] = useState(false)

  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY?.trim()

  async function fetchWeather(query) {
    const resolvedCity = query.trim() || defaultCity
    const hasUsableApiKey =
      typeof apiKey === 'string' &&
      apiKey.length > 0 &&
      !apiKey.includes('your_') &&
      !apiKey.includes('replace') &&
      !apiKey.includes('your_openweather_api_key_here')

    if (!hasUsableApiKey) {
      setWeather(buildFallbackWeather(resolvedCity))
      setForecast(buildFallbackForecast())
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
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(resolvedCity)}&appid=${apiKey}&units=metric`,
        ),
        fetch(
          `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(resolvedCity)}&appid=${apiKey}&units=metric`,
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
      setWeather(buildFallbackWeather(resolvedCity))
      setForecast(buildFallbackForecast())
      setIsDemoMode(true)
      setStatus(err.message || 'Weather data could not be loaded right now. Showing sample data instead.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWeather(defaultCity)
  }, [apiKey])

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
      </section>

      {status ? <p className={`status ${isDemoMode ? 'info' : 'error'}`}>{status}</p> : null}

      {weather ? (
        <>
          <section className="current-card">
            <div>
              <p className="eyebrow">Now in {weather.city}</p>
              <h2>
                {weather.temperature}°C
                <span>{weather.description}</span>
              </h2>
              <p className="current-meta">
                Feels like {weather.feelsLike}°C · Humidity {weather.humidity}% · Wind {weather.wind} km/h
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
                  <strong>{day.temp}°C</strong>
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
