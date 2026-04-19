

function extractLatLong(gisCoordinate) {
    if (!gisCoordinate) return { latitude: null, longitude: null };
    const match = gisCoordinate.match(/\(([-\d.]+),([-\d.]+)\)/);
    if (match) {
        return {
            longitude: parseFloat(match[1]),
            latitude: parseFloat(match[2])
        };
    }
    return { latitude: null, longitude: null };
}



const processedData = data.map(spot => {
    const { latitude, longitude } = extractLatLong(spot['GIS Coordinate']);
    return {
        ...spot,
        latitude,
        longitude,
        'Parking Spaces': parseInt(spot['Parking Spaces'], 10) || 0,
        'Handicap Parking Spaces': parseInt(spot['Handicap Parking Spaces'], 10) || 0,
        'Total Spaces': (parseInt(spot['Parking Spaces'], 10) || 0) + (parseInt(spot['Handicap Parking Spaces'], 10) || 0)
    };
});


const validData = processedData.filter(spot =>
    spot.latitude && spot.longitude && spot['Park Name']
);


const finalData = validData.map(({
    'Parking Lot Asset ID': id,
    'Park Name': name,
    'Total Spaces': totalSpaces,
    'Parking Spaces': regularSpaces,
    'Handicap Parking Spaces': handicapSpaces,
    latitude,
    longitude,
    Access: access
}) => ({
    id,
    name,
    totalSpaces,
    regularSpaces,
    handicapSpaces,
    latitude,
    longitude,
    access
}));


const jsonData = JSON.stringify(finalData, null, 2);
