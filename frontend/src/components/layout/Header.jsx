import React, { Component } from 'react';

class Header extends Component {
    render() {
        return (
            <div className="bg-primary text-white py-4 mb-4">
                <div className="container text-center">
                    <h1>Practical Experiment to Compare AI Models</h1>
                    <p>A comprehensive Python framework for testing, evaluating, and visualizing Ollama language models with built-in hallucination detection, performance metrics, and Google BigQuery integration.</p>
                </div>
            </div>
        );
    }
}

export default Header;