var myMap = L.map('mapid').locate({setView: true, maxZoom: 10});

var Stadia_AlidadeSmoothDark = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
	maxZoom: 20,
	attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
}).addTo(myMap);


(async () => {
var countryFilePath = "./js/countryBorders.geo.json"
// Get the data out of the fetchMember function
// It is in the scope of the overall self executing function.

let test = await getCountryData();


async function getCountryData($vid) {

    let options = {
    method: 'GET',
    }
    let response = await fetch(countryFilePath, options);
    let $member = await response.text();

    return $member; // this is a promise because it is in an async function

} //end of function

countryJSON = JSON.parse(test)

const countriesData = countryJSON.features


const thisCountryData = (countryNumber) => {
    return countriesData[countryNumber]
}

var feature 

const getCountryNumberByName = (countryName) => {
    for (i = 0; i< countriesData.length; i++) {
        var thisCountry = thisCountryData(i)
        var name = thisCountry.properties.name
        if (name == countryName) {
            return i
        }
    }
    throw countryName + " is not a valid country name"
}

const addCountryToMap = (numberCountry) => {
    var feature = createLeafletObject(numberCountry)
    feature.addTo(myMap)
}



const createLeafletObject = (numberCountry) => {
    thisCountry = thisCountryData(numberCountry)
    return L.geoJSON(thisCountry).on('click', function() { 
        alert('Clicked on a member of the group!'); 
        L.removeLayer(thisCountry)
    })
}

const getCountryBounds = (numberCountry) => {
    var thisCountry = thisCountryData(numberCountry)
    var feature = L.geoJson(thisCountry)
    var bounds = feature.getBounds();
    console.log(bounds)
    return bounds
}

const centerCountryOnMap = (numberCountry) => {
    var bounds = getCountryBounds(numberCountry)
    myMap.flyToBounds(bounds)
}

var number = getCountryNumberByName("Canada")

centerCountryOnMap(number)
addCountryToMap(number)

console.log(L.featureGroup())

















    
})();

