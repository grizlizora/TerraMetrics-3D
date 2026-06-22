import * as Astronomy from 'astronomy-engine';

const date = new Date(); // Right now!
console.log(`Current Time: ${date.toISOString()}`);
const astroTime = Astronomy.MakeTime(date);
const stHours = Astronomy.SiderealTime(astroTime);
console.log(`Sidereal Time: ${stHours.toFixed(4)} hours`);

const stRad = (stHours / 24) * Math.PI * 2;
const AU = 2348100;

const bodies = ['Sun', 'Moon', 'Venus', 'Mars', 'Jupiter'];

bodies.forEach(bodyName => {
    const vec = Astronomy.GeoVector(Astronomy.Body[bodyName], astroTime, true);
    
    // Equatorial coords in AU
    // vec.x = Vernal Equinox
    // vec.y = 90 deg East of Vernal Equinox
    // vec.z = North Celestial Pole
    
    const jx = vec.y * AU;
    const jy = vec.z * AU;
    const jz = vec.x * AU;
    
    const geoX = jx * Math.cos(stRad) - jz * Math.sin(stRad);
    const geoZ = jx * Math.sin(stRad) + jz * Math.cos(stRad);
    const geoY = jy;
    
    // Calculate Right Ascension and Declination from GeoVector
    const ra = Math.atan2(vec.y, vec.x) * (180 / Math.PI);
    const raHours = (ra < 0 ? ra + 360 : ra) / 15;
    const dec = Math.asin(vec.z / Math.sqrt(vec.x*vec.x + vec.y*vec.y + vec.z*vec.z)) * (180 / Math.PI);
    
    console.log(`\n--- ${bodyName} ---`);
    console.log(`Real Astro (RA/Dec): RA ${raHours.toFixed(2)}h, Dec ${dec.toFixed(2)} deg`);
    console.log(`J2000 Vector (AU): X=${vec.x.toFixed(4)}, Y=${vec.y.toFixed(4)}, Z=${vec.z.toFixed(4)}`);
    console.log(`Three.js Sim Pos: X=${Math.round(geoX)}, Y=${Math.round(geoY)}, Z=${Math.round(geoZ)}`);
    
    // Distance from Earth
    const distAU = Math.sqrt(vec.x**2 + vec.y**2 + vec.z**2);
    console.log(`Distance: ${distAU.toFixed(4)} AU`);
    
    // Test the 2D hover logic:
    // If we have a camera at distance D on +Z axis looking at (0,0,0)
    // How does geoX, geoY, geoZ project onto the screen?
});
