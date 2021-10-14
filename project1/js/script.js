// define our map and file path for geoson data

const myMap = L.map("mapid").locate({setView: true, maxZoom: 10});
const countryFilePath = "./js/countryBorders.geo.json"

// Get the map data for leaflet
var Stadia_AlidadeSmoothDark =  L.tileLayer('https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png', {
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

    len = namesArr.length,
    dl = document.createElement('datalist');
    dl.id = 'countries';

    for (i = 0; i < len; i++) {
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
    console.log(myMap)
    myMap.eachLayer(function (layer) {
        if (layer != Stadia_AlidadeSmoothDark && layer != ISS)
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

// gets the weather within the bounds of an area
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

const getISS = () => $.ajax({
    url: "php/iss.php",
    type: "GET",
    dataType: "json",

    success: function (result) {
        JSON.stringify(result)
        console.log(result)
        data = result.data
        pos = data.iss_position
        lat = pos.latitude
        lng = pos.longitude
        latLng = [lat, lng]
        try{
            ISS = L.marker(latLng, {icon: issIcon}).addTo(myMap);
        } catch (e) {
            console.log(e)
        }
    },
    error: function(jqXHR, textStatus, errorThrown) {

        console.log(jqXHR)
        console.log(textStatus)
        console.log(errorThrown)

    }

})


ISS = getISS()



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

const issIcon = L.divIcon({
    html: `<?xml version="1.0" ?><!DOCTYPE svg  PUBLIC '-//W3C//DTD SVG 1.1//EN'  'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'><svg enable-background="new 0 0 91 91" height="50px" id="Layer_1" version="1.1" viewBox="0 0 91 91" width="50px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g><g><path d="M10.14,31.51c0.004,0.004,0.006,0.01,0.012,0.014c0.004,0.005,0.01,0.008,0.014,0.013l9.381,9.378    c0.49,0.49,1.133,0.736,1.775,0.736s1.287-0.246,1.777-0.736l7.137-7.135l3.84,3.84l-9.744,9.744c-0.98,0.982-0.98,2.572,0,3.555    l6.254,6.254l-2.42,2.422c-3.314-2.514-7.447-3.938-11.688-3.938c-4.201,0-8.023,1.414-10.488,3.877    c-0.473,0.471-0.736,1.111-0.738,1.777c0,0.666,0.266,1.305,0.736,1.777l9.342,9.34l-0.895,0.895    c-0.982,0.98-0.982,2.572-0.002,3.553c0.49,0.492,1.135,0.736,1.777,0.736s1.285-0.244,1.775-0.734l0.896-0.895l9.34,9.34    c0.492,0.49,1.135,0.736,1.777,0.736s1.285-0.246,1.777-0.736c4.848-4.848,5.563-14.859-0.053-22.184l2.414-2.412l6.254,6.254    c0.473,0.473,1.111,0.736,1.777,0.736s1.307-0.264,1.777-0.736l9.747-9.748l3.578,3.578l-7.141,7.141    c-0.98,0.98-0.98,2.57,0,3.553l9.379,9.377c0.004,0.006,0.006,0.012,0.012,0.016c0.004,0.004,0.01,0.008,0.014,0.012l9.375,9.375    C69.4,90.773,70.043,91,70.686,91c0.645,0,1.287-0.227,1.777-0.717l8.914-8.914h0.002v-0.002l8.916-8.914    C90.766,71.982,91,71.34,91,70.672c0-0.666-0.234-1.301-0.705-1.771l-9.377-9.377c-0.004-0.006-0.008-0.012-0.012-0.016    s-0.01-0.008-0.016-0.012l-9.377-9.377c-0.941-0.943-2.611-0.941-3.553,0l-7.137,7.137l-3.576-3.576l14.236-14.242    c2.615-2.611,4.057-6.096,4.057-9.809c0-3.715-1.441-7.197-4.053-9.807c-2.609-2.611-6.09-4.051-9.805-4.051    c-3.699,0-7.17,1.43-9.777,4.022c-0.012,0.011-0.023,0.017-0.035,0.028c-0.006,0.006-0.01,0.012-0.016,0.018L37.628,34.067    l-3.84-3.84l7.143-7.143c0.471-0.471,0.736-1.11,0.736-1.777c0-0.666-0.266-1.305-0.736-1.776L22.15,0.75    c-0.98-0.98-2.572-0.98-3.553,0.001L0.765,18.584c-0.98,0.98-0.98,2.571,0,3.553L10.14,31.51z M29.664,79.656L11.658,61.65    c1.365-0.629,3.025-0.969,4.82-0.969c3.775,0,7.438,1.496,10.047,4.104C30.832,69.094,31.544,75.602,29.664,79.656z     M60.824,64.363l5.836,5.838l-5.361,5.363l-5.838-5.838L60.824,64.363z M70.686,84.953l-5.834-5.836l5.361-5.361l5.836,5.836    L70.686,84.953z M79.602,76.039l-5.834-5.838l5.361-5.361l5.836,5.836L79.602,76.039z M69.738,55.449l5.836,5.838l-5.359,5.361    l-5.838-5.838L69.738,55.449z M67.934,23.376c1.666,1.662,2.582,3.882,2.582,6.253c0,2.37-0.916,4.591-2.582,6.254L42.169,61.65    l-6.248-6.248c-0.002-0.002-0.004-0.004-0.004-0.006c-0.002-0.002-0.004-0.004-0.006-0.004l-6.25-6.252L53.65,25.153l6.254,6.253    c0.492,0.491,1.135,0.735,1.777,0.735s1.285-0.245,1.777-0.736c0.98-0.98,0.98-2.572-0.002-3.553l-5.994-5.992    c1.277-0.692,2.719-1.063,4.221-1.063C64.055,20.797,66.273,21.712,67.934,23.376z M21.322,35.585l-5.84-5.839l5.363-5.361    l5.838,5.84L21.322,35.585z M30.236,26.672l-5.838-5.84l5.365-5.363l5.838,5.838L30.236,26.672z M20.373,6.081l5.836,5.836    l-5.363,5.363l-5.834-5.836L20.373,6.081z M11.458,14.997l5.834,5.836l-5.363,5.361L6.095,20.36L11.458,14.997z"/><path d="M11.189,83.674l1.395-1.396c0.982-0.98,0.982-2.57,0-3.553c-0.98-0.98-2.572-0.98-3.553,0l-1.395,1.396    c-0.982,0.98-0.982,2.57,0,3.553c0.49,0.49,1.133,0.736,1.775,0.736C10.056,84.41,10.699,84.164,11.189,83.674z"/><path d="M3.462,90.359c0.643,0,1.287-0.246,1.777-0.738l0.547-0.547c0.98-0.982,0.979-2.574-0.004-3.553    c-0.982-0.98-2.574-0.979-3.553,0.004l-0.547,0.547c-0.98,0.984-0.979,2.574,0.004,3.555C2.177,90.115,2.82,90.359,3.462,90.359z"/></g></g></svg>`,
    className: "",
    iconSize: [10, ],
    iconAnchor : [0, 0]
})