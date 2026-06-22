// Pseudo-test for hover distance
const distToMouse = Math.sqrt(Math.pow(10, 2) + Math.pow(5, 2)); // Example offset of 10px X, 5px Y
console.log(`Mouse is ${distToMouse.toFixed(1)}px from center of planet.`);
console.log(`Is within 25px trigger radius? ${distToMouse < 25}`);
