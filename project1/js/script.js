// define our map and file path for geoson data

const myMap = L.map("mapid").locate({ setView: true, maxZoom: 10 });
const countryFilePath = "./js/countryBorders.geo.json"

// Get the map data for leaflet
var Stadia_AlidadeSmoothDark = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=9aa856cb-cf4e-4ac9-9897-2aaf84db272c', {
    maxZoom: 20,
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
}).addTo(myMap);



// ┌──────────────────────────────────────────────────────────────────────────────┐
// │ The various types of global variables                                        │
// └──────────────────────────────────────────────────────────────────────────────┘

var showButtonsBool = true
var currentCountry
var prevCountry
// country boarders are always on the map if available 
var countryBorders = new L.FeatureGroup().addTo(myMap)

// the slider
var slider = document.getElementById("forecast")
var forecastTimeShown = document.getElementById('forecastTime')

// these markers will be on the map depending on a push of an easy button
var infoMarkers = new L.FeatureGroup()
var timeMarkers = new L.FeatureGroup()
var childrenMarkers = new L.FeatureGroup()
var citiesMarkers = new L.FeatureGroup()

var forecastMarkers = []
var forecastTime = []
for (i = 0; i < 40; i++) {
    forecastMarkers.push(new L.FeatureGroup())
}
var forecastMarkersShown = new L.FeatureGroup()

var weatherCurrent

// updateCountry is for the api calls that use info from other api calls. 
// It is used to update all the information of a country inside the easy button functions

const updateCountry = () => currentCountry

// ┌──────────────────────────────────────────────────────────────────────────────┐
// │ Easy Buttons                                                                 │
// └──────────────────────────────────────────────────────────────────────────────┘


const showButtons = () => {
    //information easy button
    infoButton = L.easyButton('<span>&#8505;</span>', function () {
        removeMapMarkers()
        myMap.addLayer(infoMarkers)
    }).addTo(myMap);

    //timezone easy button
    timeButton = L.easyButton(`<span>${timeEasyButtonIcon}</span>`, function () {
        removeMapMarkers()
        myMap.addLayer(timeMarkers)
    }).addTo(myMap);

    citiesButton = L.easyButton(`<span>&#9733;</span>`, function () {
        removeMapMarkers()
        myMap.addLayer(citiesMarkers)
    }).addTo(myMap)

    // Forecast Markers

    forecastButton = L.easyButton(`<span>&#x2602;</span>`, function () {
        var newCountry = updateCountry()

        forecastMarkersShown.addLayer(forecastMarkers[slider.value])
        // add and on change function to show the forecast weather for that time.
        slider.onchange = function () {
            forecastMarkersShown.clearLayers()
            forecastMarkersShown.addLayer(forecastMarkers[slider.value])
            slider.value == 0 ? forecastTimeShown.innerHTML = 'Now': forecastTimeShown.innerHTML = forecastTime[slider.value];
            
            
        }

        // We dont want to keep getting the data if we already have it so we have a childrenGot flag to ensure if we got the data we dont ask again
        if (!newCountry.childrenGot) {
        // We need the geoname for this api so we have to wait for Countries.info() to receive it
            if (newCountry.geoname) {newCountry.children()}
        }
            removeMapMarkers();
            myMap.addLayer(forecastMarkersShown)
            //show the slider
            slider.style.display = 'flex'
            forecastTimeShown.style.display = 'flex'
            // remove all other layers
    }).addTo(myMap);
}

// ┌──────────────────────────────────────────────────────────────────────────────┐
// │ remove Layers                                                                │
// └──────────────────────────────────────────────────────────────────────────────┘

const removeMapMarkers = () => {
    forecastTimeShown.style.display = 'none'
    slider.style.display = 'none'
    myMap.removeLayer(timeMarkers)
    myMap.removeLayer(infoMarkers)
    myMap.removeLayer(citiesMarkers)
    myMap.removeLayer(forecastMarkersShown)
}


// ┌──────────────────────────────────────────────────────────────────────────────┐
// │ Grabs the data for all the countries                                         │
// └──────────────────────────────────────────────────────────────────────────────┘

async function getAllCountries() {

    let options = {
        method: 'GET',
    }
    let response = await fetch(countryFilePath, options);
    let $member = await response.text();
    countryJSON = JSON.parse($member)
    return countryJSON.features;
}



// Grabs the data in the countries data geojson and then calls the Country Class for each

getAllCountries().then((features) => {
    // We want the Countries list to be global.
    countriesLength = features.length
    Countries = []
    for (i = 0; i < countriesLength; i++) {
        let country = new Country(features[i])
        Countries.push(country)
    }
    dl = document.getElementById('countrySelect');

    for (i = 0; i < countriesLength; i++) {
        a3 = Countries[i].a3
        countryName = Countries[i].name

        var option = document.createElement('option');
        option.innerHTML = countryName
        option.value = a3
        option.setAttribute('name', i)
        option.label = countryName

        dl.appendChild(option)
    }
    sortSelectOptions('select')
    return Countries
});

const getCountriesIndex = (a3) => {
    len = Countries.length
    for (i = 0; i < len; i++) {
        if (a3 == Countries[i].a3) {
            return i
        }
    }
}

// ┌──────────────────────────────────────────────────────────────────────────────┐
// │  The main flow of the program, handles changing countries, grabbing data,    │
// │  setting the easy buttons.                                                   │
// └──────────────────────────────────────────────────────────────────────────────┘


