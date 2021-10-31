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

//these markers will be on the map depending on a push of an easy button
var infoMarkers = new L.FeatureGroup()
var timeMarkers = new L.FeatureGroup()
var childrenMarkers = new L.FeatureGroup()

var weatherCurrent



// ┌──────────────────────────────────────────────────────────────────────────────┐
// │ Easy Buttons                                                                 │
// └──────────────────────────────────────────────────────────────────────────────┘


const showButtons = (currentCountry) => {
    //information easy button
    L.easyButton('<span>&#8505;</span>', function () {
        if (myMap.hasLayer(infoMarkers)) {
            myMap.removeLayer(infoMarkers);
        } else {
            myMap.addLayer(infoMarkers)

            // remove all other layers
            myMap.removeLayer(timeMarkers);
            myMap.removeLayer(childrenMarkers);
        }
    }).addTo(myMap);

    //timezone easy button
    L.easyButton(`<span>${timeEasyButtonIcon}</span>`, function () {
        if (myMap.hasLayer(timeMarkers)) {
            myMap.removeLayer(timeMarkers);
        } else {
            myMap.addLayer(timeMarkers)

            // remove all other layers
            myMap.removeLayer(infoMarkers)
            myMap.removeLayer(childrenMarkers);
        }
    }).addTo(myMap);

    // Capital cities and other country markers

    L.easyButton(`<span>&starf;</span>`, function () {
        // We dont want to keep getting the data if we already have it so we have a childrenGot flag to ensure if we got the data we dont ask again
        if (!currentCountry.childrenGot) {
        // We need the geoname for this api so we have to wait for Countries.info() to receive it
            if (currentCountry.geoname) {
                currentCountry.children()
            }
        }
        if (myMap.hasLayer(childrenMarkers)) {
            myMap.removeLayer(childrenMarkers);
        } else {
            myMap.addLayer(childrenMarkers)

            // remove all other layers
            myMap.removeLayer(infoMarkers)
            myMap.removeLayer(timeMarkers)
        }
    }).addTo(myMap);

    d8f5765ebc28ccc49475784b4f71626d

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
    console.log(countryJSON.features)
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
        if (currentCountry) {
            prevCountry = currentCountry
        }

        var index = getCountriesIndex(this.value);
        currentCountry = index
        //remove the current layers from the map
        myMap.removeLayer(timeMarkers)
        myMap.removeLayer(infoMarkers)

        console.log(Countries[index].geoname)

        //clear the layers form the feature groups
        countryBorders.clearLayers()
        timeMarkers.clearLayers()
        infoMarkers.clearLayers()

        //perform the data grabs for the new country
        Countries[index].show()
        Countries[index].info()
        Countries[index].time()


        //fly to the country
        Countries[index].flyTo()


        // We show the easy buttons after the user has picked a country for the first time
        if (showButtonsBool) {
            showButtons(Countries[i])
        }
        showButtonsBool = false
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

        this.feature = L.geoJson(countryData, { style: countryOutline })
        this.bounds = this.feature.getBounds()
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
                console.log(info)

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
                    icon: infoIcon(info.countryName, info.continentName, info.population, info.capital, info.currencyCode, info.areaInSqKm),
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
    console.log(Country.mid, Country.mid.lat, Country.mid.lng)
    var lat = Number.parseFloat(Country.mid.lat).toFixed(2)
    var lng = Number.parseFloat(Country.mid.lng).toFixed(2)
    console.log(Country.mid, lat, lng)
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
                console.log(info)
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
                var info = result
                console.log(info)

                

                
                Country.childrenGot = true
                return
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log(jqXHR)
            console.log(textStatus)
            console.log(errorThrown)
        }
    });
};






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
        html: `<table "><thead><tr><th>Time</th><th>${time}</th></tr></thead><tbody><tr><td>Sunrise</td><td>${sunrise}</td></tr><tr><td>Sunset</td><td>${sunset}</td></tr><tr><td>Timezone</td><td>${timezone}</td></tr><tr><td>Timezone Name</td><td>${timezoneName}</td></tr></tbody></table>`,
        className: "table table-dark table-hover",
        iconSize: [50, 40],
        iconAnchor: [25, 10]
    })
    return timeIcon
}

const timeEasyButtonIcon = '<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><style>.cls-1{fill:#141f38;}</style></defs><title>watch-outline</title><path class="cls-1" d="M271.46,272.55a38.42,38.42,0,0,0-21.86-52.76V166.4a12.8,12.8,0,1,0-25.6,0v53.39a38.4,38.4,0,1,0,29.35,70.86l51.2,51.19a12.8,12.8,0,0,0,18.1-18.1ZM236.8,268.8A12.8,12.8,0,1,1,249.6,256,12.81,12.81,0,0,1,236.8,268.8Z"/><path class="cls-1" d="M435.2,204.8H421.89A192.37,192.37,0,0,0,339.2,93.57V44.8A44.8,44.8,0,0,0,294.4,0H179.2a44.8,44.8,0,0,0-44.8,44.8V93.57a192,192,0,0,0,0,324.86V467.2A44.8,44.8,0,0,0,179.2,512H294.4a44.8,44.8,0,0,0,44.8-44.8V418.43A192.37,192.37,0,0,0,421.89,307.2H435.2a32,32,0,0,0,32-32V236.8A32,32,0,0,0,435.2,204.8ZM160,44.8a19.22,19.22,0,0,1,19.2-19.2H294.4a19.22,19.22,0,0,1,19.2,19.2V80A192.41,192.41,0,0,0,160,80ZM313.6,467.2a19.22,19.22,0,0,1-19.2,19.2H179.2A19.22,19.22,0,0,1,160,467.2V432a192.41,192.41,0,0,0,153.6,0Zm40.86-93.54A166.4,166.4,0,1,1,403.2,256,165.31,165.31,0,0,1,354.46,373.66ZM441.6,275.2a6.41,6.41,0,0,1-6.4,6.4h-8.1a193.26,193.26,0,0,0,0-51.2h8.1a6.41,6.41,0,0,1,6.4,6.4Z"/></svg>'

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
