import React, { Component } from 'react';

class ResultsSection extends Component {
    render() {
        const charts = ['bar_chart', 'pie_chart', 'plot_chart', 'scatter_chart'];

        return (
            <div className="card p-4">
                <h2>Results</h2>
                <div className="row">
                    {charts.map(name => (
                        <div key={name} className="col-12 mb-4">
                            <div className="card">
                                <div className="card-body">
                                    <h5>{name.replace('_', ' ').toUpperCase()}</h5>
                                    <img
                                        src={`/charts/${name}.png?t=${Date.now()}`}
                                        alt={name}
                                        className="w-100"
                                        style={{ objectFit: 'contain' }}
                                        onError={(e) => e.target.style.display = 'none'}
                                    />
                                    <a href={`/charts/${name}.png`} download className="btn btn-outline-primary w-100 mt-2">
                                        Download
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-3">
                    <h3>Download Files</h3>
                    <a href="/documents/model_results.csv" download className="btn btn-success me-2">Model CSV</a>
                    <a href="/documents/validation_results.csv" download className="btn btn-success">Validation CSV</a>
                </div>
            </div>
        );
    }
}

export default ResultsSection;