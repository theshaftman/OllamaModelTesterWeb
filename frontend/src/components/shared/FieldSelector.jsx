import React, { Component } from 'react';

class FieldSelector extends Component {
    state = {
        selected: this.props.fields || []
    };

    toggle = (key, prefix) => {
        const full = `${prefix}.${key}`;
        this.setState(prev => {
            const newSelected = prev.selected.includes(full)
                ? prev.selected.filter(f => f !== full)
                : [...prev.selected, full];
            this.props.onFields(newSelected);
            return { selected: newSelected };
        });
    };

    selectAll = () => {
        const { modelFields, validationFields } = this.props;
        const all = [
            ...validationFields.map(f => `validation.${f.key}`),
            ...modelFields.map(f => `model_results.${f.key}`)
        ];
        this.setState({ selected: all });
        this.props.onFields(all);
    };

    clearAll = () => {
        this.setState({ selected: [] });
        this.props.onFields([]);
    };

    renderList = (fields, prefix, title) => {
        return (
            <div className="col-6">
                <h5>{title}</h5>
                {fields.map(f => (
                    <div key={f.key} className="form-check">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            checked={this.state.selected.includes(`${prefix}.${f.key}`)}
                            onChange={() => this.toggle(f.key, prefix)}
                        />
                        <label className="form-check-label">
                            {f.label} <span className="badge bg-secondary">{f.type}</span>
                        </label>
                    </div>
                ))}
            </div>
        );
    };

    render() {
        const { modelFields, validationFields } = this.props;
        const { selected } = this.state;

        const typeMap = { object: 'STRING', float64: 'FLOAT', int64: 'INTEGER' };
        const transform = (fields) => fields.map(f => ({ ...f, type: typeMap[f.type] || f.type || 'STRING' }));

        const model = transform(modelFields);
        const validation = transform(validationFields);

        return (
            <div className="border p-3 mb-3">
                <h4>Select Fields</h4>
                <div className="row">
                    {this.renderList(validation, 'validation', 'Validation')}
                    {this.renderList(model, 'model_results', 'Model Results')}
                </div>
                <div className="mt-3">
                    <button className="btn btn-outline-primary me-2" onClick={this.selectAll}>All</button>
                    <button className="btn btn-outline-secondary" onClick={this.clearAll}>Clear</button>
                    <span className="ms-3">Selected: {selected.length}</span>
                </div>
            </div>
        );
    }
}

export default FieldSelector;