import React, { Component } from 'react';

class CredentialsSection extends Component {
    render() {
        const {
            credentialsFile,
            loading, 
            error,
            onCredentialsFile,
            onCredentialsSubmit
        } = this.props;

        return (
            <div className="card p-4 mb-4 bg-light">
                <h4 className="mb-3">Google BigQuery Credentials</h4>
                <form onSubmit={onCredentialsSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Upload credentials.json</label>
                        <input
                            type="file"
                            accept=".json"
                            className="form-control"
                            onChange={onCredentialsFile}
                            required
                        />
                        <small className="text-muted">
                            Upload your Google service account credentials JSON file
                        </small>
                        {credentialsFile && (
                            <div className="mt-2 text-success">
                                File loaded: {credentialsFile.name}
                            </div>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        className="btn btn-success w-100"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Save Credentials'}
                    </button>

                    {error && <div className="alert alert-danger mt-3">{error}</div>}
                </form>
            </div>
        );
    }
}

export default CredentialsSection;