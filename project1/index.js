
const thisCountryData = (countryNumber, data) => {
    return countryData = data.features[countryNumber]
}

const addCountryNameToMap = (numberCountry, data) => {
        console.log(data.features[numberCountry].properties.name)
        L.geoJSON(myMap, {pointToLayer: function (feature, latlng) {
            return L.circleMarker([xMid, yMid], geojsonMarkerOptions);
        }
        })
        return data.features[numberCountry].properties.name
}

const addCountryToMap = (numberCountry, data) => {
        L.geoJSON(thisCountryData(numberCountry, data), {
            style: function (feature) {
                return {color: "red"};
            }
        }).bindPopup(function (layer) {
            return layer.feature.properties.name;
        }).addTo(myMap);
}

const centerCountryOnMap = (numberCountry, data) => {
        polyType = data.features[numberCountry].geometry.type

        if (polyType == "MultiPolygon"){
            coordinates = data.features[numberCountry].geometry.coordinates
            //loop through all arrays, to get all the x and y coordinates. From there we can find the minimum and the maximum of x and y and then find the mid point
            let xPoints = []
            let yPoints = []
            for (array = 0; array < coordinates.length; array++) {
                border = coordinates[array]
                for (i = 0; i < border.length; i++) {
                    setOfPoints = border[i]
                    for (j = 0; j < setOfPoints.length; j++) {
                        point = setOfPoints[j]
                        xPoints.push(point[1])
                        yPoints.push(point[0])
                    }
                }
            }
            xMin = Math.min.apply(null, xPoints)
            xMax = Math.max.apply(null, xPoints)
            xMid = xMin + (xMax - xMin)/2
            
            yMax = Math.max.apply(null, yPoints)
            yMin = Math.min.apply(null, yPoints)
            yMid = yMin + (yMax - yMin)/2
            
            bounds = [[xMin, yMin], [xMax, yMax]]
        } else {
            coordinates = data.features[numberCountry].geometry.coordinates
            //loop through all arrays, to get all the x and y coordinates. From there we can find the minimum and the maximum of x and y and then find the mid point
            let xPoints = []
            let yPoints = []

            setOfPoints = coordinates[0]
            console.log(coordinates.length)
            for (j = 0; j < setOfPoints.length; j++) {
                    point = setOfPoints[j]
                    xPoints.push(point[1])
                    yPoints.push(point[0])
            }

            xMin = Math.min.apply(null, xPoints)
            xMax = Math.max.apply(null, xPoints)
            xMid = xMin + (xMax - xMin)/2
            
            yMax = Math.max.apply(null, yPoints)
            yMin = Math.min.apply(null, yPoints)
            yMid = yMin + (yMax - yMin)/2
            
            bounds = [[xMin, yMin], [xMax, yMax]]
        }
        myMap.flyToBounds(bounds)
}

const addBorderAndCenter = async (numberCountry) => {
    getCountryData().then(data => {
        centerCountryOnMap(numberCountry, data)
        addCountryToMap(numberCountry, data)
        addCountryNameToMap(numberCountry, data)
    })
}

