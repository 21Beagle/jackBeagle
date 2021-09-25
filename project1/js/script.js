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
            feature.addTo(myMap)
            myMap.flyToBounds(bounds)
        })
    })
});