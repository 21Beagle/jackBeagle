// define our map and file path for geoson data

const myMap = L.map("mapid").locate({ setView: true, maxZoom: 10 });
const countryFilePath = "./js/countryBorders.geo.json"

// Get the map data for leaflet
var Stadia_AlidadeSmoothDark = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=9aa856cb-cf4e-4ac9-9897-2aaf84db272c', {
    maxZoom: 20,
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
}).addTo(myMap);



// ┌─────────────────────────────── ───────────────────────────────────────────────┐
// │ The various types of global variables                                        │
// └──────────────────────────────────────────────────────────────────────────────┘

var showButtonsBool = true
var currentCountry
var prevCountry
// country boarders are always on the map if available 
var countryBorders = new L.FeatureGroup().addTo(myMap)

// the slider and buttons
var slider = document.getElementById("forecast")
var forecastTimeShown = document.getElementById('forecastTime')

var informationTable = document.getElementById("informationTable")
var cityTable = document.getElementById('cityTable')
var timeTable = document.getElementById("timeTable")
var moneyTable = document.getElementById('moneyTable')
var satelliteTable = document.getElementById('satelliteTable')

var countryFlag = document.getElementById('countryFlag')

var clearButton = document.getElementById('clearButton')



// these markers will be on the map depending on a push of an easy button
var infoMarkers = new L.FeatureGroup()
var timeMarkers = new L.FeatureGroup()
var childrenMarkers = new L.FeatureGroup()
var citiesMarkers = new L.FeatureGroup()
var earthquakesMarkers = new L.FeatureGroup()
var satelliteMarkers = new L.FeatureGroup()

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
const updateTable = () => informationTable

// ┌──────────────────────────────────────────────────────────────────────────────┐
// │ Easy Buttons                                                                 │
// └──────────────────────────────────────────────────────────────────────────────┘


const showButtons = () => {
    //information easy button
    infoButton = L.easyButton('<span>&#8505;</span>', function () {
        removeMapMarkers()
        removeTable()
        informationTable.style.display = 'table'
        clearButton.style.display = 'inline-block'
        myMap.addLayer(infoMarkers)
    }).addTo(myMap);

    //timezone easy button
    timeButton = L.easyButton(`<span>${timeEasyButtonIcon}</span>`, function () {
            removeMapMarkers()
            removeTable()
            timeTable.style.display = 'table'
            clearButton.style.display = 'inline-block'
            
            myMap.addLayer(infoMarkers)
    }).addTo(myMap);

    citiesButton = L.easyButton(`<span>&#9733;</span>`, function () {
        removeMapMarkers()
        removeTable()
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
            removeTable()
            myMap.addLayer(forecastMarkersShown)
            //show the slider
            slider.style.display = 'flex'
            forecastTimeShown.style.display = 'flex'
            // remove all other layers
    }).addTo(myMap);

    earthquakesButton = L.easyButton(`<span>${earthquakeEasyButtonIcon}<span>`, function () {
        removeMapMarkers()
        removeTable()
        myMap.addLayer(earthquakesMarkers)
    }).addTo(myMap)

    moneyButton = L.easyButton(`<span>$</span>`, function () {
        removeMapMarkers()
        removeTable()
        moneyTable.style.display = 'table'
        clearButton.style.display = 'inline-block'
    }).addTo(myMap)

    satelliteButton = L.easyButton(`<span>${satelliteEasyButton}</span>`, function(){
        removeMapMarkers()
        removeTable()
        myMap.addLayer(satelliteMarkers)
    }).addTo(myMap)
}

// ┌──────────────────────────────────────────────────────────────────────────────┐
// │ remove Layers                                                                │
// └──────────────────────────────────────────────────────────────────────────────┘