window.onload = function () {
    document.getElementById("countrySelect").onchange = function () {

        // I was going to use the prevCountry to remove all the previous country layers from the map
        // the leaflet clearLayers() removes the need of this but im going to keep the functionality in 
        // on the off-chance it becomes needed.

        var index = getCountriesIndex(this.value);




        //remove the current layers from the map
        removeMapMarkers()


        //clear the layers form the feature groups
        countryBorders.clearLayers()
        timeMarkers.clearLayers()
        infoMarkers.clearLayers()
        childrenMarkers.clearLayers()
        citiesMarkers.clearLayers()
        forecastMarkersShown.clearLayers()
        for (i = 0; i<40; i++) {
            forecastMarkers[i].clearLayers()
        }


        //perform the data grabs for the new country
        Countries[index].show()
        Countries[index].info()
        Countries[index].time()
        Countries[index].cities()

        //fly to the country
        Countries[index].flyTo()


        // We show the easy buttons after the user has picked a country for the first time
        if (showButtonsBool) {
            showButtons(Countries[i])
        }
        showButtonsBool = false
        currentCountry = Countries[index]
        return currentCountry
    }
}


// sorts the select into alphabetical order
function sortSelectOptions(selectElement) {
    var options = $(selectElement + " option");

    options.sort(function (a, b) {
        if (a.text.toUpperCase() > b.text.toUpperCase()) return 1;
        else if (a.text.toUpperCase() < b.text.toUpperCase()) return -1;
        else return 0;
    });

    $(selectElement).empty().append(options);
}





// ┌──────────────────────────────────────────────────────────────────────────────┐
// │ The country class                                                            │
// └──────────────────────────────────────────────────────────────────────────────┘

// I want to get more used to OOP so Im going to define my own class, It might be
// a little redundant because the data is already in object form.
// However, it might clean up some syntax nevertheless. 

class Country {
    constructor(countryData) {
        this.data = countryData

        this.name = countryData.properties.name
        this.a2 = countryData.properties.iso_a2
        this.a3 = countryData.properties.iso_a3
        this.n3 = countryData.properties.iso_n3
        this.geometry = countryData.geometry

        this.geoname = false
        this.childrenGot = false
        this.infoShown = false
        this.forecast = []

        this.feature = L.geoJson(countryData, { style: countryOutline })
        this.bounds = this.feature.getBounds()
        this.north = this.bounds._northEast.lat
        this.south = this.bounds._southWest.lat
        this.east = this.bounds._northEast.lng
        this.west = this.bounds._southWest.lng


        this.mid = this.bounds.getCenter()
    }

    show() {
        countryBorders.addLayer(this.feature)
    }

    flyTo() {
        myMap.flyToBounds(this.bounds)
    }

    info() {
        getInformation(this)
    }

    time() {
        getTimezone(this)
    }

    children() {
        getChildren(this)
    }

    cities() {
        getCities(this)
    }
}






// ┌──────────────────────────────────────────────────────────────────────────────┐
// │  API callers                                                                 │
// └──────────────────────────────────────────────────────────────────────────────┘

//population, continent.., etc

