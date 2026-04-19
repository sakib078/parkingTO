
function degToRad(degrees) {

    const redians = [];

    if (degrees) {

        for (const dg of degrees) {

            let dr = dg * (Math.PI / 180);

            redians.push(dr);
        }

        return redians;
    }

    return Error('No degrees got...');

}



// calculate the distance between coordinate-1 to coordinate-2.
function harvensine(lat1, long1, lat2, long2) {

    const earth_radius = 6371;

    let redian = degToRad([lat1, long1, lat2, long2]);

    // haversine formula 
    let dlat = redian.at(2) - redian.at(0);
 
    let dlong = redian.at(3) - redian.at(1);
 

    let a = ( Math.sin(dlat / 2) ** 2 ) + Math.cos(redian.at(0)) * Math.cos(redian.at(2)) * ( Math.sin(dlong / 2) ** 2 );
   

    let c = 2 * Math.asin(Math.sqrt(a));
    

    let km = Math.round(earth_radius * c * 100) / 100;

    return km

}


const nearestSpot = (coordinates , spots) => {
  
    let let1 = coordinates[0];
    let long1 = coordinates[1];

    let allspots = spots.map( spot => {
        
       let distance = harvensine(let1, long1, spot.latitude , spot.longitude);

       return { ...spot, distance: distance }
        
    })
    
    allspots.sort((a, b) => a.distance - b.distance);

    const top05 = allspots.slice(0, 5)   

    return top05;
}



export default nearestSpot;