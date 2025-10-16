import { NextResponse } from 'next/server';
import dbConnect from '@/utlis/mongodb';
import Order from '@/models/order';
import Frame from '@/models/frame';
import Sunglass from '@/models/sunglass';
import ReadingGlass from '@/models/readingGlass';
import mongoose from 'mongoose';

// return orders with filtering options
export async function GET(req) {
    try {
        await dbConnect();
        
        const { searchParams } = new URL(req.url);
        const orderNumber = searchParams.get('orderNumber');
        const specificDate = searchParams.get('specificDate');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');
        const priceFrom = searchParams.get('priceFrom');
        const priceTo = searchParams.get('priceTo');

        // Build the query object
        let query = {};

        // Option 1: Filter by order number
        if (orderNumber && orderNumber.trim() !== '') {
            query.orderNumber = { $regex: orderNumber.trim(), $options: 'i' };
            const orders = await Order.find(query).sort({ updatedAt: -1 });
            return NextResponse.json({ success: true, data: orders });
        }

        // Option 2: Filter by specific date
        if (specificDate) {
            const startOfDay = new Date(specificDate);
            const endOfDay = new Date(specificDate);
            endOfDay.setHours(23, 59, 59, 999);
            query.orderDate = {
                $gte: startOfDay,
                $lte: endOfDay
            };
            const orders = await Order.find(query).sort({ updatedAt: -1 });
            return NextResponse.json({ success: true, data: orders });
        }

        // Option 3: Filter by date range (with optional price filtering)
        if (dateFrom || dateTo || priceFrom || priceTo) {
            let pipeline = [];

            // Match stage for date range
            let matchStage = {};
            if (dateFrom || dateTo) {
                matchStage.orderDate = {};
                if (dateFrom) {
                    matchStage.orderDate.$gte = new Date(dateFrom);
                }
                if (dateTo) {
                    const endDate = new Date(dateTo);
                    endDate.setHours(23, 59, 59, 999);
                    matchStage.orderDate.$lte = endDate;
                }
            }

            if (Object.keys(matchStage).length > 0) {
                pipeline.push({ $match: matchStage });
            }

            // If price filtering is needed, add aggregation stages
            if (priceFrom || priceTo) {
                // Add field for total price calculation using the same logic as ShowSummaryOrder.jsx
                pipeline.push({
                    $addFields: {
                        totalPrice: {
                            $sum: {
                                $map: {
                                    input: "$items",
                                    as: "item",
                                    in: {
                                        $switch: {
                                            branches: [
                                                {
                                                    case: { $eq: ["$$item.itemType", "Sunglass"] },
                                                    then: {
                                                        $add: [
                                                            { $toDouble: { $ifNull: ["$$item.sunglassPrice", 0] } },
                                                            {
                                                                $cond: {
                                                                    if: "$$item.customLens",
                                                                    then: { $toDouble: { $ifNull: ["$$item.lensPrice", 0] } },
                                                                    else: 0
                                                                }
                                                            }
                                                        ]
                                                    }
                                                },
                                                {
                                                    case: { $eq: ["$$item.itemType", "Prescription Glasses"] },
                                                    then: {
                                                        $add: [
                                                            { $toDouble: { $ifNull: ["$$item.framePrice", 0] } },
                                                            { $toDouble: { $ifNull: ["$$item.lensPrice", 0] } }
                                                        ]
                                                    }
                                                },
                                                {
                                                    case: { $eq: ["$$item.itemType", "Contact Lens"] },
                                                    then: {
                                                        $multiply: [
                                                            { $toDouble: { $ifNull: ["$$item.price", 0] } },
                                                            { $toDouble: { $ifNull: ["$$item.quantity", 1] } }
                                                        ]
                                                    }
                                                },
                                                {
                                                    case: { $eq: ["$$item.itemType", "Reading Glasses"] },
                                                    then: { $toDouble: { $ifNull: ["$$item.price", 0] } }
                                                },
                                                {
                                                    case: { $eq: ["$$item.itemType", "Other"] },
                                                    then: { $toDouble: { $ifNull: ["$$item.price", 0] } }
                                                }
                                            ],
                                            default: 0
                                        }
                                    }
                                }
                            }
                        }
                    }
                });

                // Add price range filter
                let priceMatch = {};
                if (priceFrom) {
                    priceMatch.totalPrice = { $gte: parseFloat(priceFrom) };
                }
                if (priceTo) {
                    if (!priceMatch.totalPrice) priceMatch.totalPrice = {};
                    priceMatch.totalPrice.$lte = parseFloat(priceTo);
                }
                pipeline.push({ $match: priceMatch });
            }

            // Sort by updatedAt descending
            pipeline.push({ $sort: { updatedAt: -1 } });

            const orders = await Order.aggregate(pipeline);
            return NextResponse.json({ success: true, data: orders });
        }

        // Default: return today's orders
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
        
        const orders = await Order.find({
            orderDate: {
                $gte: startOfToday,
                $lte: endOfToday
            }
        }).sort({ updatedAt: -1 });
        
        return NextResponse.json({ success: true, data: orders });

    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json({ success: false, error: error.message });
    }
}



