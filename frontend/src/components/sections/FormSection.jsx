import React, { Component } from 'react';
import FieldSelector from '../shared/FieldSelector';

class FormSection extends Component {
    toggleOption = (key) => {
        const { dataOptions, onDataOptionsChange } = this.props;
        const newOptions = { ...dataOptions, [key]: !dataOptions[key] };
        onDataOptionsChange(newOptions);
    };

    render() {
        const { originalText, modelName, humanText, humanLabel, models, fields, loading, error, columns, onChange, onFields, onFile, onSubmit, 
            projectId, 
            datasetId, dataOptions
        } = this.props;

        return (
            <div className="card p-4 mb-4">
                <form onSubmit={onSubmit}>
                    
                    <div className="row">
                        <div className="col-6">
                            <div className="mb-3">
                                <label className="form-label">Project ID</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={projectId}
                                    onChange={(e) => onChange('projectId', e.target.value)}
                                    placeholder="Enter Project ID"
                                    
                                />
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="mb-3">
                                <label className="form-label">Dataset ID</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={datasetId}
                                    onChange={(e) => onChange('datasetId', e.target.value)}
                                    placeholder="Enter Dataset ID"
                                    
                                />
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <h4 className="mb-3">Data Import/Export Options</h4>
                        
                        <div className="row">
                            <div className="col-6">
                                <h5 className="mb-3">Import Options</h5>
                                <div className="form-check mb-2">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id="importCsv"
                                        checked={dataOptions.importCsv}
                                        onChange={() => this.toggleOption('importCsv')}
                                    />
                                    <label className="form-check-label" htmlFor="importCsv">
                                        Import from CSV
                                    </label>
                                </div>
                                <div className="form-check mb-2">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id="importGbq"
                                        checked={dataOptions.importGbq}
                                        onChange={() => this.toggleOption('importGbq')}
                                    />
                                    <label className="form-check-label" htmlFor="importGbq">
                                        Import from Google BigQuery
                                    </label>
                                    {dataOptions.importGbq && (
                                        <span className="badge bg-info ms-2">Needs credentials</span>
                                    )}
                                </div>
                            </div>

                            <div className="col-6">
                                <h5 className="mb-3">Export Options</h5>
                                <div className="form-check mb-2">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id="exportCsv"
                                        checked={dataOptions.exportCsv}
                                        onChange={() => this.toggleOption('exportCsv')}
                                    />
                                    <label className="form-check-label" htmlFor="exportCsv">
                                        Export to CSV
                                    </label>
                                </div>
                                <div className="form-check mb-2">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id="exportGbq"
                                        checked={dataOptions.exportGbq}
                                        onChange={() => this.toggleOption('exportGbq')}
                                    />
                                    <label className="form-check-label" htmlFor="exportGbq">
                                        Export to Google BigQuery
                                    </label>
                                    {dataOptions.exportGbq && (
                                        <span className="badge bg-info ms-2">Needs credentials</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-3">
                        <label>Select Model</label>
                        <input
                            type="text"
                            className="form-control"
                            value={modelName}
                            onChange={(e) => onChange('modelName', e.target.value)}
                            placeholder="llama2, mistral, phi"
                            list="models"
                        />
                        <datalist id="models">
                            {models.map(m => <option key={m} value={m} />)}
                        </datalist>
                    </div>

                    <div className="mb-3">
                        <label>Human Text</label>
                        <textarea
                            className="form-control"
                            value={humanText}
                            onChange={(e) => onChange('humanText', e.target.value)}
                            rows={4}
                        />
                    </div>

                    <div className="mb-3">
                        <label>Human Label</label>
                        <select
                            className="form-select"
                            value={humanLabel}
                            onChange={(e) => onChange('humanLabel', e.target.value)}
                        >
                            <option value="">Select</option>
                            <option value="faithful">Faithful</option>
                            <option value="hallucinated">Hallucinated</option>
                        </select>
                    </div>

                    <FieldSelector
                        onFields={onFields}
                        fields={fields}
                        modelFields={columns?.model_results || []}
                        validationFields={columns?.validation_results || []}
                    />

                    <button type="submit" className="btn btn-primary w-100 mt-3" disabled={loading}>
                        {loading ? 'Loading...' : 'Compare'}
                    </button>

                    {error && <div className="alert alert-danger mt-3">{error}</div>}
                </form>
            </div>
        );
    }
}

export default FormSection;