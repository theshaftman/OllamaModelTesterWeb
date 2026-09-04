from datetime import datetime
import os
import shutil
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import PyPDF2
import OllamaModelTester as omt


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000', 'http://127.0.0.1:3000'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

HOST = '0.0.0.0'
PORT = 3001
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
DOCUMENTS_DIR = os.path.join(BACKEND_DIR, 'documents')
CHARTS_DIR = os.path.join(BACKEND_DIR, 'charts')
CREDENTIALS_DIR = os.path.join(BACKEND_DIR, 'credentials')

class ComparisonRequest(BaseModel):
    original_text: str
    model_name: str
    human_text: Optional[str] = ''
    human_label: Optional[str] = ''
    selected_fields: List[str] = []
    data_options: Optional[Dict[str, bool]] = {}
    project_id: Optional[str] = ''
    dataset_id: Optional[str] = ''

class ComparisonResponse(BaseModel):
    compared_models: List[Dict[str, Any]] = []
    timestamp: str

class FileService:
    def __init__(self):
        pass
        
    def extract_text_from_pdf(self, pdf_path: str):
        """Extract text from PDF file"""
        try:
            text = ""
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() or ""
            return text
        except Exception as e:
            print(f"Error extracting PDF: {e}")
            return "Error extracting text from PDF"

def remove_folder(path) -> None:
    for root, dirs, files in os.walk(path, topdown=False):
        for file in files:
            os.remove(os.path.join(root, file))
        for dir in dirs:
            os.rmdir(os.path.join(root, dir))

    os.rmdir(path)
    print(f'Folder "{path}" and its content is removed.')

def create_folder(path) -> None:
    os.makedirs(path, exist_ok=True)
    print(f'Folder "{path}" is created')


remove_folder(CHARTS_DIR)
remove_folder(CREDENTIALS_DIR)

create_folder(DOCUMENTS_DIR)
create_folder(CHARTS_DIR)
create_folder(CREDENTIALS_DIR)

# Mount static directories
app.mount('/documents', StaticFiles(directory=DOCUMENTS_DIR), name='documents')
app.mount('/charts', StaticFiles(directory=CHARTS_DIR), name='charts')

# Set our services
ollama_service = None
file_service = FileService()

# Set routes
@app.get('/')
async def home():
    return {
        'server': 'running',
        'url': f'{HOST}:{PORT}'
    }

@app.get('/api/columns')
async def get_columns():
    columns_data = ollama_service.extract_columns()
    return {
        'ollama_columns': columns_data
    }

@app.get('/api/models')
async def get_models():
    models = ollama_service.models if ollama_service.models else []
    return {
        'models': models
    }

@app.post('/api/compare')
async def post_compare(request: ComparisonRequest):
    try:
        timestamp = datetime.now().isoformat()
        original_text = f'{request.original_text}'.strip()
        model = request.model_name
        human_text = request.human_text
        human_label = request.human_label
        selected_fields = request.selected_fields
        data_options = request.data_options
        project_id = request.project_id
        dataset_id = request.dataset_id

        model_fields = []
        validation_fields = []

        for field in selected_fields:
            if (field.startswith('model_results.')):
                model_fields.append(field.replace('model_results.', ''))
            if (field.startswith('validation_results.')):
                validation_fields.append(field.replace('validation_results.', ''))
        metrics = [{
            'data': 'model_results',
            'columns': model_fields
        }, {
            'data': 'validation_results',
            'columns': validation_fields
        }]

        if (data_options.get('importCsv', True)):
            ollama_service.import_results_from_csv()
        if (data_options.get('importGbq', True)):
            ollama_service.import_results_from_gbq(project_id=project_id, dataset_id=dataset_id)

        if (original_text and human_text and human_label):
            ollama_service.validate_evaluator(
                prompt_text=original_text,
                generated_text=human_text,
                human_label=human_label
            )

        # Models
        compared_models = []
        if (original_text and len(model.strip()) > 0):
            var_models = f'{model}'.replace(' ', '').split(',')
            ollama_service.pull_models(var_models)
            compared_models = ollama_service.compare_models(prompt_text=original_text)

        # Create visualizations
        ollama_service.visualize_results(plot_type='bar', metrics=metrics, savefig_path=f'charts/bar_chart.png', max_cols_per_row=2)
        ollama_service.visualize_results(plot_type='plot', metrics=metrics, savefig_path=f'charts/plot_chart.png', max_cols_per_row=2)
        ollama_service.visualize_results(plot_type='scatter', metrics=metrics, savefig_path=f'charts/scatter_chart.png', max_cols_per_row=2)
        ollama_service.visualize_results(plot_type='pie', metrics=metrics, savefig_path=f'charts/pie_chart.png', max_cols_per_row=2)

        # Export data
        if (data_options.get('exportCsv', True)):
            ollama_service.export_results_to_csv()
        if (data_options.get('exportGbq', True)):
            ollama_service.export_results_to_gqb(project_id=project_id, dataset_id=dataset_id)

        return ComparisonResponse(
            compared_models = compared_models,
            timestamp=timestamp
        )
    except Exception as e:
        return HTTPException(status_code=500, detail=f'{str(e)}')

@app.post('/api/upload-credentials')
async def post_upload_credentials(file: UploadFile = File(...)):
    if (not file.filename.endswith('.json')):
        raise HTTPException(status_code=400, detail='Only JSON files allowed')

    try:
        with open(os.path.join(CREDENTIALS_DIR, file.filename), 'wb') as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {
            'filename': file.filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'{str(e)}')

@app.get('/api/download/{file_type}/{file_name}')
async def download_files(file_type: str = None, filename: str = None):
    directory = DOCUMENTS_DIR if file_type == 'csv' else CHARTS_DIR
    file_path = os.path.join(directory, filename)
    media_type = 'text/csv' if file_type == 'csv' else 'image/png'
    return FileResponse(file_path, filename=filename, media_type=media_type)

if __name__ == '__main__':
    with omt.OllamaModelTester(
        host='127.0.0.1',
        port=11434,
        install_packages=True,
        show_figure=False,
        is_libraries_exec_requested = True,    # install pip packages internal without requirements.txt
        install_requirements_txt = False,      # install pip packages from requirements.txt
        cmd_timeout = 120,
        os_path = os.path.dirname(os.path.abspath(__file__))
    ) as om_tester:
        ollama_service = om_tester
        uvicorn.run(app=app, host=HOST, port=PORT, log_level='info')
