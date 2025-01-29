import bpy
import os

def create_simple_building():
    # Alles löschen
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    # Grundriss erstellen
    bpy.ops.mesh.primitive_cube_add(size=1)
    building = bpy.context.active_object
    building.scale = (10, 8, 15)
    
    # Fenster hinzufügen (vereinfacht)
    for x in [-3, 0, 3]:
        for z in [3, 6, 9]:
            bpy.ops.mesh.primitive_cube_add(location=(x, 4.1, z))
            window = bpy.context.active_object
            window.scale = (1.5, 0.1, 1.5)
    
    # Exportieren
    output_path = os.path.join(os.path.dirname(__file__), '..', 'static', 'models', 'simple_building.glb')
    bpy.ops.export_scene.gltf(filepath=output_path)

if __name__ == "__main__":
    create_simple_building() 