const removeMapMarkers = () => {
    forecastTimeShown.style.display = 'none'
    informationTable.style.display = 'none'
    slider.style.display = 'none'
    timeTable.style.display = 'none'
    clearButton.style.display = 'none'
    myMap.removeLayer(timeMarkers)
    myMap.removeLayer(infoMarkers)
    myMap.removeLayer(citiesMarkers)
    myMap.removeLayer(forecastMarkersShown)
    myMap.removeLayer(earthquakesMarkers)
    myMap.removeLayer(satelliteMarkers)
}

const removeTable = () => {
    timeTable.style.display = 'none'
    clearButton.style.display = 'none'
    informationTable.style.display = 'none'
    cityTable.style.display = 'none'
    earthquakeTable.style.display = 'none'
    moneyTable.style.display = 'none'
    satelliteTable.style.display = 'none'
}

document.getElementById('clearButton').addEventListener('click', removeTable)

const updateCountryFlag = (countryCode, countryName) => {
    countryCode = countryCode.toLowerCase()
    src = `https://flagcdn.com/84x63/${countryCode}.png`
    srcset = `https://flagcdn.com/168x126/${countryCode}.png 2x, https://flagcdn.com/252x189/${countryCode}.png 3x`
    countryFlag.setAttribute('src', src)
    countryFlag.setAttribute('srcset', srcset)
    countryFlag.setAttribute('alt', countryName)
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

        updateCountryFlag(Countries[index].a2, Countries[index].name)
        countryFlag.style.display = 'inline-block'


        //remove the current layers from the map
        removeMapMarkers()
        removeTable()


        //clear the layers form the feature groups
        countryBorders.clearLayers()
        timeMarkers.clearLayers()
        infoMarkers.clearLayers()
        childrenMarkers.clearLayers()
        citiesMarkers.clearLayers()
        forecastMarkersShown.clearLayers()
        earthquakesMarkers.clearLayers()
        for (i = 0; i<40; i++) {
            forecastMarkers[i].clearLayers()
        }
        satelliteMarkers.clearLayers()


        //perform the data grabs for the new country
        Countries[index].show()
        Countries[index].info()
        Countries[index].time()
        Countries[index].cities()
        Countries[index].earthquakes()
        Countries[index].money()
        Countries[index].satellites()

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

    earthquakes() {
        getEarthquakes(this)
    }

    money() {
        getMoney(this)
    }

    satellites() {
        getSatellites(this)
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
                Country.capital = info.capital
                Country.currency = info.currencyCode
                Country.area = info.areaInSqKm
                Country.continent = info.continentName
                Country.geoname = info.geonameId

                infoHeader = document.getElementById("infoHeader")
                infoHeader.innerHTML = info.countryName

                countryContinent = document.getElementById("countryContinent")
                countryContinent.innerHTML = info.continentName
                
                countryCapital = document.getElementById("countryCapital")
                countryCapital.innerHTML = info.capital
                
                countryPopulation = document.getElementById("countryPopulation")
                countryPopulation.innerHTML = info.population
                
                countryCurrency = document.getElementById("countryCurrency")
                countryCurrency.innerHTML = info.currencyCode
                
                countryArea = document.getElementById("countryArea")
                countryArea.innerHTML = info.areaInSqKm

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
                    var time = `GMT+${info.gmtOffset}`
                } else if (info.gmtOffset < 0) {
                    var time = `GMT${info.gmtOffset}`
                } else {
                    var time = `GMT+0`
                }

                Country.gmt = time

                var timeHeader = document.getElementById("timeHeader")
                timeHeader.innerHTML = info.countryName

                var currentTime = document.getElementById("currentTime")
                currentTime.innerHTML = info.time

                var sunrise = document.getElementById("sunrise")
                sunrise.innerHTML = info.sunrise
                
                var sunset = document.getElementById("sunset")
                sunset.innerHTML = info.sunset
                
                var timezone = document.getElementById("timezone")
                timezone.innerHTML = time
                
                var timezoneName = document.getElementById("timezoneName")
                timezoneName.innerHTML = info.timezoneId
                
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
                    var name = info[i].name
                    var pop = info[i].population
                    var wiki = info[i].wikipedia
                    
                    if (info[i].countrycode != Country.a2) {continue;} // ignore data not in this.country.
                    var latLng = [info[i].lat, info[i].lng]

                    if (info[i].fcodeName == 'capital of a political entity') {


                        var capital = L.marker(latLng, {icon: capitalIcon})

                        capital.name = info[i].name
                        capital.pop = info[i].population
                        capital.wiki = info[i].wikipedia
                        capital.on('click', function(markerOptions) {

                            var name = markerOptions.sourceTarget.name
                            var population = markerOptions.sourceTarget.pop
                            var wiki = markerOptions.sourceTarget.wiki

                            cityTableGenerator(name, population, wiki)
                            })

                        citiesMarkers.addLayer(capital)


                    } else {


                        var city = new L.marker(latLng, {icon: cityIcon})
                        city.name = info[i].name
                        city.pop = info[i].population
                        city.wiki = info[i].wikipedia
                        city.on('click', function(markerOptions) {

                            var name = markerOptions.sourceTarget.name
                            var population = markerOptions.sourceTarget.pop
                            var wiki = markerOptions.sourceTarget.wiki

                            cityTableGenerator(name, population, wiki)
                            })
                        

                        citiesMarkers.addLayer(city)


                    }

                }
            }
            return Country
        },
        error: function (jqXHR, textStatus, errorThrown) {
            alert(`No cities in geonames data base for ${Country.name}`)
            console.log(jqXHR)
            console.log(textStatus)
            console.log(errorThrown)
        }
    })
} 

