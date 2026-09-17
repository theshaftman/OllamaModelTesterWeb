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

HOST = '0.0.0.0'
PORT = 3001
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
DOCUMENTS_DIR = os.path.join(BACKEND_DIR, 'documents')
CHARTS_DIR = os.path.join(BACKEND_DIR, 'charts')
CREDENTIALS_DIR = os.path.join(BACKEND_DIR, 'credentials')

OLLAMA_HOST = os.getenv('OLLAMA_HOST', '127.0.0.1')
OLLAMA_PORT = int(os.getenv('OLLAMA_PORT', '11434'))


def remove_folder(path) -> None:
    for root, dirs, files in os.walk(path, topdown=False):
        for file in files:
            os.remove(os.path.join(root, file))
        for dir in dirs:
            if (os.path.exists(os.path.join(root, dir))):
                os.rmdir(os.path.join(root, dir))
    if (os.path.exists(path)):
        os.rmdir(path)
    print(f'Folder "{path}" and its content is removed.')

def create_folder(path) -> None:
    os.makedirs(path, exist_ok=True)
    print(f'Folder "{path}" is created')


# remove_folder(CHARTS_DIR)
# remove_folder(CREDENTIALS_DIR)

create_folder(DOCUMENTS_DIR)
create_folder(CHARTS_DIR)
create_folder(CREDENTIALS_DIR)

ollama_service = None

def start_ollama():
    global ollama_service

    print(f"Connecting to Ollama: {OLLAMA_HOST}:{OLLAMA_PORT}")

    ollama_service = omt.OllamaModelTester(
        host=OLLAMA_HOST,
        port=OLLAMA_PORT,
        install_packages=True,
        show_figure=False,
        is_libraries_exec_requested = False,    # install pip packages internal without requirements.txt
        install_requirements_txt = False,      # install pip packages from requirements.txt
        cmd_timeout = 300,
        os_path = os.path.dirname(os.path.abspath(__file__))
    )

    ollama_service.__enter__()
    print("OllamaModelTester started.")
    return ollama_service

def get_ollama():
    if (ollama_service is None):
        raise HTTPException(
            status_code=503,
            detail='Ollama service is not working'
        )

    return ollama_service

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=False,
    allow_methods=['*'],
    allow_headers=['*']
)

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

# Mount static directories
app.mount('/documents', StaticFiles(directory=DOCUMENTS_DIR), name='documents')
app.mount('/charts', StaticFiles(directory=CHARTS_DIR), name='charts')

# Set our services
file_service = FileService()

# Set routes
@app.get('/')
async def home():
    return {
        'server': 'running',
        'url': f'{HOST}:{PORT}'
    }

@app.get('/health')
def health():
    service = get_ollama()
    return {
        'status': 'ok',
        'ollama_ready': service is not None,
        'ollama_host': OLLAMA_HOST,
        'ollama_port': OLLAMA_PORT
    }

@app.get('/api/columns')
async def get_columns():
    service = get_ollama()
    columns_data = service.extract_columns()
    return {
        'ollama_columns': columns_data
    }

@app.get('/api/models')
async def get_models():
    service = get_ollama()
    models = service.models if service.models else []
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

        service = get_ollama()

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
            service.import_results_from_csv()
        if (data_options.get('importGbq', True)):
            service.import_results_from_gbq(project_id=project_id, dataset_id=dataset_id)

        if (original_text and human_text and human_label):
            service.validate_evaluator(
                prompt_text=original_text,
                generated_text=human_text,
                human_label=human_label
            )

        # Models
        compared_models = []
        if (original_text and len(model.strip()) > 0):
            var_models = f'{model}'.replace(' ', '').split(',')
            service.pull_models(var_models)
            compared_models = service.compare_models(prompt_text=original_text)

        # Create visualizations
        service.visualize_results(plot_type='bar', metrics=metrics, savefig_path=f'charts/bar_chart.png', max_cols_per_row=2)
        service.visualize_results(plot_type='plot', metrics=metrics, savefig_path=f'charts/plot_chart.png', max_cols_per_row=2)
        service.visualize_results(plot_type='scatter', metrics=metrics, savefig_path=f'charts/scatter_chart.png', max_cols_per_row=2)
        service.visualize_results(plot_type='pie', metrics=metrics, savefig_path=f'charts/pie_chart.png', max_cols_per_row=2)

        # Export data
        if (data_options.get('exportCsv', True)):
            service.export_results_to_csv()
        if (data_options.get('exportGbq', True)):
            service.export_results_to_gqb(project_id=project_id, dataset_id=dataset_id)

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
    ollama_context = None
    try:
        ollama_context = start_ollama()
        uvicorn.run(app=app, host=HOST, port=PORT, log_level='info')
    except Exception as e:
        print(f'Exception thrown: {str(e)}')
        raise
    finally:
        if ollama_context:
            ollama_context.__exit__(None, None, None)
