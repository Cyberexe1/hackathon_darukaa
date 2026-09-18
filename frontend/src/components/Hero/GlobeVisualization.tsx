import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ProjectSite {
  lat: number;
  lon: number;
  label: string;
}

const PROJECT_SITES: ProjectSite[] = [
  { lat: 14.5, lon: 75.5, label: 'Western Ghats, India' },
  { lat: -3.4, lon: -62.2, label: 'Amazon Basin, Brazil' },
  { lat: 0.5, lon: 25.1, label: 'Congo Basin' },
  { lat: -2.5, lon: 114.0, label: 'Kalimantan Peatland' },
  { lat: 45.3, lon: -121.7, label: 'Cascadia Carbon Canopy' },
  { lat: -18.2, lon: 147.5, label: 'Queensland Coastal' },
];

function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

/**
 * Interactive 3D Earth geospatial scene, ported from the Stitch design's
 * inline Three.js globe (see STITCH_THREEJS_START:ANIMATION_2 in the
 * original code.html). Renders a rotating planet with a geospatial dot
 * matrix, glowing project-site beacons, connecting arcs, and a subtle
 * atmospheric glow — driven by mouse movement for gentle parallax.
 */
export function GlobeVisualization() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 640;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 240);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const earthGroup = new THREE.Group();
    earthGroup.rotation.x = 0.25;
    scene.add(earthGroup);

    // Core sphere
    const coreGeo = new THREE.SphereGeometry(76, 64, 64);
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0x0c1c17,
      emissive: 0x05130f,
      specular: 0x1e4d3a,
      shininess: 35,
      transparent: true,
      opacity: 0.95,
    });
    earthGroup.add(new THREE.Mesh(coreGeo, coreMat));

    // Lat/long wireframe
    const wireGeo = new THREE.SphereGeometry(77, 36, 18);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x1b4332,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    });
    earthGroup.add(new THREE.Mesh(wireGeo, wireMat));

    // Geospatial dot matrix
    const dotCount = 1200;
    const dotGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(dotCount * 3);
    const colors = new Float32Array(dotCount * 3);
    const radius = 77.5;

    const primaryCol = new THREE.Color(0x2d6a4f);
    const emeraldCol = new THREE.Color(0x10b981);
    const cyanCol = new THREE.Color(0x34d399);

    for (let i = 0; i < dotCount; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const r = radius + (Math.sin(phi * 8) * Math.cos(theta * 8) > 0 ? 0.8 : 0);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const chosenCol =
        Math.random() > 0.65 ? emeraldCol : Math.random() > 0.4 ? cyanCol : primaryCol;
      colors[i * 3] = chosenCol.r;
      colors[i * 3 + 1] = chosenCol.g;
      colors[i * 3 + 2] = chosenCol.b;
    }

    dotGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    dotGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const dotMat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    earthGroup.add(new THREE.Points(dotGeo, dotMat));

    // Project site beacons, rings, spikes, arcs
    const markerMeshes: { beacon: THREE.Mesh; ring: THREE.Mesh }[] = [];
    const projectPositions: THREE.Vector3[] = [];

    PROJECT_SITES.forEach((site) => {
      const pos = latLonToVector3(site.lat, site.lon, 79);
      projectPositions.push(pos);

      const ringGeo = new THREE.RingGeometry(1.5, 2.5, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(pos);
      ringMesh.lookAt(0, 0, 0);
      earthGroup.add(ringMesh);

      const beaconGeo = new THREE.SphereGeometry(1.2, 16, 16);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      beaconMesh.position.copy(pos);
      earthGroup.add(beaconMesh);

      const spikePos = pos.clone().multiplyScalar(1.08);
      const spikeGeo = new THREE.BufferGeometry().setFromPoints([pos, spikePos]);
      const spikeMat = new THREE.LineBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.8,
      });
      earthGroup.add(new THREE.Line(spikeGeo, spikeMat));

      markerMeshes.push({ beacon: beaconMesh, ring: ringMesh });
    });

    for (let i = 0; i < projectPositions.length; i++) {
      const p1 = projectPositions[i];
      const p2 = projectPositions[(i + 1) % projectPositions.length];

      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      const distance = p1.distanceTo(p2);
      mid.normalize().multiplyScalar(78 + distance * 0.28);

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const points = curve.getPoints(50);
      const curveGeo = new THREE.BufferGeometry().setFromPoints(points);
      const curveMat = new THREE.LineBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.45,
      });
      earthGroup.add(new THREE.Line(curveGeo, curveMat));
    }

    // Atmospheric glow shader
    const atmosGeo = new THREE.SphereGeometry(83, 64, 64);
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
          gl_FragColor = vec4(0.062, 0.725, 0.505, 1.0) * intensity * 0.75;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    earthGroup.add(new THREE.Mesh(atmosGeo, atmosMat));

    // Lighting
    const dirLight = new THREE.DirectionalLight(0xe8f5e9, 2.2);
    dirLight.position.set(150, 100, 120);
    scene.add(dirLight);
    scene.add(new THREE.AmbientLight(0x071d16, 1.6));
    const backLight = new THREE.DirectionalLight(0x10b981, 1.0);
    backLight.position.set(-150, -100, -80);
    scene.add(backLight);

    // Mouse interactivity (skipped when reduced motion is preferred)
    let mouseX = 0;
    let mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.4;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.3;
    };
    if (!prefersReducedMotion) {
      window.addEventListener('mousemove', onMouseMove);
    }

    const clock = new THREE.Clock();
    let targetRotationY = 0;
    let frameId: number;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      if (!prefersReducedMotion) {
        targetRotationY += 0.0035;
        earthGroup.rotation.y += (targetRotationY + mouseX - earthGroup.rotation.y) * 0.06;
        earthGroup.rotation.x += (0.22 + mouseY - earthGroup.rotation.x) * 0.06;

        markerMeshes.forEach((item, idx) => {
          const pulse = 1.0 + Math.sin(time * 3 + idx * 1.2) * 0.25;
          item.ring.scale.set(pulse, pulse, pulse);
          item.beacon.scale.set(0.9 + pulse * 0.2, 0.9 + pulse * 0.2, 0.9 + pulse * 0.2);
        });
      } else {
        earthGroup.rotation.y = 0.4;
      }

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const newWidth = container.clientWidth || 640;
      const newHeight = container.clientHeight || 640;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      renderer.dispose();
      dotGeo.dispose();
      dotMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      atmosGeo.dispose();
      atmosMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-transparent"
      role="img"
      aria-label="Rotating 3D globe showing Darukaa.Earth monitored project sites across the world, including the Western Ghats, Amazon Basin, Congo Basin, Kalimantan, Cascadia, and Queensland"
    />
  );
}
