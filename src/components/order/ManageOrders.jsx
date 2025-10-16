"use client";

import React, { useState, useEffect, use } from 'react'
import ShowSummaryOrder from './ShowSummaryOrder';
import CurrentStatusComponent from '../helpers/CurrentStatusComponent';
import FilterOrdersComponent from './FilterOrdersComponent';
import { set } from 'mongoose';



function ManageOrders() {
    const [orders, setOrders] = useState(null);
    const [status, setStatus] = useState({ status: 'hide', description: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Load today's orders by default
        fetchOrders();
    }, []);

    const fetchOrders = async (params = {}) => {
        setLoading(true);
        setOrders([]);
        try {
            // Build query parameters
            const queryParams = new URLSearchParams();

            Object.keys(params).forEach(key => {
                if (params[key] && params[key].toString().trim() !== '') {
                    queryParams.append(key, params[key]);
                }
            });

            const url = `/api/order${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const response = await fetch(url);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message);
            }
            setOrders(data.data);
            console.log(data.data);
        } catch (error) {
            console.log(error);
            setStatus({ status: 'error', description: error.message });
        } finally {
            setLoading(false);
        }
    };

    // Handler for filter component
    const handleFilter = (filterParams) => {
        fetchOrders(filterParams);
    };

    if (!orders) {
        return <div>Loading...</div>
    }

    return (
        <div className='m-3'>
            {/* Filter Component */}
            <FilterOrdersComponent onFilter={handleFilter} loading={loading} />

            {/* Results Info */}
            <div className="my-3 text-center">
                <small className="text-muted">
                    {orders && <span>Showing {orders.length} orders</span>}
                </small>
            </div>

            <div className='d-flex flex-wrap gap-3'>
                {orders && orders.map((order, index) =>
                    <div key={index} className='col-12 col-md-4'>
                        <ShowSummaryOrder order={order} status={status} setStatus={setStatus} />
                    </div>
                )}
            </div>
            <CurrentStatusComponent status={status} setStatus={setStatus} />
        </div>
    )
}

export default ManageOrders