export const DEFAULT_CITY = 'London';

function createFallbackWeather(city, unit) {
  const now = new Date();
  const atLocalTime = (hour, minute) => {
    const date = new Date(now);
    date.setHours(hour, minute, 0, 0);
    return Math.floor(date.getTime() / 1000);
  };

  return {
    city,
    country: '',
    temperature: unit === 'imperial' ? 70 : 21,
    feelsLike: unit === 'imperial' ? 72 : 22,
    humidity: 56,
    wind: unit === 'imperial' ? 9 : 14,
    condition: 'Clear',
    description: 'clear sky',
    icon: '01d',
    sunrise: atLocalTime(6, 48),
    sunset: atLocalTime(19, 42),
    timezoneOffset: -now.getTimezoneOffset() * 60,
  };
}

function createFallbackForecast(unit) {
  const temperatures = unit === 'imperial' ? [72, 68, 66, 64, 70] : [22, 20, 19, 18, 21];
  const conditions = ['Clear', 'Clouds', 'Rain', 'Clouds', 'Clear'];
  const icons = ['01d', '02d', '10d', '03d', '01d'];
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  return temperatures.map((temp, index) => ({
    date: Math.floor((today.getTime() + (index + 1) * 86400000) / 1000),
    temp,
    condition: conditions[index],
    icon: icons[index],
  }));
}

function selectDailyForecast(items, timezoneOffset) {
  const today = new Date(Date.now() + timezoneOffset * 1000).toISOString().slice(0, 10);
  const days = new Map();

  for (const item of items) {
    const cityTime = new Date((item.dt + timezoneOffset) * 1000);
    const dateKey = cityTime.toISOString().slice(0, 10);
    if (dateKey <= today) continue;

    const hour = cityTime.getUTCHours();
    const distanceFromNoon = Math.abs(hour - 12);
    const existing = days.get(dateKey);
    if (existing && existing.distanceFromNoon <= distanceFromNoon) continue;

    days.set(dateKey, {
      date: item.dt,
      temp: Math.round(item.main.temp),
      condition: item.weather[0].main,
      icon: item.weather[0].icon,
      distanceFromNoon,
    });
  }

  return [...days.values()]
    .slice(0, 5)
    .map((day) => ({
      date: day.date,
      temp: day.temp,
      condition: day.condition,
      icon: day.icon,
    }));
}

function hasUsableApiKey(apiKey) {
  return typeof apiKey === 'string'
    && apiKey.length > 0
    && !apiKey.includes('your_')
    && !apiKey.includes('replace');
}

export async function getWeather(query, unit, apiKey, signal) {
  const city = query.trim() || DEFAULT_CITY;
  const fallback = () => ({
    weather: createFallbackWeather(city, unit),
    forecast: createFallbackForecast(unit),
  });

  if (!hasUsableApiKey(apiKey)) {
    return {
      ...fallback(),
      status: 'Add EXPO_PUBLIC_OPENWEATHER_API_KEY to mobile/.env.local for live weather. Sample conditions are shown for now.',
    };
  }

  try {
    const search = `q=${encodeURIComponent(city)}&appid=${apiKey}&units=${unit}`;
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?${search}`, { signal }),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?${search}`, { signal }),
    ]);

    if (currentResponse.status === 401 || forecastResponse.status === 401) {
      throw new Error('OpenWeatherMap rejected the API key. Check that it is valid and active.');
    }
    if (currentResponse.status === 404 || forecastResponse.status === 404) {
      throw new Error(`Could not find ${city}.`);
    }
    if (!currentResponse.ok || !forecastResponse.ok) {
      throw new Error('Weather data is temporarily unavailable.');
    }

    const [current, forecastData] = await Promise.all([
      currentResponse.json(),
      forecastResponse.json(),
    ]);
    const timezoneOffset = current.timezone || 0;

    return {
      weather: {
        city: current.name,
        country: current.sys.country,
        temperature: Math.round(current.main.temp),
        feelsLike: Math.round(current.main.feels_like),
        humidity: current.main.humidity,
        wind: Math.round(unit === 'metric' ? current.wind.speed * 3.6 : current.wind.speed),
        condition: current.weather[0].main,
        description: current.weather[0].description,
        icon: current.weather[0].icon,
        sunrise: current.sys.sunrise,
        sunset: current.sys.sunset,
        timezoneOffset,
      },
      forecast: selectDailyForecast(forecastData.list, forecastData.city.timezone || timezoneOffset),
      status: '',
    };
  } catch (error) {
    if (signal?.aborted) throw error;

    const message = error instanceof TypeError
      ? 'Weather could not load. Check your internet connection.'
      : error.message || 'Weather data is temporarily unavailable.';

    return {
      ...fallback(),
      status: `${message} Sample conditions are shown instead.`,
    };
  }
}