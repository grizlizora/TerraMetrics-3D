import * as THREE from 'three';
const camera = new THREE.PerspectiveCamera(45, 1920/1080, 1000, 50000000);
camera.position.set(0,0,0);
camera.updateMatrixWorld();

const centerPos = new THREE.Vector3(0, 0, -2348100);
const radius3D = 696340;
const multiplier = 2.5;

const rightVector = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
const edgePos = centerPos.clone().add(rightVector.multiplyScalar(radius3D * multiplier));

const centerProj = centerPos.project(camera);
const edgeProj = edgePos.project(camera);

const halfWidth = 1920/2;
const halfHeight = 1080/2;

const cPx = (centerProj.x * halfWidth) + halfWidth;
const cPy = -(centerProj.y * halfHeight) + halfHeight;
const ePx = (edgeProj.x * halfWidth) + halfWidth;
const ePy = -(edgeProj.y * halfHeight) + halfHeight;

const screenRadius = Math.sqrt(Math.pow(cPx - ePx, 2) + Math.pow(cPy - ePy, 2));
const hoverRadius = Math.max(150, screenRadius);

console.log("hoverRadius:", hoverRadius);
