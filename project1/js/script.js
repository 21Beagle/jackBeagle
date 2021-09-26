// define our map and file path for geoson data

const myMap = L.map("mapid").locate({setView: true, maxZoom: 10});
const countryFilePath = "./js/countryBorders.geo.json"

// Get the map data for leaflet
var Stadia_AlidadeSmoothDark = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
	maxZoom: 20,
	attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
}).addTo(myMap);

// this appends the datalist with all the country names
getAllCountries().then((features)=> {
    namesArr = []
    for (i = 0; i < features.length; i++) {
        namesArr.push(features[i].properties.name)
    }
    return namesArr
}).then(namesArr => {
    var container = document.getElementById('countryDatalist'),
    i = 0,
    len = namesArr.length,
    dl = document.createElement('datalist');
    dl.id = 'countries';

    for (; i < len; i += 1) {
        var option = document.createElement('option');
        option.value = namesArr[i];
        option.text = namesArr[i]
        dl.appendChild(option);
    }

    container.appendChild(dl);
})


// gets the data of all the countries
async function getAllCountries() {

    let options = {
    method: 'GET',
    }
    let response = await fetch(countryFilePath, options);
    let $member = await response.text();
    countryJSON = JSON.parse($member)
    return countryJSON.features; 

}


// gets a specific country's data
async function getCountryData(number) {

    let options = {
    method: 'GET',
    }
    let response = await fetch(countryFilePath, options);
    let $member = await response.text();
    countryJSON = JSON.parse($member)
    return countryJSON.features[number]; 

}


// Function's list to do leaflet stuff
const getCountryNumberByName = (countryName) => {
    getAllCountries().then(countriesData => {
        for (i = 0; i< countriesData.length; i++) {
            var name = countriesData[i].properties.name
            if (name == countryName) {
                return i
            }
        }
        throw countryName + " is not a valid country name"
    }).then(result => {
        return result
    })
}

// when the button is clicked the map will fly to the country and create a boundary for it
$('#btnGoCountry').click(function() {
    console.log("button clicked");
    // we want to remove all the current layers from the map apart from the background map. 
    myMap.eachLayer(function (layer) {
        if (layer != Stadia_AlidadeSmoothDark)
        myMap.removeLayer(layer);
    });

    // get country number, we do this to avoid the user from having to type in a number to find the country,
    // its slightly awkward but we get the result we want
    getAllCountries().then(countriesData => {
        countryName = $('#countryDatalist').val();
        for (i = 0; i< countriesData.length; i++) {
            var name = countriesData[i].properties.name
            if (name == countryName) {
                return i
            }
        }
        throw countryName + " is not a valid country name"
    }).then(countryNumber => {
            
        getCountryData(countryNumber).then(data => {
            console.log(data)
            return data  

        }).then(data=> {
            var feature = L.geoJson(data)
            var bounds = feature.getBounds();
            myMap.flyToBounds(bounds)
            // special case here for canada. The boundary included a lot of north usa which made the weather get include mostly american data. 
            if (data.properties.name == "Canada") {
                bounds._southWest.lat = 49.2827
            }
            // using the bounds we are going to call a weather get function.
            console.log(bounds)
            feature.addTo(myMap)
            getInformation(data.properties.iso_a2)
            return bounds
        }).then(bounds => {
            getWeather(bounds)
        })
    })
});


const getWeather = (bounds) => {
    var north = bounds._northEast.lat
    var south = bounds._southWest.lat
    var east = bounds._northEast.lng
    var west = bounds._southWest.lng

    var howMany = 3*parseInt(Math.sqrt((north - south)+(east-west)))
    console.log(north, south, east, west, howMany)
    
    $.ajax({
        url: "php/weather.php",
        type: 'POST',
        dataType: 'json',
        data: {
            north: north,
            south: south,
            east: east,
            west: west,
            howMany: howMany
        },

        success: function(result) {
            JSON.stringify(result)
            console.log(result)

            if (result.status.name == "ok") {
                var data = result.data
                var len = data.length
                for (i = 0; i < len; i++) {
                    weatherData = data[i]

                    latLng = L.latLng([weatherData.lat, weatherData.lng])

                    if (weatherData.clouds == "no clouds detected" || weatherData.clouds == "n/a") {
                        L.marker(latLng, {icon: sunIcon}).addTo(myMap);
                    } else {
                        L.marker(latLng, {icon: cloudsIcon}).addTo(myMap);
                    }
                    if (weatherData.weatherCondition.includes("snow")) {
                        L.marker(latLng, {icon: cloudsIcon}).addTo(myMap);
                    }
                    if (
                        weatherData.weatherCondition.includes("rain") || 
                        weatherData.weatherCondition.includes("showers") || 
                        weatherData.weatherCondition.includes("drizzle")
                        ) {
                            console.log("rain at", latLng)
                            L.marker(latLng, {icon: rainIcon}).addTo(myMap);
                    }
                    
                    //console.log(weatherData.temperature, weatherData.humidity)
                    //console.log(weatherData.stationName)
                    //console.log(weatherData.windSpeed, weatherData.windDirection)
                }
                

            }
        
        },
        error: function(jqXHR, textStatus, errorThrown) {

            console.log(jqXHR)
            console.log(textStatus)
            console.log(errorThrown)

        }
    }); 

};

const getInformation = (countryCode) => {
    $.ajax({
        url: "php/information.php",
        type: 'POST',
        dataType: 'json',
        data: {
            countryCode: countryCode 
        },

        success: function(result) {
            JSON.stringify(result)

            if (result.status.name == "ok") {
                var data = result.data[0]
                $('#countryName').html(data.countryName)
                $('#continent').html(data.continentName)
                $('#capital').html(data.capital);
                $('#currency').html(data.currencyCode);
                $('#population').html(data.population);
                $('#area').html(data.areaInSqKm);
                console.log(data)
            }
        
        },
        error: function(jqXHR, textStatus, errorThrown) {

            console.log(jqXHR)
            console.log(textStatus)
            console.log(errorThrown)

        }
    }); 

};








// showers, light rain, clouds, snow, clear, overcast



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
    iconAnchor: [25, 10],
});

const sunIcon = L.divIcon({
    html: `<?xml version="1.0" ?><svg id="icone" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><title/><path d="M276,170a106,106,0,0,0-84.28,170.28A106,106,0,0,0,340.28,191.72,105.53,105.53,0,0,0,276,170Z" fill="#f7ad1e"/><path d="M150.9,242.12A107.63,107.63,0,0,0,150,256a106,106,0,1,0,19.59-61.37" fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20"/><path d="M157.56,216.68c-.17.41-.34.81-.5,1.22" fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20"/><line fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" x1="256" x2="256" y1="64" y2="123"/><line fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" x1="256" x2="256" y1="389" y2="447.99"/><line fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" x1="120.24" x2="161.96" y1="120.24" y2="161.95"/><line fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" x1="350.04" x2="391.76" y1="350.04" y2="391.76"/><line fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" x1="64" x2="123" y1="256" y2="256"/><line fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" x1="389" x2="448" y1="256" y2="256"/><line fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" x1="120.24" x2="161.96" y1="391.76" y2="350.04"/><line fill="none" stroke="#02005c" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" x1="350.04" x2="391.76" y1="161.95" y2="120.24"/></svg>`,
    className: "",
    iconSize: [50, 40],
    iconAnchor: [25, 10],
});