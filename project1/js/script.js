var countryFilePath = "./js/countryBorders.geo.json"


getCountryData = async () => {
    data = await $.getJSON(countryFilePath)
    return data
}








var mymap = L.map('mapid').setView([51.505, -0.09], 13);


var Stadia_AlidadeSmoothDark = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
	maxZoom: 20,
	attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
}).addTo(mymap);


const thisCountryData = (countryNumber, data) => {
    return countryData = data["features"][countryNumber]
}

const getCountryName = (numberCountry, data) => {
    return data["features"][numberCountry]["properties"]["name"]
}





getCountryData().then(data => {
    console.log(data)
    L.geoJSON(thisCountryData(145, data), {
        style: function (feature) {
            return {color: "red"};
        }
    }).bindPopup(function (layer) {
        return layer.feature.properties.name;
    }).addTo(mymap);
    //console.log(data)
    
    //addCountryBorderToMap(145, data)    
})
