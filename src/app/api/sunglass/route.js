
import { NextResponse } from 'next/server';
import dbConnect from '@/utlis/mongodb';
import Sunglass from '@/models/sunglass';

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const sunglass = await Sunglass.create(body);
    return NextResponse.json({ success: true, data: sunglass });
  } catch (error) {
    console.error('Error creating sunglass:', error);
    return NextResponse.json({ success: false, error: error.message });
  }
}


export async function GET(req) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    
    // Build filter object
    let filter = {};
    let aggregatePipeline = [];
    
    // Date range filter
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    // Price range filter
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    
    // Sold status filter
    const soldStatus = searchParams.get('soldStatus');
    if (soldStatus && soldStatus !== 'all') {
      filter.sold = soldStatus === 'sold' ? true : false;
    }
    
    // Basic attribute filters
    const attributeFilters = {};
    const otherFilters = {};
    
    // Get all attribute filter params
    for (const [key, value] of searchParams.entries()) {
      if (key.endsWith('_other') && value === 'true') {
        const attributeName = key.replace('_other', '');
        otherFilters[attributeName] = true;
      } else if (!['startDate', 'endDate', 'minPrice', 'maxPrice', 'soldStatus'].includes(key) && !key.endsWith('_other') && !key.endsWith('_options')) {
        try {
          const parsedValue = JSON.parse(value);
          if (Array.isArray(parsedValue) && parsedValue.length > 0) {
            attributeFilters[key] = parsedValue;
          }
        } catch (e) {
          // If not JSON, treat as string
          if (value && value.trim() !== '') {
            attributeFilters[key] = value;
          }
        }
      }
    }
    
    // Build aggregation pipeline for complex filtering
    aggregatePipeline.push({ $match: filter });
    
    // Handle attribute filters and "other" logic
    if (Object.keys(attributeFilters).length > 0 || Object.keys(otherFilters).length > 0) {
      const attributeConditions = [];
      
      for (const [attribute, values] of Object.entries(attributeFilters)) {
        if (Array.isArray(values)) {
          // For array fields in the schema (like shape, material, sex, tags, lens_type)
          if (['shape', 'material', 'sex', 'tags', 'lens_type'].includes(attribute)) {
            attributeConditions.push({
              [attribute]: { $in: values }
            });
          } else {
            // For single value fields (like brand, lens_material, prescription_possible, copy_type)
            attributeConditions.push({
              [attribute]: { $in: values }
            });
          }
        } else {
          attributeConditions.push({
            [attribute]: values
          });
        }
      }
      
      // Handle "other" filters
      for (const attribute of Object.keys(otherFilters)) {
        // Get all possible values for this attribute from the request
        const validOptions = searchParams.get(`${attribute}_options`);
        if (validOptions) {
          try {
            const options = JSON.parse(validOptions);
            // For array fields, check if none of the array elements are in the options
            if (['shape', 'material', 'sex', 'tags', 'lens_type'].includes(attribute)) {
              attributeConditions.push({
                [attribute]: { 
                  $not: { $elemMatch: { $in: options } },
                  $exists: true, 
                  $ne: null, 
                  $ne: []
                }
              });
            } else {
              // For single value fields
              attributeConditions.push({
                [attribute]: { $nin: options, $exists: true, $ne: null, $ne: "" }
              });
            }
          } catch (e) {
            console.warn(`Could not parse options for ${attribute}:`, e);
          }
        }
      }
      
      if (attributeConditions.length > 0) {
        aggregatePipeline.push({
          $match: {
            $and: attributeConditions
          }
        });
      }
    }
    
    // Sort by creation date (newest first)
    aggregatePipeline.push({ $sort: { createdAt: -1 } });
    
    // Execute aggregation or simple find
    let sunglasses;
    if (aggregatePipeline.length > 1) {
      sunglasses = await Sunglass.aggregate(aggregatePipeline);
    } else {
      sunglasses = await Sunglass.find(filter).sort({ createdAt: -1 });
    }
    
    return NextResponse.json({ success: true, data: sunglasses });
  } catch (error) {
    console.error('Error fetching sunglasses:', error);
    return NextResponse.json({ success: false, error: error.message });
  }
}

export async function DELETE(req) {
  try {
    await dbConnect();
    const { id } = await req.json();
    const deletedSunglass = await Sunglass.findOneAndDelete({ id });
    if (!deletedSunglass) {
      return NextResponse.json({ success: false, error: 'Sunglass not found' });
    }
    return NextResponse.json({ success: true, data: deletedSunglass });
  } catch (error) {
    console.error('Error deleting sunglass:', error);
    return NextResponse.json({ success: false, error: error.message });
  }
}