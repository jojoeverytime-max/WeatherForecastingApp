import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { DEFAULT_CITY, getWeather } from './src/weather';

const palette = {
  canvas: '#F3F6F1',
  paper: '#FFFFFF',
  ink: '#1D302B',
  muted: '#718079',
  forest: '#153D34',
  green: '#366B57',
  lime: '#D6EF78',
  line: '#DFE6DF',
  sun: '#E7A64B',
  warning: '#FFF1D8',
  warningInk: '#77551E',
};

function formatTemperature(value) {
  return `${Math.round(value)}°`;
}

function formatCityTime(timestamp, timezoneOffset) {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(new Date((timestamp + timezoneOffset) * 1000));
}

function formatForecastDay(timestamp, timezoneOffset) {
  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    timeZone: 'UTC',
  }).format(new Date((timestamp + timezoneOffset) * 1000));
}

function UnitSelector({ unit, onChange }) {
  return (
    <View style={styles.unitRow}>
      <Text style={styles.fieldLabel}>TEMPERATURE</Text>
      <View style={styles.unitControl} accessibilityRole="radiogroup" accessibilityLabel="Temperature units">
        {[
          { value: 'metric', label: '°C' },
          { value: 'imperial', label: '°F' },
        ].map((option) => {
          const selected = unit === option.value;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, selected }}
              accessibilityLabel={`${option.label} temperature`}
              onPress={() => onChange(option.value)}
              style={[styles.unitButton, selected && styles.unitButtonSelected]}
            >
              <Text style={[styles.unitText, selected && styles.unitTextSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function WeatherScreen() {
  const insets = useSafeAreaInsets();
  const [cityInput, setCityInput] = useState(DEFAULT_CITY);
  const [selectedCity, setSelectedCity] = useState(DEFAULT_CITY);
  const [unit, setUnit] = useState('metric');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const apiKey = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY?.trim();

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    async function updateWeather() {
      setLoading(true);

      try {
        const result = await getWeather(selectedCity, unit, apiKey, controller.signal);
        if (!isActive) return;

        setWeather(result.weather);
        setForecast(result.forecast);
        setStatus(result.status);
      } catch (error) {
        if (!isActive || controller.signal.aborted) return;

        setStatus(error.message || 'Weather could not be loaded. Please try again.');
      } finally {
        if (isActive) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    updateWeather();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [apiKey, refreshToken, selectedCity, unit]);

  function searchWeather() {
    const query = cityInput.trim() || DEFAULT_CITY;
    setCityInput(query);
    setSelectedCity(query);
    Keyboard.dismiss();
  }

  function refreshWeather() {
    setRefreshing(true);
    setRefreshToken((token) => token + 1);
  }

  const unitLabel = unit === 'imperial' ? 'F' : 'C';
  const windUnit = unit === 'imperial' ? 'mph' : 'km/h';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
          keyboardShouldPersistTaps="handled"
          refreshControl={(
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshWeather}
              tintColor={palette.green}
              colors={[palette.green]}
            />
          )}
        >
          <View style={styles.topline}>
            <View style={styles.brand}>
              <View style={styles.brandMark}>
                <Ionicons name="partly-sunny" size={19} color={palette.forest} />
              </View>
              <Text style={styles.brandName}>FIELD FORECAST</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Refresh weather"
              onPress={refreshWeather}
              hitSlop={10}
              style={styles.refreshButton}
            >
              <Ionicons name="refresh-outline" size={21} color={palette.ink} />
            </Pressable>
          </View>

          <Text style={styles.headline}>Go out{ '\n' }knowing.</Text>
          <Text style={styles.intro}>A considered forecast for wherever you’re headed.</Text>

          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={20} color={palette.muted} />
            <TextInput
              accessibilityLabel="Search weather by city"
              autoCapitalize="words"
              autoCorrect={false}
              onChangeText={setCityInput}
              onSubmitEditing={searchWeather}
              placeholder="Search a city"
              placeholderTextColor="#929D96"
              returnKeyType="search"
              style={styles.searchInput}
              value={cityInput}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Search weather"
              onPress={searchWeather}
              style={styles.searchButton}
            >
              <Ionicons name="arrow-forward" size={19} color={palette.paper} />
            </Pressable>
          </View>

          <UnitSelector unit={unit} onChange={setUnit} />

          {status ? (
            <View style={styles.statusBanner} accessibilityLiveRegion="polite">
              <Ionicons name="information-circle-outline" size={20} color={palette.warningInk} />
              <Text style={styles.statusText}>{status}</Text>
            </View>
          ) : null}

          <View style={styles.sectionHeading}>
            <Text style={styles.sectionEyebrow}>CURRENT CONDITIONS</Text>
            {loading ? <ActivityIndicator size="small" color={palette.green} /> : null}
          </View>

          {weather ? (
            <View style={styles.currentPanel}>
              <View style={styles.currentTop}>
                <View style={styles.currentCopy}>
                  <Text numberOfLines={1} style={styles.cityName}>
                    {weather.country ? `${weather.city}, ${weather.country}` : weather.city}
                  </Text>
                  <Text style={styles.conditionText}>{weather.description}</Text>
                  <Text style={styles.temperature}>
                    {formatTemperature(weather.temperature)}
                    <Text style={styles.temperatureUnit}>{unitLabel}</Text>
                  </Text>
                </View>
                <Image
                  accessibilityLabel={weather.description}
                  source={{ uri: `https://openweathermap.org/img/wn/${weather.icon}@2x.png` }}
                  style={styles.currentIcon}
                />
              </View>

              <View style={styles.metricDivider} />
              <View style={styles.metricsRow}>
                <Metric
                  icon="thermometer-outline"
                  label="FEELS LIKE"
                  value={`${formatTemperature(weather.feelsLike)}${unitLabel}`}
                />
                <Metric
                  icon="water-outline"
                  label="HUMIDITY"
                  value={`${weather.humidity}%`}
                />
                <Metric
                  icon="navigate-outline"
                  label="WIND"
                  value={`${weather.wind} ${windUnit}`}
                />
              </View>
            </View>
          ) : (
            <View style={styles.loadingPanel}>
              <ActivityIndicator size="small" color={palette.green} />
              <Text style={styles.loadingText}>Finding the latest conditions…</Text>
            </View>
          )}

          <View style={styles.sectionHeading}>
            <Text style={styles.sectionEyebrow}>THE NEXT FIVE DAYS</Text>
            <Text style={styles.sectionAside}>OUTLOOK</Text>
          </View>

          {forecast.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.forecastRow}
            >
              {forecast.map((day, index) => (
                <View
                  key={day.date}
                  style={[styles.forecastDay, index > 0 && styles.forecastDayDivider]}
                >
                  <Text style={styles.forecastName}>
                    {formatForecastDay(day.date, weather?.timezoneOffset || 0)}
                  </Text>
                  <Image
                    accessibilityLabel={day.condition}
                    source={{ uri: `https://openweathermap.org/img/wn/${day.icon}.png` }}
                    style={styles.forecastIcon}
                  />
                  <Text style={styles.forecastTemp}>
                    {formatTemperature(day.temp)}{unitLabel}
                  </Text>
                  <Text numberOfLines={1} style={styles.forecastCondition}>
                    {day.condition}
                  </Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.emptyForecast}>The forecast is not available yet.</Text>
          )}

          {weather ? (
            <>
              <View style={[styles.sectionHeading, styles.sunHeading]}>
                <Text style={styles.sectionEyebrow}>DAYLIGHT</Text>
                <Text style={styles.sectionAside}>{weather.city}</Text>
              </View>
              <View style={styles.sunRow}>
                <SunTime icon="sunny-outline" label="SUNRISE" time={formatCityTime(weather.sunrise, weather.timezoneOffset)} />
                <View style={styles.sunDivider} />
                <SunTime icon="moon-outline" label="SUNSET" time={formatCityTime(weather.sunset, weather.timezoneOffset)} />
              </View>
            </>
          ) : null}

          <Text style={styles.attribution}>WEATHER DATA · OPENWEATHER</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Metric({ icon, label, value }) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={16} color={palette.lime} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function SunTime({ icon, label, time }) {
  return (
    <View style={styles.sunTime}>
      <View style={styles.sunIcon}>
        <Ionicons name={icon} size={19} color={palette.sun} />
      </View>
      <View>
        <Text style={styles.sunLabel}>{label}</Text>
        <Text style={styles.sunValue}>{time}</Text>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <WeatherScreen />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.canvas,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  topline: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: palette.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    color: palette.green,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  refreshButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 8,
  },
  headline: {
    marginTop: 20,
    color: palette.ink,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontSize: 39,
    lineHeight: 43,
  },
  intro: {
    marginTop: 7,
    color: palette.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  searchRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 22,
    paddingLeft: 15,
    paddingRight: 6,
    backgroundColor: palette.paper,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    color: palette.ink,
    fontSize: 15,
  },
  searchButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.forest,
    borderRadius: 6,
  },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 23,
  },
  fieldLabel: {
    color: palette.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  unitControl: {
    flexDirection: 'row',
    padding: 3,
    backgroundColor: '#E7ECE6',
    borderRadius: 8,
  },
  unitButton: {
    minWidth: 43,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  unitButtonSelected: {
    backgroundColor: palette.paper,
  },
  unitText: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  unitTextSelected: {
    color: palette.forest,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginBottom: 20,
    padding: 12,
    backgroundColor: palette.warning,
    borderRadius: 8,
  },
  statusText: {
    flex: 1,
    color: palette.warningInk,
    fontSize: 12,
    lineHeight: 18,
  },
  sectionHeading: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 11,
  },
  sectionEyebrow: {
    color: palette.green,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  sectionAside: {
    color: palette.muted,
    fontSize: 11,
  },
  currentPanel: {
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingTop: 17,
    paddingBottom: 14,
    backgroundColor: palette.forest,
    borderRadius: 8,
  },
  currentTop: {
    minHeight: 143,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentCopy: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 7,
  },
  cityName: {
    color: palette.paper,
    fontSize: 19,
    fontWeight: '700',
  },
  conditionText: {
    marginTop: 4,
    color: '#C5D8CD',
    fontSize: 13,
    textTransform: 'capitalize',
  },
  temperature: {
    marginTop: 4,
    color: palette.paper,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontSize: 58,
    lineHeight: 68,
  },
  temperatureUnit: {
    color: palette.lime,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontSize: 31,
  },
  currentIcon: {
    width: 104,
    height: 104,
    marginLeft: 3,
  },
  metricDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 13,
  },
  metric: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
    gap: 3,
  },
  metricLabel: {
    marginTop: 3,
    color: '#B7CDC1',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  metricValue: {
    maxWidth: '100%',
    color: palette.paper,
    fontSize: 13,
    fontWeight: '700',
  },
  loadingPanel: {
    minHeight: 160,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: palette.paper,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 8,
  },
  loadingText: {
    color: palette.muted,
    fontSize: 13,
  },
  forecastRow: {
    paddingBottom: 4,
  },
  forecastDay: {
    width: 83,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  forecastDayDivider: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: '#CBD5CC',
  },
  forecastName: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  forecastIcon: {
    width: 42,
    height: 42,
    marginVertical: 4,
  },
  forecastTemp: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  forecastCondition: {
    width: '100%',
    marginTop: 3,
    color: palette.muted,
    fontSize: 10,
    textAlign: 'center',
  },
  emptyForecast: {
    paddingVertical: 18,
    color: palette.muted,
    fontSize: 13,
  },
  sunHeading: {
    marginTop: 24,
  },
  sunRow: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.paper,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 8,
  },
  sunTime: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  sunIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBF3E5',
    borderRadius: 8,
  },
  sunLabel: {
    color: palette.muted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  sunValue: {
    marginTop: 3,
    color: palette.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  sunDivider: {
    width: StyleSheet.hairlineWidth,
    height: 38,
    backgroundColor: palette.line,
  },
  attribution: {
    marginTop: 23,
    color: '#929D96',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.1,
    textAlign: 'center',
  },
});