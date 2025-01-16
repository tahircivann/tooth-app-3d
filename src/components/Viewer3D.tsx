import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { useToast } from './ui/use-toast';
import { Slider } from './ui/slider';

interface Point {
  position: THREE.Vector3;
  marker: THREE.Mesh;
}

interface Note {
  position: THREE.Vector3;
  text: string;
  sprite: THREE.Sprite;
}

interface MeasurementLine {
  line: THREE.Line;
  label: THREE.Sprite;
}

interface MarginLine {
  points: THREE.Vector3[];
  line: THREE.Line;
}

interface Viewer3DProps {
  stlFile: File | null;
  mode: 'view' | 'pick' | 'measure' | 'push' | 'smooth' | 'scale' | 'margin' | 'occlusal' | 'section' | 'note';
}

const createDistanceLabel = (distance: number, position: THREE.Vector3): THREE.Sprite => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return new THREE.Sprite();
  
  canvas.width = 256;
  canvas.height = 128;
  
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  context.font = '24px Arial';
  context.fillStyle = '#000000';
  context.textAlign = 'center';
  context.fillText(`${distance.toFixed(2)} units`, canvas.width / 2, canvas.height / 2);
  
  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);
  
  sprite.position.copy(position);
  sprite.scale.set(0.5, 0.25, 1);
  
  return sprite;
};

const createNoteLabel = (text: string, position: THREE.Vector3): THREE.Sprite => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return new THREE.Sprite();
  
  canvas.width = 256;
  canvas.height = 128;
  
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  context.font = '16px Arial';
  context.fillStyle = '#000000';
  context.textAlign = 'center';
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  
  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);
  
  sprite.position.copy(position);
  sprite.scale.set(1, 0.5, 1);
  
  return sprite;
};

