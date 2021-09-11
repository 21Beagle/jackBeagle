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
    coordinates = countryData = data["features"][countryNumber].geometry.coordinates
    //loop through all arrays
    console.log("All coordinates")
    console.log(coordinates)
    let xPoints = []
    let yPoints = []
    for (array = 0; array < coordinates.length; array++) {
        console.log("border", array)
        border = coordinates[array]
        for (i = 0; i < border.length; i++) {
            console.log("set of points", i)
            setOfPoints = border[i]
            for (j = 0; j < setOfPoints.length; j++) {
                point = setOfPoints[j]
                xPoints.push(point[0])
                yPoints.push(point[1])
            }
        }

    }

    xMin = Math.min.apply(null, xPoints)
    xMax = Math.max.apply(null, xPoints)
    xMid = xMin + (xMax - xMin)/2
    console.log(xMin, xMax, xMid)
    yMax = Math.max.apply(null, yPoints)
    yMin = Math.min.apply(null, yPoints)
    yMid = yMin + (yMax - yMin)/2
    console.log(yMin, yMax, yMid)

    return countryData = data["features"][countryNumber]
}

const getCountryName = (numberCountry, data) => {
    return data["features"][numberCountry]["properties"]["name"]
}




const addCountryToMap = (numberCountry) => {
    getCountryData().then(data => {
        L.geoJSON(thisCountryData(numberCountry, data), {
            style: function (feature) {
                return {color: "red"};
            }
        }).bindPopup(function (layer) {
            return layer.feature.properties.name;
        }).addTo(mymap);
    });
}

const centerCountryOnMap = (numberCountry) => {
    getCountryData().then(data => {
        coordinates = countryData = data["features"][numberCountry].geometry.coordinates
    //loop through all arrays, to get all the x and y coordinates. From there we can find the minimum and the maximum of x and y and then find the mid point
        console.log("All coordinates")
        console.log(coordinates)
        let xPoints = []
        let yPoints = []
        for (array = 0; array < coordinates.length; array++) {
            console.log("border", array)
            border = coordinates[array]
            for (i = 0; i < border.length; i++) {
                console.log("set of points", i)
                setOfPoints = border[i]
                for (j = 0; j < setOfPoints.length; j++) {
                    point = setOfPoints[j]
                    console.log(point)
                    xPoints.push(point[1])
                    yPoints.push(point[0])
                }
            }

        }

        xMin = Math.min.apply(null, xPoints)
        xMax = Math.max.apply(null, xPoints)
        xMid = xMin + (xMax - xMin)/2
        console.log(xMin, xMax, xMid)
        yMax = Math.max.apply(null, yPoints)
        yMin = Math.min.apply(null, yPoints)
        yMid = yMin + (yMax - yMin)/2
        console.log(yMin, yMax, yMid)

        mymap.flyToBounds([
            [xMin, yMin],
            [xMax, yMax]
        ])
    });
} 


const addBorderAndCenter = (numberCountry) => {
    centerCountryOnMap(numberCountry)
    addCountryToMap(numberCountry)
}