"use client";

import React, { useState } from 'react';
import basicAttributesData from '@/data/frame/basicAttributesData.json';

function FilterFramesComponent({ onFilter, loading }) {
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        // Date range
        dateRange: { from: '', to: '' },
        // Price range
        priceRange: { from: '', to: '' },
        // Basic attributes from basicAttributesData.json
        brand: [],
        shape: [],
        material: [],
        sex: [],
        tags: [],
        // Sold status filter
        soldStatus: 'all', // 'all', 'sold', 'not_sold'
        // "Other" option to include values not in the predefined options
        includeOther: {
            brand: false,
            shape: false,
            material: false,
            sex: false,
            tags: false
        }
    });

    const handleCheckboxChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter(item => item !== value)
                : [...prev[field], value]
        }));
    };

    const handleRangeChange = (field, type, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: {
                ...prev[field],
                [type]: value
            }
        }));
    };

    const handleOtherToggle = (field) => {
        setFilters(prev => ({
            ...prev,
            includeOther: {
                ...prev.includeOther,
                [field]: !prev.includeOther[field]
            }
        }));
    };

    const handleSoldStatusChange = (status) => {
        setFilters(prev => ({
            ...prev,
            soldStatus: status
        }));
    };

    const handleSearch = () => {
        const filterParams = {};
        
        // Add range filters
        if (filters.dateRange.from || filters.dateRange.to) {
            filterParams.dateRange = filters.dateRange;
        }
        if (filters.priceRange.from || filters.priceRange.to) {
            filterParams.priceRange = filters.priceRange;
        }

        // Add checkbox filters
        ['brand', 'shape', 'material', 'sex', 'tags'].forEach(field => {
            if (filters[field].length > 0) {
                filterParams[field] = filters[field];
            }
            // Add "other" filter
            if (filters.includeOther[field]) {
                filterParams[`includeOther_${field}`] = true;
            }
        });

        // Add sold status filter
        if (filters.soldStatus !== 'all') {
            filterParams.soldStatus = filters.soldStatus;
        }

        onFilter(filterParams);
    };

    const handleClearAll = () => {
        setFilters({
            dateRange: { from: '', to: '' },
            priceRange: { from: '', to: '' },
            brand: [],
            shape: [],
            material: [],
            sex: [],
            tags: [],
            soldStatus: 'all',
            includeOther: {
                brand: false,
                shape: false,
                material: false,
                sex: false,
                tags: false
            }
        });
        onFilter({});
    };

    const renderCheckboxGroup = (field, options, displayName) => (
        <div className="mb-3">
            <h6 className="fw-bold">{displayName}</h6>
            <div className="row">
                {options.map(option => (
                    <div key={option} className="col-md-4 col-sm-6">
                        <div className="form-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id={`${field}-${option}`}
                                checked={filters[field].includes(option)}
                                onChange={() => handleCheckboxChange(field, option)}
                            />
                            <label className="form-check-label" htmlFor={`${field}-${option}`}>
                                {option}
                            </label>
                        </div>
                    </div>
                ))}
                {/* "Other" option */}
                <div className="col-md-4 col-sm-6">
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id={`${field}-other`}
                            checked={filters.includeOther[field]}
                            onChange={() => handleOtherToggle(field)}
                        />
                        <label className="form-check-label" htmlFor={`${field}-other`}>
                            <span className="text-primary">Other (not listed above)</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderRangeInput = (field, displayName, type = 'number') => (
        <div className="mb-3">
            <h6 className="fw-bold">{displayName}</h6>
            <div className="row">
                <div className="col-md-6">
                    <input
                        type={type}
                        className="form-control"
                        placeholder={`From`}
                        value={filters[field].from}
                        onChange={(e) => handleRangeChange(field, 'from', e.target.value)}
                    />
                </div>
                <div className="col-md-6">
                    <input
                        type={type}
                        className="form-control"
                        placeholder={`To`}
                        value={filters[field].to}
                        onChange={(e) => handleRangeChange(field, 'to', e.target.value)}
                    />
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Filter Toggle Button */}
            <div className="mb-3">
                <button
                    className="btn btn-dark"
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                    <i className={`ms-2 fas fa-chevron-${showFilters ? 'up' : 'down'}`}></i>
                </button>
            </div>

            {/* Collapsible Filter Section */}
            {showFilters && (
                <div className="card mb-4">
                    <div className="card-header">
                        <h5 className="mb-0">Filter Frames</h5>
                    </div>
                    <div className="card-body">
                        {/* Date Range Filter */}
                        <div className="border rounded p-3 mb-3">
                            <h5 className="text-primary mb-3">Date Range</h5>
                            {renderRangeInput('dateRange', 'Creation Date Range', 'date')}
                        </div>

                        {/* Price Range Filter */}
                        <div className="border rounded p-3 mb-3">
                            <h5 className="text-primary mb-3">Price Range</h5>
                            {renderRangeInput('priceRange', 'Price Range (Rs.)', 'number')}
                        </div>

                        {/* Basic Attributes */}
                        <div className="border rounded p-3 mb-3">
                            <h5 className="text-primary mb-3">Basic Attributes</h5>
                            
                            {renderCheckboxGroup('brand', basicAttributesData.brand.options, 'Brand')}
                            {renderCheckboxGroup('shape', basicAttributesData.shape.options, 'Shape')}
                            {renderCheckboxGroup('material', basicAttributesData.material.options, 'Material')}
                            {renderCheckboxGroup('sex', basicAttributesData.sex.options, 'Sex')}
                            {renderCheckboxGroup('tags', basicAttributesData.tags.options, 'Tags')}
                        </div>

                        {/* Sold Status Filter */}
                        <div className="border rounded p-3 mb-3">
                            <h5 className="text-primary mb-3">Availability Status</h5>
                            <div className="row">
                                <div className="col-md-4">
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="soldStatus"
                                            id="all-status"
                                            checked={filters.soldStatus === 'all'}
                                            onChange={() => handleSoldStatusChange('all')}
                                        />
                                        <label className="form-check-label" htmlFor="all-status">
                                            All Frames
                                        </label>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="soldStatus"
                                            id="not-sold-status"
                                            checked={filters.soldStatus === 'not_sold'}
                                            onChange={() => handleSoldStatusChange('not_sold')}
                                        />
                                        <label className="form-check-label" htmlFor="not-sold-status">
                                            Available (Not Sold)
                                        </label>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="soldStatus"
                                            id="sold-status"
                                            checked={filters.soldStatus === 'sold'}
                                            onChange={() => handleSoldStatusChange('sold')}
                                        />
                                        <label className="form-check-label" htmlFor="sold-status">
                                            Sold Out
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="text-center">
                            <button
                                type="button"
                                className="btn btn-dark me-2"
                                onClick={handleSearch}
                                disabled={loading}
                            >
                                {loading ? 'Searching...' : 'Apply Filters'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleClearAll}
                                disabled={loading}
                            >
                                Clear All
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default FilterFramesComponent;