const Viewer3D = ({ stlFile, mode }: Viewer3DProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const activeMeshRef = useRef<THREE.Mesh | null>(null);
  const [measureStartPoint, setMeasureStartPoint] = useState<Point | null>(null);
  const [measureLine, setMeasureLine] = useState<MeasurementLine | null>(null);
  const [marginLine, setMarginLine] = useState<MarginLine | null>(null);
  const [marginPoints, setMarginPoints] = useState<THREE.Vector3[]>([]);
  const { toast } = useToast();
  const [crossSectionValue, setCrossSectionValue] = useState(0);
  const crossSectionPlaneRef = useRef<THREE.Plane | null>(null);
  const planeHelperRef = useRef<THREE.PlaneHelper | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);

  // Scene setup
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      renderer.dispose();
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      scene.clear();
    };
  }, []);

  const applyDeformation = (point: THREE.Vector3, radius: number = 1, strength: number = 0.5) => {
    if (!activeMeshRef.current) return;

    const geometry = activeMeshRef.current.geometry;
    const position = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    const normal = new THREE.Vector3();

    for (let i = 0; i < position.count; i++) {
      vertex.fromBufferAttribute(position, i);
      const distance = vertex.distanceTo(point);

      if (distance < radius) {
        const influence = 1 - (distance / radius);
        
        switch (mode) {
          case 'push':
            // Push vertices along their normals
            normal.fromBufferAttribute(geometry.attributes.normal, i);
            vertex.add(normal.multiplyScalar(strength * influence));
            break;
          
          case 'smooth':
            // Average position with neighbors
            const neighbors = findNeighborVertices(i, geometry);
            const avgPosition = calculateAveragePosition(neighbors, position);
            vertex.lerp(avgPosition, strength * influence);
            break;
          
          case 'scale':
            // Scale from center point
            vertex.sub(point).multiplyScalar(1 + (strength * influence)).add(point);
            break;
        }

        position.setXYZ(i, vertex.x, vertex.y, vertex.z);
      }
    }

    position.needsUpdate = true;
    geometry.computeVertexNormals();
  };

  const findNeighborVertices = (vertexIndex: number, geometry: THREE.BufferGeometry) => {
    // Simple neighbor finding based on distance
    const neighbors: number[] = [];
    const position = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    const neighborVertex = new THREE.Vector3();
    
    vertex.fromBufferAttribute(position, vertexIndex);
    
    for (let i = 0; i < position.count; i++) {
      if (i !== vertexIndex) {
        neighborVertex.fromBufferAttribute(position, i);
        if (vertex.distanceTo(neighborVertex) < 0.1) { // Adjust threshold as needed
          neighbors.push(i);
        }
      }
    }
    
    return neighbors;
  };

  const calculateAveragePosition = (indices: number[], position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute) => {
    const avg = new THREE.Vector3();
    indices.forEach(index => {
      const vertex = new THREE.Vector3();
      vertex.fromBufferAttribute(position as THREE.BufferAttribute, index);
      avg.add(vertex);
    });
    if (indices.length > 0) {
      avg.divideScalar(indices.length);
    }
    return avg;
  };

  const createMarginLine = (points: THREE.Vector3[]) => {
    if (points.length < 2 || !sceneRef.current) return;

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const line = new THREE.Line(geometry, material);
    
    if (marginLine) {
      sceneRef.current.remove(marginLine.line);
    }
    
    sceneRef.current.add(line);
    setMarginLine({ points, line });
  };

  const performOcclusalAnalysis = (point: THREE.Vector3) => {
    if (!activeMeshRef.current) return;

    const geometry = activeMeshRef.current.geometry;
    const position = geometry.attributes.position;
    const colors = new Float32Array(position.count * 3);
    
    for (let i = 0; i < position.count; i++) {
      const vertex = new THREE.Vector3();
      vertex.fromBufferAttribute(position, i);
      const distance = vertex.distanceTo(point);
      
      // Color based on distance (red = close contact, blue = far)
      const color = new THREE.Color();
      color.setHSL(distance < 0.5 ? 0 : 0.6, 1, 0.5);
      
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    (activeMeshRef.current.material as THREE.MeshPhongMaterial).vertexColors = true;
  };

  const createCrossSection = (point: THREE.Vector3, normal: THREE.Vector3) => {
    if (!activeMeshRef.current || !sceneRef.current || !rendererRef.current) return;

    // Remove existing plane helper if it exists
    if (planeHelperRef.current) {
      sceneRef.current.remove(planeHelperRef.current);
    }

    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, point);
    const helper = new THREE.PlaneHelper(plane, 5, 0xffff00); // Size increased to 5
    sceneRef.current.add(helper);
    planeHelperRef.current = helper;
    crossSectionPlaneRef.current = plane;

    // Update material to show cross section
    (activeMeshRef.current.material as THREE.MeshPhongMaterial).clippingPlanes = [plane];
    rendererRef.current.localClippingEnabled = true;
  };

  // Update cross section position based on slider
  useEffect(() => {
    if (mode === 'section' && crossSectionPlaneRef.current && planeHelperRef.current) {
      crossSectionPlaneRef.current.constant = -crossSectionValue;
      // Force a re-render of the scene
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    }
  }, [crossSectionValue, mode]);

  useEffect(() => {
    if (!stlFile || !sceneRef.current) return;

    const loader = new STLLoader();
    const reader = new FileReader();

    reader.onload = (event) => {
      if (!event.target?.result || !sceneRef.current) return;

      try {
        const geometry = loader.parse(event.target.result as ArrayBuffer);
        const material = new THREE.MeshPhongMaterial({
          color: 0x0ea5e9,
          specular: 0x111111,
          shininess: 200,
        });
        const mesh = new THREE.Mesh(geometry, material);
        activeMeshRef.current = mesh;

        // Center the model
        geometry.computeBoundingBox();
        const center = new THREE.Vector3();
        if (geometry.boundingBox) {
          geometry.boundingBox.getCenter(center);
          mesh.position.sub(center);
        }

        // Clear previous model if exists
        sceneRef.current.children.forEach((child) => {
          if (child instanceof THREE.Mesh && !(child as any).isPoint) {
            sceneRef.current?.remove(child);
          }
        });

        sceneRef.current.add(mesh);
      } catch (error) {
        toast({
          title: "Error loading STL file",
          description: "The file might be corrupted or invalid",
          variant: "destructive",
        });
      }
    };

    reader.readAsArrayBuffer(stlFile);
  }, [stlFile, toast]);

  useEffect(() => {
    if (!rendererRef.current?.domElement) return;

    const handleClick = (event: MouseEvent) => {
      if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;

      const canvas = rendererRef.current.domElement;
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

      const intersects = raycaster.intersectObjects(sceneRef.current.children);
      
      if (intersects.length > 0) {
        const intersectionPoint = intersects[0].point;

        switch (mode) {
          case 'push':
          case 'smooth':
          case 'scale':
            applyDeformation(intersectionPoint);
            break;

          case 'margin':
            setMarginPoints([...marginPoints, intersectionPoint]);
            createMarginLine([...marginPoints, intersectionPoint]);
            break;

          case 'occlusal':
            performOcclusalAnalysis(intersectionPoint);
            toast({
              title: "Occlusal Analysis",
              description: "Analysis complete. Red areas indicate close contacts.",
            });
            break;

          case 'section':
            const normal = new THREE.Vector3(0, 1, 0); // Default up vector
            createCrossSection(intersectionPoint, normal);
            setCrossSectionValue(0); // Reset slider when creating new cross section
            toast({
              title: "Cross Section",
              description: "Cross section view created. Use the slider to adjust position.",
            });
            break;

          case 'measure':
            if (!measureStartPoint) {
              const pointGeometry = new THREE.SphereGeometry(0.05);
              const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
              const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
              (pointMesh as any).isPoint = true;
              pointMesh.position.copy(intersects[0].point);
              sceneRef.current.add(pointMesh);
              setMeasureStartPoint({ position: intersects[0].point.clone(), marker: pointMesh });
            } else {
              const pointGeometry = new THREE.SphereGeometry(0.05);
              const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
              const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
              (pointMesh as any).isPoint = true;
              pointMesh.position.copy(intersects[0].point);
              sceneRef.current.add(pointMesh);
              const distance = measureStartPoint.position.distanceTo(intersects[0].point);
              
              // Create measurement line
              const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                measureStartPoint.position,
                intersects[0].point
              ]);
              const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
              const line = new THREE.Line(lineGeometry, lineMaterial);
              
              // Create and position distance label
              const midPoint = new THREE.Vector3().addVectors(
                measureStartPoint.position,
                intersects[0].point
              ).multiplyScalar(0.5);
              const label = createDistanceLabel(distance, midPoint);
              
              if (measureLine) {
                sceneRef.current.remove(measureLine.line);
                sceneRef.current.remove(measureLine.label);
              }
              
              sceneRef.current.add(line);
              sceneRef.current.add(label);
              setMeasureLine({ line, label });

              toast({
                title: "Measurement",
                description: `Distance: ${distance.toFixed(2)} units`,
              });

              // Reset measurement state
              sceneRef.current.remove(measureStartPoint.marker);
              sceneRef.current.remove(pointMesh);
              setMeasureStartPoint(null);
            }
            break;

          case 'pick':
            const pointGeometry = new THREE.SphereGeometry(0.05);
            const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
            (pointMesh as any).isPoint = true;
            pointMesh.position.copy(intersects[0].point);
            sceneRef.current.add(pointMesh);
            break;

          case 'note':
            const noteText = prompt('Enter note for technician:');
            if (noteText && sceneRef.current) {
              const sprite = createNoteLabel(noteText, intersectionPoint);
              sceneRef.current.add(sprite);
              setNotes([...notes, { position: intersectionPoint, text: noteText, sprite }]);
              toast({
                title: "Note Added",
                description: "Note has been placed on the model.",
              });
            }
            break;
        }
      }
    };

    // Update controls based on mode
    if (controlsRef.current) {
      controlsRef.current.enabled = mode === 'view';
    }

    const element = rendererRef.current.domElement;
    element.addEventListener('click', handleClick);

    return () => {
      element.removeEventListener('click', handleClick);
    };
  }, [mode, measureStartPoint, measureLine, marginPoints, notes, toast]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {mode === 'section' && planeHelperRef.current && (
        <div className="absolute bottom-4 left-4 right-4 bg-white p-4 rounded-lg shadow-lg">
          <p className="text-sm mb-2">Adjust Cross Section Position</p>
          <Slider
            value={[crossSectionValue]}
            onValueChange={(value) => setCrossSectionValue(value[0])}
            min={-5}
            max={5}
            step={0.1}
          />
        </div>
      )}
    </div>
  );
};

export default Viewer3D;
