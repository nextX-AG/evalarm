from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
import shutil

router = APIRouter()

@router.post("/upload-model")
async def upload_model(model: UploadFile = File(...)):
    try:
        # Erstelle Upload-Verzeichnis falls nicht vorhanden
        upload_dir = Path("static/models")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Speichere Datei
        file_path = upload_dir / model.filename
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(model.file, buffer)
        
        return {
            "modelUrl": f"/static/models/{model.filename}",
            "message": "Upload erfolgreich"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) 