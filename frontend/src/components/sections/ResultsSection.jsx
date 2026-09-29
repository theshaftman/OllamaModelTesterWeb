import React, { Component } from 'react';

class ResultsSection extends Component {
    getSentenceClass = (label) => {
        switch(label?.toUpperCase()) {
            case 'ENTAILMENT':
                return 'text-bg-success';
            case 'CONTRADICTION':
                return 'text-bg-danger';
            case 'NEUTRAL':
                return 'text-bg-warning';
            default:
                return '';
        }
    };

    renderSentenceScores = () => {
        const { results } = this.props;
        const sentencesScores = results?.sentence_scores || []
        if (!sentencesScores || !sentencesScores.length) {
            return null;
        }

        return (
            <div className='my-4'>
                <h3>Sentence Scores</h3>

                <div className='d-flex flex-column gap-2'>
                    {sentencesScores.map((item, index) => {
                        const label = item.label;

                        return (
                            <div key={index} className={`p-1 rounded ${this.getSentenceClass(label)}`}>
                                <div className='d-flex flex-wrap gap-3 align-items-center mb-2 small'>
                                    <span className='badge rounded-pill bg-dark'>
                                        {label || 'Unknown'}
                                    </span>
                                    <span>
                                        <strong>Model:</strong> 
                                        <span className='px-2'>{item.model_name || 'Unknown'}</span>
                                    </span>
                                    <span>
                                        <strong>NLI Model:</strong> 
                                        <span className='px-2'>{item.nli_model || 'Unknown'}</span>
                                    </span>
                                    <span>
                                        <strong>Confidence:</strong> 
                                        <span className='px-2'>{item.confidence || 'Unknown'}</span>
                                    </span>
                                </div>
                                <div className='fw-medium'>
                                    {item.sentence}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    };

    render() {
        const charts = ['bar_chart', 'pie_chart', 'plot_chart', 'scatter_chart'];

        return (
            <div className="card p-4">
                {this.renderSentenceScores()}
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
                    <a href="/documents/model_results.csv" download className="btn btn-success mx-1">Model CSV</a>
                    <a href="/documents/validation_results.csv" download className="btn btn-success mx-1">Validation CSV</a>
                    <a href="/documents/sentence_scores.csv" download className="btn btn-success mx-1">NLI Sentence Scores CSV</a>
                </div>
            </div>
        );
    }
}

export default ResultsSection;