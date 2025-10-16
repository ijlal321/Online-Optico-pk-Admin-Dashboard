"use client";

import React, { useState } from 'react';

function FilterOrdersComponent({ onFilter, loading }) {
    const [showFilters, setShowFilters] = useState(false);

    // Filter states for each option
    const [specificDateFilter, setSpecificDateFilter] = useState('');
    const [dateRangeFilter, setDateRangeFilter] = useState({
        dateFrom: '',
        dateTo: '',
        priceFrom: '',
        priceTo: ''
    });
    const [orderNumberFilter, setOrderNumberFilter] = useState('');

    // Filter option 1: Specific date
    const handleSpecificDateSearch = () => {
        if (specificDateFilter) {
            onFilter({ specificDate: specificDateFilter });
        }
    };

    // Filter option 2: Date range
    const handleDateRangeSearch = () => {
        const params = {};
        if (dateRangeFilter.dateFrom) params.dateFrom = dateRangeFilter.dateFrom;
        if (dateRangeFilter.dateTo) params.dateTo = dateRangeFilter.dateTo;
        if (dateRangeFilter.priceFrom) params.priceFrom = dateRangeFilter.priceFrom;
        if (dateRangeFilter.priceTo) params.priceTo = dateRangeFilter.priceTo;

        onFilter(params);
    };

    // Filter option 3: Order number
    const handleOrderNumberSearch = () => {
        if (orderNumberFilter.trim()) {
            onFilter({ orderNumber: orderNumberFilter.trim() });
        }
    };

    // Clear all filters and load today's orders
    const handleClearAll = () => {
        setSpecificDateFilter('');
        setDateRangeFilter({
            dateFrom: '',
            dateTo: '',
            priceFrom: '',
            priceTo: ''
        });
        setOrderNumberFilter('');
        onFilter({}); // Load today's orders
    };

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
                        <h5 className="mb-0">Search & Filter Orders</h5>
                    </div>
                    <div className="card-body">
                        {/* Filter Option 1: Specific Date */}
                        <div className="border rounded p-3 mb-3">
                            <h6 className="fw-bold text-dark">Option 1: Orders from Specific Date</h6>
                            <div className="row g-2 align-items-end">
                                <div className="col-md-6">
                                    <label className="form-label">Select Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={specificDateFilter}
                                        onChange={(e) => setSpecificDateFilter(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <button
                                        type="button"
                                        className="btn btn-dark"
                                        onClick={handleSpecificDateSearch}
                                        disabled={loading || !specificDateFilter}
                                    >
                                        {loading ? 'Searching...' : 'Search'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Filter Option 2: Date Range */}
                        <div className="border rounded p-3 mb-3">
                            <h6 className="fw-bold text-dark">Option 2: Date Range Filter (with optional price filter)</h6>
                            <div className="row g-2">
                                <div className="col-md-3">
                                    <label className="form-label">Date From</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={dateRangeFilter.dateFrom}
                                        onChange={(e) => setDateRangeFilter(prev => ({ ...prev, dateFrom: e.target.value }))}
                                    />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">Date To</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={dateRangeFilter.dateTo}
                                        onChange={(e) => setDateRangeFilter(prev => ({ ...prev, dateTo: e.target.value }))}
                                    />
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label">Price From (Rs.)</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="Min price"
                                        value={dateRangeFilter.priceFrom}
                                        onChange={(e) => setDateRangeFilter(prev => ({ ...prev, priceFrom: e.target.value }))}
                                    />
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label">Price To (Rs.)</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="Max price"
                                        value={dateRangeFilter.priceTo}
                                        onChange={(e) => setDateRangeFilter(prev => ({ ...prev, priceTo: e.target.value }))}
                                    />
                                </div>
                                <div className="col-md-2 d-flex align-items-end">
                                    <button
                                        type="button"
                                        className="btn btn-dark w-100"
                                        onClick={handleDateRangeSearch}
                                        disabled={loading}
                                    >
                                        {loading ? 'Searching...' : 'Search'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Filter Option 3: Order Number */}
                        <div className="border rounded p-3 mb-3">
                            <h6 className="fw-bold text-dark">Option 3: Search by Order Number</h6>
                            <div className="row g-2 align-items-end">
                                <div className="col-md-6">
                                    <label className="form-label">Order Number</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter order number"
                                        value={orderNumberFilter}
                                        onChange={(e) => setOrderNumberFilter(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <button
                                        type="button"
                                        className="btn btn-dark"
                                        onClick={handleOrderNumberSearch}
                                        disabled={loading || !orderNumberFilter.trim()}
                                    >
                                        {loading ? 'Searching...' : 'Search'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Clear All Button */}
                        <div className="text-center">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleClearAll}
                                disabled={loading}
                            >
                                Clear All & Load Today's Orders
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default FilterOrdersComponent;
