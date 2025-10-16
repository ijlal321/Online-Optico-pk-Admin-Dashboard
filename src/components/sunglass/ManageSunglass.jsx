"use client";

import React, { useState, useEffect } from 'react'
import SunglassSummaryCard from './SunglassSummaryCard';
import CurrentStatusComponent from '../helpers/CurrentStatusComponent';
import FilterSunglassComponent from './FilterSunglassComponent';



function ManageSunglass() {
    const [status, setStatus] = useState({ status: 'hide', description: '' });
    const [sunglasses, setSunglasses] = useState([]);
    const [filterParams, setFilterParams] = useState({});

    const fetchSunglassData = async (filters = {}) => {
        try {
            setStatus({ status: 'loading', description: 'Loading Data...' });

            // Build query string from filters
            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    if (Array.isArray(value)) {
                        queryParams.append(key, JSON.stringify(value));
                    } else {
                        queryParams.append(key, value);
                    }
                }
            });

            const url = `/api/sunglass${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            if (data.success) {
                setSunglasses(data.data);
                setStatus({ status: 'idle', description: 'Loaded Successfully' });
            }
            else {
                setStatus({ status: 'error', description: `Error Loading Data: ${data.error}` });
            }
        } catch (error) {
            console.error('Error fetching Sunglasses:', error);
            setStatus({ status: 'error', description: error.message });
        }
    };

    useEffect(() => {
        fetchSunglassData();
    }, []);

    const handleFilterChange = (filters) => {
        setFilterParams(filters);
        fetchSunglassData(filters);
    };

    return (
        <div>
            <div className="row">
                <div className="col-12">
                    <CurrentStatusComponent status={status} setStatus={setStatus} />
                </div>
                <FilterSunglassComponent onFilter={handleFilterChange} loading={status.status === 'loading'} />
                <div className='d-flex'>
                    <h2 className='mx-auto'>{sunglasses && sunglasses.length ? sunglasses.length : 0} sunglassess found</h2>
                </div>
                <div className="col-12">
                    <div className="container-fluid bg-white py-3 my-3 rounded shadow">
                        <div className="row">
                            {sunglasses && sunglasses.length > 0 && sunglasses.map((sunglass, index) => (
                                <div key={index} className="col-12 col-md-6 col-lg-4 col-xl-3 mb-3">
                                    <SunglassSummaryCard sunglass={sunglass} setStatus={setStatus} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ManageSunglass