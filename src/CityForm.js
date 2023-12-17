import React, { useState, useRef, useEffect } from 'react';
import './CityForm.css';
import config from './config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { faLocationPin } from '@fortawesome/free-solid-svg-icons';

function CityForm() {
    const [cityData, setCityData] = useState(null);
    const [weatherData, setWeatherData] = useState(null);
    const [placesData, setPlacesData] = useState({
        restaurants: [],
        historicalSites: [],
        placesOfInterest: []
    });

    const inputRef = useRef(null);

    useEffect(() => {
        const loadGoogleMapsScript = () => {
            const existingScript = document.getElementById('googleMaps');

            if (existingScript) {
                // If the script is already loaded, just execute the callback
                if (!existingScript.onload || existingScript.readyState === 'loaded' || existingScript.readyState === 'complete') {
                    initAutocomplete();
                }
                return;
            }

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${config.googleApiKey}&libraries=places`;
            script.id = 'googleMaps';
            document.body.appendChild(script);

            script.onload = () => {
                initAutocomplete();
            };
        };

        loadGoogleMapsScript();
        // eslint-disable-next-line
    }, []);

    const onPlaceInputChange = async () => {
        const place = inputRef.current.value;

        if (place) {
            try {
                const proxyurl = "https://cors-anywhere.herokuapp.com/";

                const response = await fetch(
                    `${proxyurl}https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${place}&key=${config.googleApiKey}`
                );

                if (response.ok) {
                    const data = await response.json();
                    // You can perform any actions with the fetched data here
                    console.log('Autocomplete data:', data);
                } else {
                    console.error('Error fetching autocomplete suggestions');
                }
            } catch (error) {
                console.error('Error fetching autocomplete suggestions:', error);
            }
        }
    };

    const handlePlaceSubmit = async (event) => {
        event.preventDefault();
        const place = event.target.place.value;

        if (place) {
            const proxyurl = "https://cors-anywhere.herokuapp.com/";

            try {
                const response = await fetch(
                    `${proxyurl}https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${place}&inputtype=textquery&fields=name,formatted_address,geometry&key=${config.googleApiKey}`
                );

                if (response.ok) {
                    const data = await response.json();
                    if (data.status === 'OK' && data.candidates.length > 0) {
                        const candidate = data.candidates[0];
                        setCityData({
                            name: candidate.name,
                            formattedAddress: candidate.formatted_address,
                            geometry: candidate.geometry,
                        });

                        fetchWeatherData(candidate.name);
                        fetchPlacesData(candidate.name);
                    } else {
                        setCityData(null);
                        setWeatherData(null);
                        setPlacesData({
                            restaurants: [],
                            historicalSites: [],
                            placesOfInterest: []
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching city data:', error);
            }
        } else {
            setCityData(null);
            setWeatherData(null);
            setPlacesData({
                restaurants: [],
                historicalSites: [],
                placesOfInterest: []
            });
        }
    };

    const initAutocomplete = () => {
        // Ensure Google Maps JavaScript API has loaded
        if (!window.google || !window.google.maps || !window.google.maps.places) {
            console.error("Google Maps JavaScript API not available");
            return;
        }

        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
            types: ['(cities)'],
        });

        autocomplete.addListener('place_changed', onPlaceInputChange);
    };

    const fetchWeatherData = async (cityName) => {
        try {
            const proxyurl = "https://cors-anywhere.herokuapp.com/";
            const response = await fetch(
                `${proxyurl}https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${config.openWeatherApiKey}&units=metric`
            );

            if (response.ok) {
                const data = await response.json();
                console.log(data); // Log weather data to verify
                setWeatherData(data);
            } else {
                setWeatherData(null);
            }
        } catch (error) {
            console.error('Error fetching weather data:', error);
            throw error;
        }
    };

    const CurrentWeather = (props) => {
        const { weatherData } = props;

        if (!weatherData) {
            return <div>Loading...</div>;
        }

        const wind = Math.round(weatherData.wind.speed * 3.6);
        const temp = Math.round(weatherData.main.temp);
        const feelsLike = Math.round(weatherData.main.feels_like);
        const description = weatherData.weather[0].description;
        const capitalizedDescription =
            description.charAt(0).toUpperCase() + description.slice(1);
        const visibility = weatherData.visibility / 1000;

        const unixTimestamp = weatherData.dt;
        const date = new Date(unixTimestamp * 1000);
        const month = date.toLocaleString('default', { month: 'short' });
        const dayDate = date.getDate();

        return (
            <div className="weather-details container">
                <p className="weather-date">{month} {dayDate}</p>
                <p className="weather-location">
                    <FontAwesomeIcon icon={faLocationPin} bounce style={{ color: '#eb6e4b', fontSize: '24px'}} data-tooltip={`Latitude: ${cityData.geometry.location.lat}, Longitude: ${cityData.geometry.location.lng}`}/>
                    &nbsp;{weatherData.name}, {weatherData.sys.country}
                </p>
                <div className="icon-temp-container">
                    <img
                        src={`http://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`}
                        alt=""
                    />
                    <p className="weather-temp">{temp}°C</p>
                </div>
                <p className="weather-description">
                    Feels like {feelsLike}°C. {capitalizedDescription}
                </p>
                <div className="weather-wind-press">
                    <p>Wind: {wind} km/h</p>
                    <p>Pressure: {weatherData.main.pressure} hPa</p>
                </div>
                <div className="weather-hum-vis">
                    <p>Humidity: {weatherData.main.humidity}%</p>
                    <p>Visibility: {visibility} km</p>
                </div>
            </div>
        );
    };

    const fetchPlacesData = async (cityName) => {
        try {
            const apiKey = `${config.googleApiKey}`;
            const proxyurl = "https://cors-anywhere.herokuapp.com/";

            const restaurantsResponse = await fetch(
                `${proxyurl}https://maps.googleapis.com/maps/api/place/textsearch/json?query=restaurants+in+${cityName}&key=${apiKey}`
            );

            const historicalSitesResponse = await fetch(
                `${proxyurl}https://maps.googleapis.com/maps/api/place/textsearch/json?query=historical+sites+in+${cityName}&key=${apiKey}`
            );

            const placesOfInterestResponse = await fetch(
                `${proxyurl}https://maps.googleapis.com/maps/api/place/textsearch/json?query=places+of+interest+in+${cityName}&key=${apiKey}`
            );

            const restaurantsData = await restaurantsResponse.json();
            const historicalSitesData = await historicalSitesResponse.json();
            const placesOfInterestData = await placesOfInterestResponse.json();

            setPlacesData({
                restaurants: restaurantsData.results || [],
                historicalSites: historicalSitesData.results || [],
                placesOfInterest: placesOfInterestData.results || []
            });
        } catch (error) {
            console.error('Error fetching places data:', error);
            setPlacesData({
                restaurants: [],
                historicalSites: [],
                placesOfInterest: []
            });
        }
    };

    return (
        <div className="container-fluid" style={{ background: "url('http://i.hizliresim.com/v4Qykv.png') no-repeat center center fixed", WebkitBackgroundSize: 'cover', MozBackgroundSize: 'cover', OBackgroundSize: 'cover', backgroundSize: 'cover', fontFamily: "'Roboto', Tahoma, Arial, sans-serif", lineHeight: 1.5, fontSize: 13 }}>
            <h1 className="text-center">City Finder</h1>
            <form onSubmit={handlePlaceSubmit}>
                <input
                    type="text"
                    className="textbox"
                    placeholder="Search"
                    name="place"
                    ref={inputRef}
                    onChange={onPlaceInputChange}
                />
                <button type="submit" className="button" title="Search">
                    <FontAwesomeIcon icon={faSearch} />
                </button>
            </form>

            <div className="row">
                {cityData && (
                    <div className="col">
                        <div className="card">
                            <div className="card-body">
                                <h2>City Info</h2>
                                <h5 className="card-title">City: {cityData.name}</h5>
                                <p className="card-text">Address: {cityData.formattedAddress}</p>
                                <div style={{ height: '300px', width: '100%' }}>
                                    <iframe
                                        title="Google Map"
                                        src={`https://www.google.com/maps/embed/v1/place?key=${config.googleApiKey}&q=${cityData.geometry.location.lat},${cityData.geometry.location.lng}`}
                                        width="100%"
                                        height="100%"
                                        frameBorder="0"
                                        style={{ border: '0' }}
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {weatherData && (
                    <div className="col">
                        <div className="card">
                            <div className="card-body">
                                <h2>Weather</h2>
                                <CurrentWeather weatherData={weatherData} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {cityData && (
                <div>
                    <h2>Something about {cityData.name}</h2>
                    <div className="row">
                        <div className="col">
                            <div className="card">
                                <div className="card-body">
                                    <h3>Restaurants</h3>
                                    {placesData.restaurants.map((place, index) => (
                                        <div key={index} className="card mb-3">
                                            <div className="card-body">
                                                <h5 className="card-title">{place.name}</h5>
                                                <p className="card-text">Address: {place.formatted_address}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="col">
                            <div className="card">
                                <div className="card-body">
                                    <h3>Historical Sites</h3>
                                    {placesData.historicalSites.map((place, index) => (
                                        <div key={index} className="card mb-3">
                                            <div className="card-body">
                                                <h5 className="card-title">{place.name}</h5>
                                                <p className="card-text">Address: {place.formatted_address}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="col">
                            <div className="card">
                                <div className="card-body">
                                    <h3>Places of Interest</h3>
                                    {placesData.placesOfInterest.map((place, index) => (
                                        <div key={index} className="card mb-3">
                                            <div className="card-body">
                                                <h5 className="card-title">{place.name}</h5>
                                                <p className="card-text">Address: {place.formatted_address}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CityForm;