// delete order
export async function DELETE(req) {
    try {
        await dbConnect();
        const { id } = await req.json();
        const deletedOrder = await Order.findOneAndDelete({ id });
        if (!deletedOrder) {
            return NextResponse.json({ success: false, error: 'Order not found' });
        }
        return NextResponse.json({ success: true, data: deletedOrder });
    }
    catch (error) {
        console.error('Error deleting order:', error);
        return NextResponse.json({ success: false, error: error.message });
    }
}

// update order
export async function PUT(req) {
    try {
        await dbConnect();
        const { id, ...body } = await req.json();
        const updatedOrder = await Order.findOneAndUpdate({ id }, body, { new: true });
        if (!updatedOrder) {
            return NextResponse.json({ success: false, error: 'Order not found' });
        }
        return NextResponse.json({ success: true, data: updatedOrder });
    }
    catch (error) {
        console.error('Error updating order:', error);
        return NextResponse.json({ success: false, error: error.message });
    }
}


// create new order
export async function POST(req) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        await dbConnect();
        const body = await req.json();

        for (const item of body.items) {
            if (!item.itemId || item.itemId == '') continue;

            let result;
            if (item.itemType === 'Prescription Glasses') {
                result = await orderStockHelper(item, Frame, session);
            } else if (item.itemType === 'Sunglass') {
                result = await orderStockHelper(item, Sunglass, session);
            } else if (item.itemType === 'Reading Glasses') {
                result = await orderStockHelper(item, ReadingGlass, session);
            }

            if (!result.success) {
                await session.abortTransaction();
                await session.endSession(); // End session after abort
                return NextResponse.json({ success: false, error: `${item.itemType}: ${result.error}` });
            }
        }

        const order = await Order.create([body], { session }); // Include session
        await session.commitTransaction();
        await session.endSession(); // End session after commit
        return NextResponse.json({ success: true, data: order });
    } catch (error) {
        console.error('Error creating order:', error);
        await session.abortTransaction();
        await session.endSession(); // End session after abort
        return NextResponse.json({ success: false, error: error.message });
    }
}


// Helper function to order stock
const orderStockHelper = async (item, Schema, session) => {
    let product = await Schema.findOne({ id: item.itemId }).session(session); // Include session
    if (!product) {
        return { success: false, error: 'Not found.' };
    }

    const variant = product.variants.find(variant => variant.variantId === item.variantId);
    if (!variant) {
        return { success: false, error: 'Variant not found.' };
    }
    const inventory = variant.inventory.find(inventory => inventory.inventoryId === item.inventoryId);
    if (!inventory) {
        return { success: false, error: 'Inventory not found.' };
    }
    if (inventory.stock < 1) {
        return { success: false, error: 'Out of stock.' };
    }

    product = await Schema.findOneAndUpdate(
        { id: item.itemId, 'variants.variantId': item.variantId, 'variants.inventory.inventoryId': item.inventoryId },
        {
            $inc: { 'variants.$.inventory.$[inv].stock': -1 }
        },
        {
            new: true,
            arrayFilters: [{ 'inv.inventoryId': item.inventoryId }], // Apply the filter for inventoryId inside the variant
            returnDocument: 'after', // Return the document after the update
            session // Add session to ensure the operation is part of the transaction
        }
    );

    if (!product) {
        return { success: false, error: 'Update failed.' };
    }

    return { success: true, data: product };
};


