# EVALARM SOS Platform - Entwickler-Dokumentation

## Wichtige Architektur-Entscheidungen

### Three.js Integration mit Vue 3

Bei der Integration von Three.js mit Vue 3 müssen einige wichtige Punkte beachtet werden:

1. **Reaktivitätsprobleme**: Three.js-Objekte dürfen nicht reaktiv sein
   ```javascript
   // FALSCH - führt zu Fehlern:
   data() {
       return {
           scene: new THREE.Scene()  // Nicht machen!
       }
   }

   // RICHTIG - Composition API mit nicht-reaktivem Engine-Objekt:
   setup() {
       const engine = {
           scene: null,
           camera: null
       };
       // Three.js-Objekte nur in engine speichern
   }
   ```

2. **DOM-Referenzen**: Für Container-Referenzen shallowRef verwenden
   ```javascript
   import { shallowRef } from 'vue';
   
   setup() {
       const container = shallowRef(null);
       // ...
   }
   ```

3. **Cleanup**: Wichtig für Speicherlecks-Vermeidung
   ```javascript
   onBeforeUnmount(() => {
       // Animation Frame aufräumen
       cancelAnimationFrame(engine.animationFrame);
       
       // Renderer aufräumen
       engine.renderer.dispose();
       engine.renderer.domElement.remove();
       
       // Controls aufräumen
       engine.controls.dispose();
       
       // Referenzen löschen
       Object.keys(engine).forEach(key => engine[key] = null);
   });
   ```

### Komponenten-Struktur

1. **3D-Basis-Komponente**: `Scene3D.js`
   - Wiederverwendbare Grundfunktionalität
   - Handhabt Three.js-Setup und Lifecycle
   - Emittiert Events für spezifische Implementierungen

2. **Spezifische 3D-Komponenten**: z.B. `ModelViewer.js`
   - Erben von Scene3D
   - Implementieren spezifische Funktionalität
   - Nutzen Events von Scene3D

## Bekannte Probleme & Lösungen

1. **modelViewMatrix Fehler**
   ```
   TypeError: 'get' on proxy: property 'modelViewMatrix' is a read-only...
   ```
   Lösung: Three.js-Objekte außerhalb von Vue's Reaktivitätssystem halten

2. **Memory Leaks**
   - Immer `dispose()` für Three.js-Objekte aufrufen
   - Animation Frames aufräumen
   - Event Listener entfernen

## Best Practices

1. **Three.js-Initialisierung**
   ```javascript
   // Engine-Objekt für alle Three.js-Referenzen
   const engine = {
       scene: null,
       camera: null,
       renderer: null,
       controls: null,
       animationFrame: null
   };
   ```

2. **Event Handling**
   ```javascript
   // Events für spezifische Implementierungen
   emit('scene-ready', {
       scene: engine.scene,
       camera: engine.camera,
       renderer: engine.renderer,
       controls: engine.controls
   });
   ```

3. **Ressourcen-Management**
   - Texturen und Geometrien wiederverwenden
   - dispose() für nicht mehr benötigte Ressourcen
   - WeakMaps für Objekt-Referenzen

## Module & Dependencies

- Three.js: Version 0.160.0
- Vue: Version 3.x (ESM Build)
- OrbitControls aus Three.js/examples
- GLTFLoader für 3D-Modelle

## Entwicklungs-Setup

1. **Development Build**
   ```bash
   npm run dev
   ```

2. **Production Build**
   ```bash
   npm run build
   ```

## Debugging

1. **Three.js Inspector**
   - Chrome Extension für Three.js debugging
   - Scene Graph Visualisierung
   - Performance Monitoring

2. **Performance**
   - Stats.js für FPS-Monitoring
   - Chrome DevTools Performance Panel
   - Memory Leaks in Vue DevTools prüfen

## Wartung & Updates

1. **Three.js Updates**
   - Breaking Changes prüfen
   - Renderer-Optionen können sich ändern
   - Immer CHANGELOG prüfen

2. **Vue Integration**
   - Composition API bevorzugen
   - Reaktivität minimieren
   - Lifecycle-Hooks beachten 