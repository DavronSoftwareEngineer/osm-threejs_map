import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { ExtrudeBufferGeometry } from "three";

const ThreeDMap = () => {
  const mountRef = useRef(null);
  console.log(ExtrudeBufferGeometry);

  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    const camera = new THREE.PerspectiveCamera(
      25,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    camera.position.set(8, 4, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xfafafa, 0.25);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xfafafa, 0.8);
    pointLight1.position.set(200, 300, 400);
    scene.add(pointLight1);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.maxDistance = 800;
    controls.minDistance = 10;

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
      controls.update();
    };

    fetch("/data/nestone.geojson")
      .then((response) => response.json())
      .then((data) => {
        loadBuildings(data, scene);
      })
      .catch((error) => console.error("Error loading GeoJSON data:", error));

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      controls.dispose();
      scene.clear();
    };
  }, []);

  const loadBuildings = (geojsonData, scene) => {
    const features = geojsonData.features;
    features.forEach((feature) => {
      if (feature.properties && feature.properties["building"]) {
        const height = feature.properties["building:levels"]
          ? feature.properties["building:levels"] * 3
          : 10;
        const coordinates = feature.geometry.coordinates[0]; // Assuming polygon coordinates [0] for simplicity
        const mesh = createBuildingMesh(coordinates, height, scene);
        scene.add(mesh);
      }
    });
  };

  const createBuildingMesh = (coordinates, height) => {
    const shape = new THREE.Shape();
    coordinates.forEach((coord, index) => {
      const [x, y] = convertCoords(coord);
      if (index === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    });

    const extrudeSettings = {
      steps: 1,
      depth: height,
      bevelEnabled: false,
    };

    const geometry = new ExtrudeBufferGeometry(shape, extrudeSettings);
    const material = new THREE.MeshPhongMaterial({ color: 0x787878 });
    return new THREE.Mesh(geometry, material);
  };

  const convertCoords = (coords) => {
    const [longitude, latitude] = coords;
    // This is a very simple projection and may need to be adjusted for your use case
    const x = (longitude + 180) * (100 / 360);
    const y = (90 - latitude) * (100 / 180);
    return [x, y];
  };

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
};

export default ThreeDMap;
