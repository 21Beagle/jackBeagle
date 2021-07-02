const countries = require("./js/countryBorders.geo.json");

const getCountryName = (numberCountry) => {
    return countries["features"][numberCountry]["properties"]["name"]
}

const getCountryBorder = (numberCountry) => {
    return countries["features"][numberCountry]["geometry"]["coordinates"]
}

console.log(getCountryName(0))