const getInformation = (Country) => {
    $.ajax({
        url: "php/information.php",
        type: 'GET',
        dataType: 'json',
        data: {
            countryCode: Country.a2
        },

        success: function (result) {
            JSON.stringify(result)

            if (result.status.name == "ok") {
                var info = result.data[0]


                var latLng = [Country.mid.lat, Country.mid.lng]
                //set the data
                Country.continent = info.continentName
                Country.population = info.population
                Country.capital = info.population
                Country.currency = info.currencyCode
                Country.area = info.areaInSqKm
                Country.continent = info.continentName
                Country.geoname = info.geonameId

                var infoMarker = L.marker(latLng, {
                    icon: infoIcon(
                        info.countryName, 
                        info.continentName, 
                        info.population, 
                        info.capital, 
                        info.currencyCode, 
                        info.areaInSqKm
                    ),
                    zIndexOffset: 1000,
                    draggable: true
                })

                infoMarkers.addLayer(infoMarker)

                return info.geonameId
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log(jqXHR)
            console.log(textStatus)
            console.log(errorThrown)
        }
    });
};


// timezone, sunset, sunrise... etc
const getTimezone = (Country) => {
    var lat = Number.parseFloat(Country.mid.lat).toFixed(2)
    var lng = Number.parseFloat(Country.mid.lng).toFixed(2)
    var latLng = [lat, lng]
    $.ajax({
        url: "php/timezone.php",
        type: 'GET',
        dataType: 'json',
        data: {
            lat: lat,
            lng: lng
        },

        success: function (result) {
            JSON.stringify(result)

            if (result.status.name == "ok") {
                var info = result.data
                //set the data
                Country.sunrise = info.sunrise
                Country.sunset = info.sunset
                Country.currentTime = info.time
                Country.timeId = info.timezoneId
                if (info.gmtOffset > 0) {
                    Country.gmt = `GMT+${info.gmtOffset}`
                } else if (info.gmtOffset < 0) {
                    Country.gmt = `GMT${info.gmtOffset}`
                } else {
                    Country.gmt = `GMT+0`
                }

                var timeMarker = L.marker(latLng, {
                    icon: timeIcon(Country.currentTime, Country.sunrise, Country.sunset, Country.gmt, Country.timeId),
                    zIndexOffset: 1000,
                    draggable: true
                })

                timeMarkers.addLayer(timeMarker)

                return timeMarker
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log(jqXHR)
            console.log(textStatus)
            console.log(errorThrown)
        }
    });
};

// children api call 

const getChildren = (Country) => {

    var geonameId = Country.geoname
    $.ajax({
        url: "php/children.php",
        type: 'GET',
        dataType: 'json',
        data: {
            geonameId: geonameId
        },

        success: function (result) {
            JSON.stringify(result)

            if (result.status.name == "ok") {
                var info = result.data
                var len = info.length
                Country.children = info
                
                Country.childrenGot = true
            }
            return Country
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log(jqXHR)
            console.log(textStatus)
            console.log(errorThrown)
        }

        // were going to use the lat langs of the children of to do a weather fetch for each. 
        // The idea of this is to get nice spread out in only the country we are looking at.
        // There should be very few data points, I could not find a api that would get the weather
        // for just that one country. Only specific cites or lat lngs.
        // Lat lngs seemed easier to manage since the city names may vary between api to api.
    }).then((Country) => {
        var forecast = []
        for (var child in Country.data) {
            var lat = Country.data[child].lat
            var lng = Country.data[child].lng

            $.ajax({
                url: "php/weather.php",
                type: 'GET',
                dataType: 'json',
                data: {
                    lat: lat,
                    lng: lng
                },

                success: function(result) {
                    JSON.stringify(result)
                    var info = result.data
                    var latLng = [info.coord.lat, info.coord.lon]
                    var circle = L.circle(latLng, {
                        color: "red",
                        fillColor: "#f03",
                        fillOpacity: 0.5,
                        radius: 50.0
                    })

                    childrenMarkers.addLayer(circle)


    
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    console.log(jqXHR)
                    console.log(textStatus)
                    console.log(errorThrown)
                }
            })

            $.ajax({
                url: "php/forecast.php",
                type: 'GET',
                dataType: 'json',
                data: {
                    lat: lat,
                    lng: lng
                },
    
                success: function(result) {
                    JSON.stringify(result)

                    var info = result.data
                    console.log(info)
                    for (i = 0; i < 40; i++) {
                        var latLng = [info.city.coord.lat, info.city.coord.lon]
                        var weather = info.list[i].weather[0].main
                        var timezoneAdj = info.city.timezone
                        var time = getHourFromDateTime(info.list[i].dt, timezoneAdj)
                        var sunrise = getHourFromDateTime(info.city.sunrise, timezoneAdj)
                        var sunset = getHourFromDateTime(info.city.sunset, timezoneAdj)

                        var weatherIcon = weatherMarkerCreate(weather, time , sunrise, sunset)
                        var forecastT = info.list[i].dt_txt
                        forecastT = forecastT.substring(0, forecastT.length - 3);
                        forecastMarkers[i].addLayer(L.marker(latLng, {icon: weatherIcon}))

                        forecastTime.push(forecastT)
                    }


    
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    console.log(jqXHR)
                    console.log(textStatus)
                    console.log(errorThrown)
                }
            })
        }
        
    })
};

const getHourFromDateTime = (time, timezoneAdj) => {
    // because the sunset and sunrise were given for THE day the api grab was made
    // we have to do some modular math to get the hour of the each of that day
    // then we can compare with the time of the forecast
    // basically we take the datetime mod (number of seconds in a day = 86400) 
    // then divide by the number of seconds in an hour
    // this gives us the hour of that datetime.
    // we probably dont need to divide by 3600 but it made it more human readable in console.logging.
    time += timezoneAdj
    time = time % 86400
    time = time / 3600
    var timeString = String(time)
    return parseInt(timeString)

}

const getCities = (Country) => {
    $.ajax({
        url: "php/cities.php",
        type: 'GET',
        dataType: 'json',
        data: {
            north: Country.north,
            south: Country.south,
            east: Country.east,
            west: Country.west
        },

        success: function (result) {
            JSON.stringify(result)

            if (result.status.name == "ok") {
                var info = result.data
                Country.cities = info
                var len = info.length
                
                for (i=0;i<len;i++) {
                    console.log(info[i])
                    console.log(info[i].name, Country.a2, info[i].countrycode, info[i].fcodeName )
                    if (info[i].countrycode != Country.a2) {continue;}
                    var latLng = [info[i].lat, info[i].lng]

                    if (info[i].fcodeName == 'capital of a political entity') {
                        citiesMarkers.addLayer(L.marker(latLng, {icon: capitalIcon}))
                    } else {
                        citiesMarkers.addLayer(L.marker(latLng, {icon: cityIcon}))
                    }

                }
            }
            return Country
        },
        error: function (jqXHR, textStatus, errorThrown) {
            alert(`Could not get city data for ${Country.name}`)
            console.log(jqXHR)
            console.log(textStatus)
            console.log(errorThrown)
        }
    })
} 




// ┌──────────────────────────────────────────────────────────────────────────────┐
// │ The Icons and icon generator functions                                       │
// └──────────────────────────────────────────────────────────────────────────────┘

// the information icon
const infoIcon = (countryName, continentName, population, capital, currencyCode, areaInSqKm) => {
    var populationIcon = L.divIcon({
        html: `<table>
            <thead>
                <tr>
                    <th>Country</th>
                    <th>${countryName}</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Continent</td>
                    <td>${continentName}</td>
                </tr>
                <tr>
                    <td>Capital</td>
                    <td>${capital}</td>
                </tr>
                <tr>
                    <td>Population</td>
                    <td>${population}</td>
                </tr>
                <tr>
                    <td>Currency</td>
                    <td>${currencyCode}</td>
                </tr>
                <tr>
                    <td>Area</td>
                    <td>${areaInSqKm}</td>
                </tr>
            </tbody>
        </table>`,
        className: "table table-dark table-hover",
        iconSize: [50, 40],
        iconAnchor: [25, 10]
    })
    return populationIcon
}


// timezones
const timeIcon = (time, sunrise, sunset, timezone, timezoneName) => {
    var timeIcon = L.divIcon({
        html: `<table ">
            <thead>
                <tr>
                    <th>Time</th>
                    <th>${time}</th>
                </tr>
            </thead>
                <tbody>
                    <tr>
                        <td>Sunrise</td>
                        <td>${sunrise}</td>
                    </tr>
                    <tr>
                        <td>Sunset</td>
                        <td>${sunset}</td>
                    </tr>
                    <tr>
                        <td>Timezone</td>
                        <td>${timezone}</td>
                    </tr>
                    <tr>
                        <td>Timezone Name</td>
                        <td>${timezoneName}</td>
                    </tr>
                </tbody>
            </table>`,
        className: "table table-dark table-hover",
        iconSize: [50, 40],
        iconAnchor: [25, 10]
    })
    return timeIcon
}

const timeEasyButtonIcon = '<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><style>.cls-1{fill:#141f38;}</style></defs><title>watch-outline</title><path class="cls-1" d="M271.46,272.55a38.42,38.42,0,0,0-21.86-52.76V166.4a12.8,12.8,0,1,0-25.6,0v53.39a38.4,38.4,0,1,0,29.35,70.86l51.2,51.19a12.8,12.8,0,0,0,18.1-18.1ZM236.8,268.8A12.8,12.8,0,1,1,249.6,256,12.81,12.81,0,0,1,236.8,268.8Z"/><path class="cls-1" d="M435.2,204.8H421.89A192.37,192.37,0,0,0,339.2,93.57V44.8A44.8,44.8,0,0,0,294.4,0H179.2a44.8,44.8,0,0,0-44.8,44.8V93.57a192,192,0,0,0,0,324.86V467.2A44.8,44.8,0,0,0,179.2,512H294.4a44.8,44.8,0,0,0,44.8-44.8V418.43A192.37,192.37,0,0,0,421.89,307.2H435.2a32,32,0,0,0,32-32V236.8A32,32,0,0,0,435.2,204.8ZM160,44.8a19.22,19.22,0,0,1,19.2-19.2H294.4a19.22,19.22,0,0,1,19.2,19.2V80A192.41,192.41,0,0,0,160,80ZM313.6,467.2a19.22,19.22,0,0,1-19.2,19.2H179.2A19.22,19.22,0,0,1,160,467.2V432a192.41,192.41,0,0,0,153.6,0Zm40.86-93.54A166.4,166.4,0,1,1,403.2,256,165.31,165.31,0,0,1,354.46,373.66ZM441.6,275.2a6.41,6.41,0,0,1-6.4,6.4h-8.1a193.26,193.26,0,0,0,0-51.2h8.1a6.41,6.41,0,0,1,6.4,6.4Z"/></svg>'

// We decide what icon to use using the weather forecast grab
const weatherMarkerCreate = (weather, time, sunrise, sunset) => {

    if (weather == 'Rain') return rainIcon
    if (weather == 'Clouds') return cloudsIcon
    if (weather == 'Snow') return snowIcon
    if (time>sunrise && time<sunset) return sunIcon
    return nightIcon
}


const cloudsIcon = L.divIcon({
    html: `<?xml version="1.0" ?><svg id="icone" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><title/><path d="M369.14,256.14a105.1,105.1,0,0,0-7.34-23.33,64.4,64.4,0,0,0-12.66,3.33,105.64,105.64,0,0,0-19.9-44.46A106,106,0,0,0,159,276c0,2.72.11,5.41.31,8.08a50,50,0,0,0-58.23,71.83A49.78,49.78,0,0,0,125,362H372a65,65,0,0,0,54.85-99.85,65,65,0,0,0-57.71-6Z" fill="#b6c4cf"/><path d="M146.5,216.81c-.07.19-.15.37-.22.56s-.15.36-.22.55" fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20"/><path d="M436.87,300.41c1.86-33.07-22.91-63.16-55.72-67.76a65.39,65.39,0,0,0-32,3.5c-6.45-34.08-30-62.91-61.32-77.47C244,137,187,154,158.85,194.24" fill="none" stroke="#02005c" stroke-linecap="round" stroke-miterlimit="10" stroke-width="20"/><path d="M416.65,344.24a64.67,64.67,0,0,0,13.64-18.62" fill="none" stroke="#02005c" stroke-linecap="round" stroke-miterlimit="10" stroke-width="20"/><path d="M139.83,242.7a107.71,107.71,0,0,0-.53,21.39A50.48,50.48,0,0,0,80,290.22,48.32,48.32,0,0,0,80,334c3,5,6,11,11,15a83.42,83.42,0,0,0,12,8,120.9,120.9,0,0,0,18,5q129,1.5,258,0c5,0,11-3,15.92-4.16" fill="none" stroke="#02005c" stroke-linecap="round" stroke-miterlimit="10" stroke-width="20"/></svg>`,
    className: "",
    iconSize: [50, 40],
    iconAnchor: [25, 10]
});

const rainIcon = L.divIcon({
    html: `<?xml version="1.0" ?><svg id="icone" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><title/><path d="M366.5,188.92v.1a57.73,57.73,0,0,0-49.58,87.3,57.73,57.73,0,0,0,87.3-49.57h.1V188.92Z" fill="#60c3e5"/><path d="M201.33,298.16v.12A74,74,0,0,0,140,413.58a74,74,0,0,0,115.3-61.34h.12V298.16Z" fill="#60c3e5"/><path d="M237.32,107.4a40.76,40.76,0,0,0-37,57.79,40.76,40.76,0,0,0,57.79-37h.07V107.33H237.32Z" fill="#60c3e5"/><path d="M112.78,324.47c-.09.21-.16.43-.25.65" fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20"/><path d="M107.43,349.53c0,.9-.06,1.8-.06,2.71a74,74,0,1,0,147.92,0h.12V278.15H181.33A73.9,73.9,0,0,0,126,303.21" fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20"/><path d="M179.61,112.68c-.09.21-.16.43-.25.64" fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20"/><path d="M177.76,138a40.76,40.76,0,0,0,80.32-9.84h.07V87.33H217.32v.07a40.56,40.56,0,0,0-21.83,6.35" fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20"/><path d="M293.32,204.23c-.1.25-.19.51-.3.77" fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20"/><path d="M288.84,229.52a57.72,57.72,0,0,0,115.38-2.77h.1V168.92H346.49v.1a57.5,57.5,0,0,0-38.7,14.9" fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20"/></svg>`,
    className: "",
    iconSize: [35, 40],
    iconAnchor: [20, -10],
});

const snowIcon = L.divIcon({
    html: `<?xml version="1.0" ?><svg id="icone" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><title/><line fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" x1="216.41" x2="280.41" y1="324" y2="324"/><line fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" x1="232.41" x2="264.41" y1="351.71" y2="296.28"/><line fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" x1="264.41" x2="232.41" y1="351.71" y2="296.28"/><line fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" x1="303.31" x2="375.31" y1="385.07" y2="385.07"/><line fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" x1="321.31" x2="357.31" y1="416.25" y2="353.89"/><line fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" x1="357.31" x2="321.31" y1="416.25" y2="353.89"/><line fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" x1="156.3" x2="256.3" y1="425.96" y2="425.96"/><line fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" x1="181.3" x2="231.3" y1="469.26" y2="382.66"/><line fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" x1="231.3" x2="181.3" y1="469.26" y2="382.66"/><path d="M380.14,190.14a105.1,105.1,0,0,0-7.34-23.33,64.4,64.4,0,0,0-12.66,3.33,105.64,105.64,0,0,0-19.9-44.46A106,106,0,0,0,170,210c0,2.72.11,5.41.31,8.08a50,50,0,0,0-58.23,71.83A49.78,49.78,0,0,0,136,296H383a65,65,0,0,0,54.85-99.85,65,65,0,0,0-57.71-6Z" fill="#b6c4cf"/><path d="M157.5,150.81c-.07.19-.15.37-.22.56s-.15.36-.22.55" fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20"/><path d="M447.87,234.41c1.86-33.07-22.91-63.16-55.72-67.76a65.39,65.39,0,0,0-32,3.5c-6.45-34.08-30-62.91-61.32-77.47C255,71,198,88,169.85,128.24" fill="none" stroke="#02005c" stroke-linecap="round" stroke-miterlimit="10" stroke-width="20"/><path d="M427.65,278.24a64.67,64.67,0,0,0,13.64-18.62" fill="none" stroke="#02005c" stroke-linecap="round" stroke-miterlimit="10" stroke-width="20"/><path d="M150.83,176.7a107.71,107.71,0,0,0-.53,21.39A50.48,50.48,0,0,0,91,224.22,48.32,48.32,0,0,0,91,268c3,5,6,11,11,15a83.42,83.42,0,0,0,12,8,120.9,120.9,0,0,0,18,5q129,1.5,258,0c5,0,11-3,15.92-4.16" fill="none" stroke="#02005c" stroke-linecap="round" stroke-miterlimit="10" stroke-width="20"/></svg>`,
    className: "",
    iconSize: [50, 40],
    iconAnchor: [25, 20],
});

const sunIcon = L.divIcon({
    html: `<?xml version="1.0" ?><svg id="icone" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><title/><path d="M276,170a106,106,0,0,0-84.28,170.28A106,106,0,0,0,340.28,191.72,105.53,105.53,0,0,0,276,170Z" fill="#f7ad1e"/><path d="M150.9,242.12A107.63,107.63,0,0,0,150,256a106,106,0,1,0,19.59-61.37" fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20"/><path d="M157.56,216.68c-.17.41-.34.81-.5,1.22" fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20"/><line fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" x1="256" x2="256" y1="64" y2="123"/><line fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" x1="256" x2="256" y1="389" y2="447.99"/><line fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" x1="120.24" x2="161.96" y1="120.24" y2="161.95"/><line fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" x1="350.04" x2="391.76" y1="350.04" y2="391.76"/><line fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" x1="64" x2="123" y1="256" y2="256"/><line fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" x1="389" x2="448" y1="256" y2="256"/><line fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" x1="120.24" x2="161.96" y1="391.76" y2="350.04"/><line fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" x1="350.04" x2="391.76" y1="161.95" y2="120.24"/></svg>`,
    className: "",
    iconSize: [50, 40],
    iconAnchor: [25, 20],
});

const nightIcon = L.divIcon({
    html: `<?xml version="1.0" ?><svg id="icone" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><title/><path d="M276.6,127.6A148.4,148.4,0,0,0,162.14,370.46,148.49,148.49,0,0,0,326.47,387a150.66,150.66,0,0,1-15.94-16.51,148.38,148.38,0,0,1,9.79-236.29A148.18,148.18,0,0,0,276.6,127.6Z" fill="#fff133"/><path d="M116.5,207c-.37,1.05-.73,2.11-1.07,3.17" fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20"/><path d="M109.77,234.43a148.43,148.43,0,0,0,221,150.11,148.44,148.44,0,0,1,0-257.08,148.46,148.46,0,0,0-204,56.62" fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20"/></svg>`,
    className: "",
    iconSize: [50, 40],
    iconAnchor: [25, 20],
});

const cityIcon = L.divIcon({
    html: `<?xml version="1.0" ?><svg height="30px" version="1.1" viewBox="0 0 60 60" width="30px" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><title/><desc/><defs><linearGradient id="linearGradient-1" x1="14.4540707%" x2="85.5460383%" y1="23.2326121%" y2="95.0131254%"><stop offset="0%" stop-color="#D4E1F4"/><stop offset="17.173%" stop-color="#D4E1F4"/><stop offset="20%" stop-color="#D4E1F4"/><stop offset="20.014%" stop-color="#DAE4F4"/><stop offset="20.069%" stop-color="#EBEBF4"/><stop offset="20.136%" stop-color="#F6F1F4"/><stop offset="20.231%" stop-color="#FDF4F4"/><stop offset="20.495%" stop-color="#FFF5F4"/><stop offset="25.222%" stop-color="#FFF5F4"/><stop offset="26%" stop-color="#FFF5F4"/><stop offset="26%" stop-color="#D4E1F4"/><stop offset="39.739%" stop-color="#D4E1F4"/><stop offset="42%" stop-color="#D4E1F4"/><stop offset="42.014%" stop-color="#DAE4F4"/><stop offset="42.069%" stop-color="#EBEBF4"/><stop offset="42.136%" stop-color="#F6F1F4"/><stop offset="42.231%" stop-color="#FDF4F4"/><stop offset="42.495%" stop-color="#FFF5F4"/><stop offset="48.939%" stop-color="#FFF5F4"/><stop offset="50%" stop-color="#FFF5F4"/><stop offset="50.003%" stop-color="#F9F2F4"/><stop offset="50.014%" stop-color="#E8EBF4"/><stop offset="50.028%" stop-color="#DDE5F4"/><stop offset="50.047%" stop-color="#D6E2F4"/><stop offset="50.1%" stop-color="#D4E1F4"/><stop offset="70.622%" stop-color="#D4E1F4"/><stop offset="74%" stop-color="#D4E1F4"/><stop offset="74.1%" stop-color="#FFF5F4"/><stop offset="83.459%" stop-color="#FFF5F4"/><stop offset="85%" stop-color="#FFF5F4"/><stop offset="85.1%" stop-color="#D4E1F4"/></linearGradient></defs><g fill="none" fill-rule="evenodd" id="Page-1" stroke="none" stroke-width="1"><g id="020---Star" transform="translate(0.000000, 1.000000)"><g id="Colour"><path d="M31.7569,1.14435 L39.2006,16.94809 C39.4742047,17.5450605 40.0274966,17.9662669 40.67576,18.07109 L57.32037,20.60534 C58.0728338,20.7512497 58.6840769,21.2991656 58.9110909,22.0312558 C59.1381048,22.7633461 58.9440977,23.560962 58.4062,24.107 L46.36205,36.40845 C45.8969861,36.8906851 45.6879532,37.5647752 45.79858,38.22553 L48.64182,55.59553 C48.7969313,56.3422303 48.5093863,57.1116407 47.9025754,57.5735945 C47.2957646,58.0355484 46.4775729,58.1079148 45.7991,57.75964 L30.9117,49.55864 C30.3445605,49.2442297 29.6554395,49.2442297 29.0883,49.55864 L14.2009,57.75964 C13.5224271,58.1079148 12.7042354,58.0355484 12.0974246,57.5735945 C11.4906137,57.1116407 11.2030687,56.3422303 11.35818,55.59553 L14.20142,38.22553 C14.3120468,37.5647752 14.1030139,36.8906851 13.63795,36.40845 L1.5938,24.107 C1.05593046,23.5609597 0.861941478,22.7633618 1.08895299,22.0312898 C1.31596449,21.2992177 1.92718692,20.7513115 2.67963,20.60539 L19.32424,18.0711 C19.9725034,17.9662769 20.5257953,17.5450705 20.7994,16.9481 L28.2431,1.14435 C28.5505421,0.448721422 29.2394609,-5.16717968e-06 30,-5.16717968e-06 C30.7605391,-5.16717968e-06 31.4494579,0.448721422 31.7569,1.14435 Z" fill="#E3E7F2" id="Shape"/><path d="M45.3579,36.41 C44.8933016,36.8936052 44.6855527,37.5688737 44.79797,38.23 L47.63797,55.6 C47.7929131,56.345884 47.5054921,57.1144319 46.8991346,57.5756052 C46.292777,58.0367786 45.4753841,58.1085116 44.79797,57.76 L43.04797,56.8 C43.855341,56.3859367 44.2976539,55.4931951 44.13797,54.6 L41.29797,37.23 C41.1855527,36.5688737 41.3933016,35.8936052 41.8579,35.41 L53.90783,23.11 C54.6669146,22.3180842 54.6972933,21.0781385 53.9779,20.25 L56.31799,20.61 C57.0709382,20.7544339 57.6832718,21.3015689 57.911207,22.0335783 C58.1391422,22.7655877 57.9456753,23.5636351 57.40783,24.11 L45.3579,36.41 Z" fill="#A4C2F7" id="Shape"/><path d="M18.07764,36.97382 C18.1922583,36.3033523 17.9792812,35.6185065 17.50464,35.13129 L5.17383,22.67926 C4.42623813,21.9154782 4.36049454,20.7159067 5.02014,19.875 L4.11865,20.01178 C4.14893,19.96643 4.17383,19.91785 4.20765,19.875 L2.40665,20.14832 C1.63954262,20.2869337 1.01253366,20.8394374 0.778496375,21.5830058 C0.544459095,22.3265743 0.741984339,23.1385991 1.29141,23.69159 L13.62219,36.14368 C14.0968397,36.6308637 14.3097811,37.3157161 14.19507,37.98615 L11.28907,55.57086 C11.1614126,56.2365124 11.3743249,56.9219687 11.8566521,57.3981513 C12.3389794,57.874334 13.027109,58.0784409 13.69107,57.94226 C14.1378027,58.0419031 14.6055091,57.9763121 15.0076,57.75763 L16.58365,56.89709 C15.5871965,56.5894957 14.9797564,55.5836148 15.17142,54.55853 L18.07764,36.97382 Z" fill="#FFFFFF" id="Shape"/><path d="M18.14844,38.87158 C18.4633166,36.9540814 17.8494148,35.0009438 16.49414,33.6084 L7.07031,23.98291 L19.92676,22.02591 C21.8914891,21.7210725 23.5752482,20.4575107 24.417,18.65625 L30,6.80225 L35.581,18.65283 C36.4226712,20.4555677 38.1072282,21.720432 40.07319,22.02583 L52.92964,23.98283 L43.50386,33.61027 C42.1493392,35.0034307 41.5362139,36.9566633 41.85156,38.874 L44.03613,52.22166 L32.8418,46.05518 C31.0734665,45.0789497 28.9278569,45.0785721 27.15918,46.05418 L15.96387,52.22168 L18.14844,38.87158 Z" fill="url(#linearGradient-1)" id="Shape"/></g><g id="Outline"><path d="M13.87,40.24 L14.2,38.23 C14.3123679,37.5688643 14.1045968,36.8936081 13.64,36.41 L1.59,24.11 C1.05218664,23.5635995 0.858761033,22.7655408 1.0867276,22.033538 C1.31469417,21.3015353 1.9270458,20.7544186 2.68,20.61 L19.32,18.07 C19.9673992,17.9625381 20.5206736,17.5438439 20.8,16.95 L28.24,1.14 C28.5507832,0.446397569 29.2399536,5.07226368e-06 30,5.07226368e-06 C30.7600464,5.07226368e-06 31.4492168,0.446397569 31.76,1.14 L39.2,16.95 C39.4793264,17.5438439 40.0326008,17.9625381 40.68,18.07 L57.32,20.61 C58.0729542,20.7544186 58.6853058,21.3015353 58.9132724,22.033538 C59.141239,22.7655408 58.9478134,23.5635995 58.41,24.11 L46.36,36.41 C45.8954032,36.8936081 45.6876321,37.5688643 45.8,38.23 L48.64,55.6 C48.7949604,56.345888 48.507544,57.1144485 47.9011805,57.5756263 C47.2948171,58.0368041 46.4774134,58.1085294 45.8,57.76 L30.91,49.56 C30.345531,49.2400003 29.654469,49.2400003 29.09,49.56 L14.2,57.76 C13.5225866,58.1085294 12.7051829,58.0368041 12.0988195,57.5756263 C11.492456,57.1144485 11.2050396,56.345888 11.36,55.6 L12.58,48.14" id="Shape" stroke="#428DFF" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/><path d="M18.14844,38.87158 C18.4633166,36.9540814 17.8494148,35.0009438 16.49414,33.6084 L7.07031,23.98291 L19.92676,22.02591 C21.8914891,21.7210725 23.5752482,20.4575107 24.417,18.65625 L30,6.80225 L35.581,18.65283 C36.4226712,20.4555677 38.1072282,21.720432 40.07319,22.02583 L52.92964,23.98283 L43.50386,33.61027 C42.1493392,35.0034307 41.5362139,36.9566633 41.85156,38.874 L44.03613,52.22166 L32.8418,46.05518 C31.0734665,45.0789497 28.9278569,45.0785721 27.15918,46.05418 L15.96387,52.22168 L18.14844,38.87158 Z" id="Shape" stroke="#428DFF" stroke-linecap="round" stroke-linejoin="round"/><circle cx="13.16667" cy="44.17941" fill="#428DFF" fill-rule="nonzero" id="Oval" r="1"/></g></g></g></svg>`,
    className: "",
    iconSize: [50, 40],
    iconAnchor: [25, 20],
});

const capitalIcon = L.divIcon({
    html: `<?xml version="1.0" ?><svg height="40px" version="1.1" viewBox="0 0 60 60" width="40px" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><title/><desc/><defs/><g fill="none" fill-rule="evenodd" id="Page-1" stroke="none" stroke-width="1"><g id="019---Star" transform="translate(0.000000, 1.000000)"><g id="Colour"><path d="M32.22661,1.14435 L39.542,16.94809 C39.8065174,17.5417153 40.3508295,17.9633542 40.99173,18.07109 L57.34936,20.60534 C58.0940129,20.763184 58.6940639,21.313222 58.9159539,22.0413618 C59.1378439,22.7695016 58.9465156,23.560701 58.41644,24.107 L46.57994,36.40845 C46.1217402,36.8944427 45.916903,37.5665973 46.02619,38.22553 L48.82041,55.59553 C48.9836915,56.3335951 48.7066699,57.0996366 48.1090816,57.5625504 C47.5114932,58.0254642 46.7005252,58.1022193 46.0267,57.75964 L31.396,49.55863 C30.8400413,49.2442133 30.1599587,49.2442133 29.604,49.55863 L14.97329,57.75963 C14.2994648,58.1022093 13.4884968,58.0254542 12.8909084,57.5625404 C12.2933201,57.0996266 12.0162985,56.3335851 12.17958,55.59552 L14.9738,38.22552 C15.083087,37.5665873 14.8782498,36.8944327 14.42005,36.40844 L2.58356,24.107 C2.0535115,23.5606949 1.86220426,22.7695083 2.08409867,22.0413849 C2.30599308,21.3132616 2.9060324,20.7632366 3.65067,20.60539 L20.0083,18.0711 C20.6492005,17.9633642 21.1935126,17.5417253 21.45803,16.9481 L28.77339,1.14435 C29.0668139,0.450707781 29.7468486,-1.07928721e-06 30.5,-1.07928721e-06 C31.2531514,-1.07928721e-06 31.9331861,0.450707781 32.22661,1.14435 Z" fill="#FFE100" id="Shape"/><path d="M37.39,13.11 C32.5890747,15.6770414 28.15587,18.8791741 24.21,22.63 C20.0044812,26.6560517 16.436883,31.2993247 13.63,36.4 L1.59009,24.11 C1.05224467,23.5636351 0.858777828,22.7655877 1.086713,22.0335783 C1.31464817,21.3015689 1.92698179,20.7544339 2.67993,20.61 L19.32007,18.07 C19.967444,17.9624793 20.520694,17.5438036 20.80007,16.95 L28.24,1.14 C28.5507895,0.446404951 29.2399578,1.95277886e-05 30,1.95277886e-05 C30.7600422,1.95277886e-05 31.4492105,0.446404951 31.76,1.14 L37.39,13.11 Z" fill="#FFB600" id="Shape"/><path d="M46.36,36.41 C45.8953952,36.8936017 45.687642,37.5688718 45.80006,38.23 L48.64,55.6 C48.7949431,56.345884 48.5075221,57.1144319 47.9011646,57.5756052 C47.294807,58.0367786 46.4774141,58.1085116 45.8,57.76 L44.05,56.8 C44.857371,56.3859367 45.2996839,55.4931951 45.14,54.6 L42.3,37.23 C42.1875977,36.5688621 42.3953735,35.8935906 42.86,35.41 L54.90992,23.11 C55.6690076,22.3180868 55.6993906,21.0781411 54.98,20.25 L57.32009,20.61 C58.0730382,20.7544339 58.6853718,21.3015689 58.913307,22.0335783 C59.1412422,22.7655877 58.9477753,23.5636351 58.40993,24.11 L46.36,36.41 Z" fill="#FFB600" id="Shape"/><path d="M14.36,54.6 C14.1698076,55.6081579 14.7621263,56.5996478 15.74,56.91 L14.2,57.76 C13.5225859,58.1085116 12.705193,58.0367786 12.0988354,57.5756052 C11.4924779,57.1144319 11.2050569,56.345884 11.36,55.6 L14.2,38.23 C14.3124023,37.5688621 14.1046265,36.8935906 13.64,36.41 L1.59009,24.11 C1.05224467,23.5636351 0.858777828,22.7655877 1.086713,22.0335783 C1.31464817,21.3015689 1.92698179,20.7544339 2.67993,20.61 L4.43993,20.34 C3.79546051,21.1725986 3.85938779,22.3519431 4.59008,23.11 L16.64,35.41 C17.1046265,35.8935906 17.3124023,36.5688621 17.2,37.23 L14.36,54.6 Z" fill="#FFFFFF" id="Shape"/><path d="M31.62,0.89 L24.3,16.45 C24.020624,17.0438036 23.467374,17.4624793 22.82,17.57 L19.33,18.1 L19.32,18.07 C19.967374,17.9624793 20.520624,17.5438036 20.8,16.95 L28.24,1.14 C28.5297679,0.494594174 29.1499551,0.0599189464 29.8554981,0.00773381748 C30.561041,-0.0444513114 31.2384306,0.294249305 31.62,0.89 Z" fill="#FFFFFF" id="Shape"/></g><g id="Outline"><circle cx="13.21299" cy="44.17941" fill="#000000" fill-rule="nonzero" id="Oval" r="1"/><path d="M13.87,40.23 L14.2,38.23 C14.3123679,37.5688643 14.1045968,36.8936081 13.64,36.41 L1.59,24.11 C1.05218664,23.5635995 0.858761033,22.7655408 1.0867276,22.033538 C1.31469417,21.3015353 1.9270458,20.7544186 2.68,20.61 L19.32,18.07 C19.9673992,17.9625381 20.5206736,17.5438439 20.8,16.95 L28.24,1.14 C28.5507832,0.446397569 29.2399536,5.07226368e-06 30,5.07226368e-06 C30.7600464,5.07226368e-06 31.4492168,0.446397569 31.76,1.14 L39.2,16.95 C39.4793264,17.5438439 40.0326008,17.9625381 40.68,18.07 L57.32,20.61 C58.0729542,20.7544186 58.6853058,21.3015353 58.9132724,22.033538 C59.141239,22.7655408 58.9478134,23.5635995 58.41,24.11 L46.36,36.41 C45.8954032,36.8936081 45.6876321,37.5688643 45.8,38.23 L48.64,55.6 C48.7949604,56.345888 48.507544,57.1144485 47.9011805,57.5756263 C47.2948171,58.0368041 46.4774134,58.1085294 45.8,57.76 L30.91,49.56 C30.345531,49.2400003 29.654469,49.2400003 29.09,49.56 L14.2,57.76 C13.5225866,58.1085294 12.7051829,58.0368041 12.0988195,57.5756263 C11.492456,57.1144485 11.2050396,56.345888 11.36,55.6 L12.58,48.13" id="Shape" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/><path d="M13.63,36.4 C16.4368578,31.2993082 20.0044588,26.6560316 24.21,22.63 C28.1558735,18.8791782 32.5890776,15.677046 37.39,13.11" id="Shape" stroke="#000000" stroke-linecap="round" stroke-linejoin="round"/></g></g></g></svg>`,
    className: "",
    iconSize: [50, 40],
    iconAnchor: [25, 20],
});

// random colouring for the country outlines to keep the project visually interesting
function countryOutline(feature) {
    var colours = ['#9CE37D', '#7FC8F8', '#F9C22E', '#FE5F55', '#ECBA82', '#EACBD2', '#06D6A0', '#9DACFF']
    var colour = colours[Math.floor(Math.random() * colours.length)]
    return {
        fillColor: colour,
        weight: 2,
        opacity: 1,
        color: '#747474',  //Outline color
        fillOpacity: 0.2
    };
}


