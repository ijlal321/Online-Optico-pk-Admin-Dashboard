"use client";

import React, { useState, useEffect } from 'react'
import FrameSummaryCard from './FrameSummaryCard';
import CurrentStatusComponent from '../helpers/CurrentStatusComponent';
import FilterFramesComponent from './FilterFramesComponent';

function ManageFrames() {
    const [status, setStatus] = useState({ status: 'hide', description: '' });
    const [frames, setFrames] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Load frames on component mount
        fetchFrames();
    }, []);

    const fetchFrames = async (filterParams = {}) => {
        setLoading(true);
        try {
            setStatus({ status: 'loading', description: 'Loading Data...' });
            
            // Build query parameters
            const queryParams = new URLSearchParams();
            
            Object.keys(filterParams).forEach(key => {
                const value = filterParams[key];
                if (Array.isArray(value)) {
                    value.forEach(item => queryParams.append(key, item));
                } else if (typeof value === 'object' && value !== null) {
                    // Handle range objects
                    Object.keys(value).forEach(subKey => {
                        if (value[subKey] !== '') {
                            queryParams.append(`${key}[${subKey}]`, value[subKey]);
                        }
                    });
                } else if (value !== '' && value !== null && value !== undefined) {
                    queryParams.append(key, value);
                }
            });

            const url = `/api/frames${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            const data = await response.json();
            if (data.success) {
                setFrames(data.data);
                setStatus({ status: 'successful', description: `Loaded ${data.data.length} frames successfully` });
            } else {
                setStatus({ status: 'error', description: `Error Loading Data: ${data.error}` });
            }
        } catch (error) {
            console.error('Error fetching Frames:', error);
            setStatus({ status: 'error', description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = (filterParams) => {
        fetchFrames(filterParams);
    };

    return (
        <div className='container'>
            {/* Filter Component */}
            <FilterFramesComponent onFilter={handleFilter} loading={loading} />

            {/* Results Info */}
            <div className="my-3 text-center">
                <small className="text-muted">
                    <span>Showing {frames.length} frames</span>
                </small>
            </div>

            {/* Frames Grid */}
            <div className='d-flex flex-wrap gap-3 justify-content-center'>
                {frames.map(frame => (
                    <FrameSummaryCard key={frame.id} frame={frame} setStatus={setStatus} />
                ))}
                {frames.length === 0 && !loading && (
                    <div className="text-center w-100 py-4">
                        <p className="text-muted">No frames found matching your criteria.</p>
                    </div>
                )}
            </div>
            
            <CurrentStatusComponent status={status} setStatus={setStatus} />
        </div>
    )
}

export default ManageFrames