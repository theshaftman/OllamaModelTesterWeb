import React, { Component } from 'react';
import axios from 'axios';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import FormSection from './components/sections/FormSection';
import ResultsSection from './components/sections/ResultsSection';
import CredentialsSection from './components/sections/CredentialsSection';

class App extends Component {
    state = {
        originalText: '',
        modelName: '',
        humanText: '',
        humanLabel: '',
        results: null,
        loading: false,
        models: [],
        fields: [],
        error: '',
        columns: { model_results: [], validation_results: [] },
        projectId: '',
        datasetId: '',
        credentialsFile: null,
        dataOptions: {
            importCsv: true,
            exportCsv: true,
            importGbq: false,
            exportGbq: false
        }
    };

    componentDidMount() {
        this.getColumns();
        this.getModels();
    }

    getColumns = async () => {
        try {
            const res = await axios.get('/api/columns');
            this.setState({ columns: res.data.ollama_columns });
        } catch (err) {
            console.log(err);
        }
    };

    getModels = async () => {
        try {
            const res = await axios.get('/api/models');
            this.setState({ models: res.data.models || [] });
        } catch (err) {
            console.log(err);
        }
    };

    handleSubmit = async (e) => {
        e.preventDefault();
        this.setState({ loading: true, error: '', results: null });

        try {
            const { originalText, modelName, humanText, humanLabel, fields,
                dataOptions, projectId, datasetId  } = this.state;
            const res = await axios.post('/api/compare', {
                original_text: originalText,
                model_name: modelName,
                human_text: humanText,
                human_label: humanLabel,
                selected_fields: fields,
                data_options: dataOptions,
                project_id: projectId,
                dataset_id: datasetId
            });
            this.setState({ results: res.data.compared_models });
        } catch (err) {
            this.setState({ error: 'Something went wrong' });
        } finally {
            this.setState({ loading: false });
        }
    };

    handleChange = (key, value) => {
        this.setState({ [key]: value });
    };

    handleFields = (fields) => {
        this.setState({ fields });
    };

    handleFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const data = new FormData();
        data.append('file', file);

        try {
            const res = await axios.post('/api/upload-pdf', data);
            this.setState({ originalText: res.data.text });
        } catch (err) {
            this.setState({ error: 'Upload failed' });
        }
    };

    
    handleCredentialsFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        this.setState({ credentialsFile: file });

        // Read the file
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target.result);
                console.log('Credentials loaded:', json);
                // You can extract project_id from the file if needed
            } catch (err) {
                this.setState({ error: 'Invalid JSON file' });
            }
        };
        reader.readAsText(file);
    };

    handleCredentialsSubmit = async (e) => {
        e.preventDefault();
        const { credentialsFile } = this.state;

        if (!credentialsFile) {
            this.setState({ error: 'Please upload credentials.json' });
            return;
        }

        this.setState({ loading: true, error: '' });

        try {
            const formData = new FormData();
            formData.append('file', credentialsFile);

            const res = await axios.post('/api/upload-credentials', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            console.log('Credentials saved:', res.data);
            this.setState({ error: '' });
            alert('Credentials saved successfully!');
        } catch (err) {
            this.setState({ error: 'Failed to save credentials' });
        } finally {
            this.setState({ loading: false });
        }
    };
    
    handleDataOptions = (options) => {
        this.setState({ dataOptions: options });
    };


    render() {
        const { originalText, modelName, humanText, humanLabel, results, 
            loading, models, fields, error, columns, 
            projectId, datasetId, credentialsFile, dataOptions } = this.state;

        return (
            <div>
                <Header />
                <div className="container">
                    <div className="row">
                        <div className="col-10 mx-auto">
                            <CredentialsSection
                                projectId={projectId}
                                datasetId={datasetId}
                                credentialsFile={credentialsFile}
                                loading={loading}
                                error={error}
                                onChange={this.handleChange}
                                onCredentialsFile={this.handleCredentialsFile}
                                onCredentialsSubmit={this.handleCredentialsSubmit}
                            />

                            <FormSection
                                originalText={originalText}
                                modelName={modelName}
                                humanText={humanText}
                                humanLabel={humanLabel}
                                models={models}
                                fields={fields}
                                loading={loading}
                                error={error}
                                columns={columns}
                                onChange={this.handleChange}
                                onFields={this.handleFields}
                                onFile={this.handleFile}
                                dataOptions={dataOptions}
                                onDataOptionsChange={this.handleDataOptions}
                                onSubmit={this.handleSubmit}
                            />
                            {results && <ResultsSection />}
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }
}

export default App;