const cityTableGenerator = (cityName, cityPopulation, cityWiki) => {


    clearButton.style.display = 'inline-block'
    var cityTable = document.getElementById('cityTable')
    cityTable.style.display = 'table'

    var cityNameElement = document.getElementById('cityHeader')
    cityNameElement.innerHTML = cityName
    var cityPopElement = document.getElementById('cityPopulation')
    cityPopElement.innerHTML = cityPopulation
    cityWiki = 'https://' + cityWiki
    var cityWikiElement = document.getElementById('cityWiki')
    cityWikiElement.setAttribute('href', cityWiki) 
}

const getEarthquakes = (Country) => {
    $.ajax({
        url: "php/earthquakes.php",
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
            var info = result.data

            for (index in info) {
                var earthquake = info[index]
                var latLng = [earthquake.lat, earthquake.lng]
                var magnitude = earthquake.magnitude
                var datetime = earthquake.datetime
                earthquakeIcon = generateEarthQuakeIcon(magnitude)
                var earthquakeMarker = L.marker(latLng, {icon: earthquakeIcon})
                earthquakeMarker.magnitude = magnitude
                earthquakeMarker.datetime = datetime
                earthquakeMarker.on('click', function(markerOptions) {

                    var date = markerOptions.sourceTarget.datetime
                    var magnitude = markerOptions.sourceTarget.magnitude

                    earthquakeTableGenerator(date, magnitude)
                })


                earthquakeMarker.addTo(earthquakesMarkers)
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {

            console.log(jqXHR)
            console.log(textStatus)
            console.log(errorThrown)
        }
    })
} 

const earthquakeTableGenerator = (date, magnitude) => {
    if (magnitude < 5.4 ) {
        var color = '#9CE37D'
    } else if (magnitude < 6.9) {
        var color = '#7FC8F8'
    } else if (magnitude < 7.9) {
        var color = '#F9C22E'
    } else {
        var color = '#FE5F55'
    }

    clearButton.style.display = 'inline-block'
    var earthquakeTable = document.getElementById('earthquakeTable')
    earthquakeTable.style.display = 'table'

    var dateElement = document.getElementById('earthquakeDate')
    dateElement.innerHTML = date
    dateElement.style.color = color


    var magnitudeElement = document.getElementById('magnitude')
    magnitudeElement.innerHTML = magnitude

}

const getMoney = (Country) => {
    $.ajax({
        url: "php/money.php",
        type: 'GET',
        dataType: 'json',
        data: {
            countryCode: Country.a2
        },

        success: function (result) {
            JSON.stringify(result)

            if (result.status.name == "ok") {
                var info = result.data[1][0]
                var header = info.name
                var capital = info.capitalCity 
                var incomeType = info.incomeLevel.value
                var region = info.region.value
                var lendingType = info.lendingType.value

                var infoHeader = document.getElementById("moneyHeader")
                infoHeader.innerHTML = header

                var moneyCapital = document.getElementById("moneyCapital")
                moneyCapital.innerHTML = capital
                
                var moneyIncomeLevel = document.getElementById("incomeLevel")
                moneyIncomeLevel.innerHTML = incomeType
                
                var moneyRegion = document.getElementById("moneyRegion")
                moneyRegion.innerHTML = region
                
                var moneyLendingType = document.getElementById("lendingType")
                moneyLendingType.innerHTML = lendingType

            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log(jqXHR)
            console.log(textStatus)
            console.log(errorThrown)
        }
    });
} 

const getSatellites = (Country) => {
    var lat = Country.mid.lat
    var lng = Country.mid.lng
    var bounds = Country.bounds
    var latLen = bounds._northEast.lat - bounds._southWest.lat
    var lngLen = bounds._northEast.lng - bounds._southWest.lng
    // we want something that maps 104 -> 45 ¬based on usa
    // and 10 -> 10
    // doing a small amount of math I came to the following function
    
    var radius = Math.max(lngLen, latLen)
    radius = -5+3*(3*radius+2)**0.5
    radius = parseInt(radius)
    // we also never want it to be more than 50
    radius = Math.min(radius, 50)
    $.ajax({
        url: "php/satellites.php",
        type: 'GET',
        dataType: 'json',
        data: {
            lat: lat,
            lng: lng,
            radius: radius
        },

        success: function(result) {
            JSON.stringify(result)

            var info = result.data.above
            info.sort(() => (Math.random() > .5) ? 1 : -1);
            for (index in info) {
                if (index > radius) break // use radius that we created earlier to make a nice bound for how many we display on map
                var satellite = info[index]
                var latLng = [info[index].satlat, info[index].satlng]
                var colours = ['#9CE37D', '#7FC8F8', '#F9C22E', '#FE5F55', '#ECBA82', '#EACBD2', '#06D6A0', '#9DACFF']
                var colour = colours[Math.floor(Math.random() * colours.length)]
                var satelliteMarker = L.marker(latLng, {icon: generateSatelliteIcon(colour)})
                satelliteMarker.name = satellite.satname
                satelliteMarker.latLng = latLng
                satelliteMarker.id = satellite.intDesignator
                satelliteMarker.date = satellite.launchDate
                satelliteMarker.colour = colour

                satelliteMarker.on('click', function(markerOptions) {

                    var date = markerOptions.sourceTarget.date
                    var name = markerOptions.sourceTarget.name
                    var id = markerOptions.sourceTarget.id
                    var latLng = markerOptions.sourceTarget.latLng
                    var colour = markerOptions.sourceTarget.colour

                    satelliteTableGenerator(name, latLng, date, id, colour)
                    }).addTo(satelliteMarkers)
            }


        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log(jqXHR)
            console.log(textStatus)
            console.log(errorThrown)
        }
    })
}


const satelliteTableGenerator = (name, latLng, launchDate, intId, colour) => {

    clearButton.style.display = 'inline-block'
    var earthquakeTable = document.getElementById('satelliteTable')
    earthquakeTable.style.display = 'table'
    

    var satnameElement = document.getElementById('satelliteHeader')
    satnameElement.innerHTML = name
    satnameElement.style.color = colour

    var dateElement = document.getElementById('satelliteDate')
    dateElement.innerHTML = launchDate

    var satLatLng = document.getElementById('satelliteLatLng')
    satLatLng.innerHTML = latLng

    var satId = document.getElementById('satelliteId')
    satId.innerHTML = intId
}

// ┌──────────────────────────────────────────────────────────────────────────────┐
// │ The Icons and icon generator functions                                       │
// └──────────────────────────────────────────────────────────────────────────────┘

// the information icon
const infoIcon = (countryName, continentName, population, capital, currencyCode, areaInSqKm) => {
    var populationIcon = L.divIcon({
        html: ``,
        className: "table table-dark table-hover",
        iconSize: [50, 40],
        iconAnchor: [25, 10]
    })
    return populationIcon
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

var cityIcon = L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" class="ionicon"  viewBox="0 0 512 512"><title>Star</title><path fill='white' stroke='white' d="M394 480a16 16 0 01-9.39-3L256 383.76 127.39 477a16 16 0 01-24.55-18.08L153 310.35 23 221.2a16 16 0 019-29.2h160.38l48.4-148.95a16 16 0 0130.44 0l48.4 149H480a16 16 0 019.05 29.2L359 310.35l50.13 148.53A16 16 0 01394 480z"/></svg>`,
    className: "",
    iconSize: [20, 15],
    iconAnchor: [10, 7.5],
});

var capitalIcon = L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><title>Star</title><path stroke='#F9C22E' fill='#F9C22E' d="M394 480a16 16 0 01-9.39-3L256 383.76 127.39 477a16 16 0 01-24.55-18.08L153 310.35 23 221.2a16 16 0 019-29.2h160.38l48.4-148.95a16 16 0 0130.44 0l48.4 149H480a16 16 0 019.05 29.2L359 310.35l50.13 148.53A16 16 0 01394 480z"/></svg>`,
    className: "",
    iconSize: [30, 25],
    iconAnchor: [15, 12.5],
});

var generateEarthQuakeIcon = (magnitude) => {
    if (magnitude < 5.4 ) {
        var color = '#9CE37D'
        var size = 15
    } else if (magnitude < 6.9) {
        var color = '#7FC8F8'
        var size = 25
    } else if (magnitude < 7.9) {
        var color = '#F9C22E'
        var size = 50
    } else {
        var color = '#FE5F55'
        var size = 100
    }
    var earthquakeIcon = L.divIcon({
        html: `<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><title>Disc</title><circle cx="256" cy="256" r="208" fill="none" stroke="${color}" stroke-miterlimit="10" stroke-width="32"/><circle cx="256" cy="256" r="96" fill="none" stroke="${color}" stroke-miterlimit="10" stroke-width="32"/><circle cx="256" cy="256" r="32" stroke="${color}" fill="${color}" /></svg>`,
        className: '',
        iconSize: [size,size],
        iconAnchor: [size/2,size/2]
    }) 
    return earthquakeIcon
}

const earthquakeEasyButtonIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><title>Disc</title><circle cx="256" cy="256" r="208" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="32"/><circle cx="256" cy="256" r="96" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="32"/><circle cx="256" cy="256" r="32"/></svg>`

const generateSatelliteIcon = (colour) => {

    var satelliteIcon = L.divIcon({
        html: `<?xml version="1.0" encoding="utf-8"?><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" stroke='${colour}' fill='${colour}' viewBox="0 0 122.88 122.88" style="enable-background:new 0 0 122.88 122.88" xml:space="preserve"><g><path d="M5.49,79.09l37.86,37.86C66.37,99.1,36.69,54.35,5.49,79.09L5.49,79.09z M42.39,62.21l18.29,18.29 c1.18,1.18,3.12,1.18,4.3,0l24.2-24.2c6.21-6.21,6.21-16.38,0-22.59v0c-6.21-6.21-16.38-6.21-22.59,0l-24.2,24.2 C41.2,59.09,41.2,61.02,42.39,62.21L42.39,62.21z M24.5,104.83L20.33,109c-1.48,1.48-3.89,1.48-5.38,0c-1.48-1.49-1.48-3.89,0-5.38 l4.17-4.17l-17-17l0.01-0.01c-0.13-0.13-0.25-0.26-0.36-0.4C0.15,80,0.49,77.01,2.54,75.38c13.15-10.43,26.24-10.1,36.28-4.46 c1.85,1.04,3.59,2.26,5.2,3.64l1.99-1.99l-6.99-6.99c-1.52-1.52-2.28-3.52-2.28-5.51c0-1.99,0.76-3.99,2.28-5.51l5.92-5.92 l-5.11-5.11l-3.76,3.76h0c-1.22,1.22-2.83,1.84-4.44,1.84c-1.59,0-3.19-0.61-4.42-1.84l-0.01-0.01l-0.01,0.01h0L3.53,23.62 c-1.22-1.22-1.84-2.83-1.84-4.44c0-1.59,0.62-3.19,1.85-4.43l-0.01-0.01L16.44,1.84l0,0c0.16-0.16,0.33-0.31,0.51-0.44 C18.09,0.47,19.48,0,20.87,0c1.59,0,3.19,0.61,4.42,1.84l0.01,0.01l0.01-0.01l0,0L48.97,25.5v0c1.22,1.22,1.84,2.83,1.84,4.44 c0,1.6-0.61,3.21-1.84,4.44v0l-3.77,3.77l5.11,5.11l12.91-12.91c4.03-4.03,9.35-6.05,14.66-6.05c5.31,0,10.62,2.02,14.66,6.05v0 c4.03,4.03,6.05,9.35,6.05,14.66c0,5.31-2.02,10.62-6.05,14.66L79.63,72.56l5.11,5.11l3.77-3.76c1.22-1.22,2.83-1.84,4.44-1.84 c1.6,0,3.21,0.61,4.44,1.84l23.66,23.66l0,0c1.22,1.22,1.84,2.83,1.84,4.44c0,1.6-0.61,3.21-1.84,4.44l0,0l-12.91,12.91 c-1.22,1.22-2.83,1.84-4.44,1.84c-1.6,0-3.21-0.61-4.44-1.84L75.6,95.69c-1.22-1.22-1.84-2.83-1.84-4.44 c0-1.59,0.61-3.19,1.84-4.42l0.01-0.01l-0.01-0.01l3.76-3.77l-5.11-5.11l-5.92,5.92c-1.52,1.52-3.52,2.28-5.51,2.28 c-1.99,0-3.99-0.76-5.51-2.28l-5.92-5.92l-2.15,2.15c2.47,3.26,4.37,6.93,5.57,10.75c3.27,10.41,1.4,21.91-8.23,29.61 c-1.86,1.73-4.78,1.68-6.59-0.13L24.5,104.83L24.5,104.83z M0.13,106.96c-0.53-1.89,0.57-3.86,2.47-4.39 c1.89-0.53,3.86,0.57,4.39,2.47c1,3.53,2.38,6.2,4.16,7.99c1.6,1.61,3.6,2.53,6.03,2.73c1.96,0.16,3.42,1.88,3.26,3.85 c-0.16,1.96-1.88,3.42-3.85,3.26c-4.17-0.36-7.65-1.98-10.48-4.83C3.45,115.38,1.47,111.67,0.13,106.96L0.13,106.96z"/></g></svg>`,
        className: "",
        iconSize: [25,25],
        iconAnchor: [0,0],
        colour: colour
    })
    return satelliteIcon
}

const satelliteEasyButton = `<?xml version="1.0" encoding="utf-8"?><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"' viewBox="0 0 122.88 122.88" style="enable-background:new 0 0 122.88 122.88" xml:space="preserve"><g><path d="M5.49,79.09l37.86,37.86C66.37,99.1,36.69,54.35,5.49,79.09L5.49,79.09z M42.39,62.21l18.29,18.29 c1.18,1.18,3.12,1.18,4.3,0l24.2-24.2c6.21-6.21,6.21-16.38,0-22.59v0c-6.21-6.21-16.38-6.21-22.59,0l-24.2,24.2 C41.2,59.09,41.2,61.02,42.39,62.21L42.39,62.21z M24.5,104.83L20.33,109c-1.48,1.48-3.89,1.48-5.38,0c-1.48-1.49-1.48-3.89,0-5.38 l4.17-4.17l-17-17l0.01-0.01c-0.13-0.13-0.25-0.26-0.36-0.4C0.15,80,0.49,77.01,2.54,75.38c13.15-10.43,26.24-10.1,36.28-4.46 c1.85,1.04,3.59,2.26,5.2,3.64l1.99-1.99l-6.99-6.99c-1.52-1.52-2.28-3.52-2.28-5.51c0-1.99,0.76-3.99,2.28-5.51l5.92-5.92 l-5.11-5.11l-3.76,3.76h0c-1.22,1.22-2.83,1.84-4.44,1.84c-1.59,0-3.19-0.61-4.42-1.84l-0.01-0.01l-0.01,0.01h0L3.53,23.62 c-1.22-1.22-1.84-2.83-1.84-4.44c0-1.59,0.62-3.19,1.85-4.43l-0.01-0.01L16.44,1.84l0,0c0.16-0.16,0.33-0.31,0.51-0.44 C18.09,0.47,19.48,0,20.87,0c1.59,0,3.19,0.61,4.42,1.84l0.01,0.01l0.01-0.01l0,0L48.97,25.5v0c1.22,1.22,1.84,2.83,1.84,4.44 c0,1.6-0.61,3.21-1.84,4.44v0l-3.77,3.77l5.11,5.11l12.91-12.91c4.03-4.03,9.35-6.05,14.66-6.05c5.31,0,10.62,2.02,14.66,6.05v0 c4.03,4.03,6.05,9.35,6.05,14.66c0,5.31-2.02,10.62-6.05,14.66L79.63,72.56l5.11,5.11l3.77-3.76c1.22-1.22,2.83-1.84,4.44-1.84 c1.6,0,3.21,0.61,4.44,1.84l23.66,23.66l0,0c1.22,1.22,1.84,2.83,1.84,4.44c0,1.6-0.61,3.21-1.84,4.44l0,0l-12.91,12.91 c-1.22,1.22-2.83,1.84-4.44,1.84c-1.6,0-3.21-0.61-4.44-1.84L75.6,95.69c-1.22-1.22-1.84-2.83-1.84-4.44 c0-1.59,0.61-3.19,1.84-4.42l0.01-0.01l-0.01-0.01l3.76-3.77l-5.11-5.11l-5.92,5.92c-1.52,1.52-3.52,2.28-5.51,2.28 c-1.99,0-3.99-0.76-5.51-2.28l-5.92-5.92l-2.15,2.15c2.47,3.26,4.37,6.93,5.57,10.75c3.27,10.41,1.4,21.91-8.23,29.61 c-1.86,1.73-4.78,1.68-6.59-0.13L24.5,104.83L24.5,104.83z M0.13,106.96c-0.53-1.89,0.57-3.86,2.47-4.39 c1.89-0.53,3.86,0.57,4.39,2.47c1,3.53,2.38,6.2,4.16,7.99c1.6,1.61,3.6,2.53,6.03,2.73c1.96,0.16,3.42,1.88,3.26,3.85 c-0.16,1.96-1.88,3.42-3.85,3.26c-4.17-0.36-7.65-1.98-10.48-4.83C3.45,115.38,1.47,111.67,0.13,106.96L0.13,106.96z"/></g></svg>`

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


