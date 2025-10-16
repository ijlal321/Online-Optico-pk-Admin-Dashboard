
import { NextResponse } from 'next/server';
import dbConnect from '@/utlis/mongodb';
import Frame from '@/models/frame';

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const frame = await Frame.create(body);
    return NextResponse.json({ success: true, data: frame });
  } catch (error) {
    console.error('Error creating frame:', error);
    return NextResponse.json({ success: false, error: error.message });
  }
}



export async function GET(req) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    
    // Build filter query
    let query = {};
    let pipeline = [];
    
    // Date range filter
    const dateFrom = searchParams.get('dateRange[from]');
    const dateTo = searchParams.get('dateRange[to]');
    
    // Price range filter
    const priceFrom = searchParams.get('priceRange[from]');
    const priceTo = searchParams.get('priceRange[to]');
    
    // Basic attribute filters
    const brand = searchParams.getAll('brand');
    const shape = searchParams.getAll('shape');
    const material = searchParams.getAll('material');
    const sex = searchParams.getAll('sex');
    const tags = searchParams.getAll('tags');
    
    // Sold status filter
    const soldStatus = searchParams.get('soldStatus');
    
    // "Other" filters
    const includeOtherBrand = searchParams.get('includeOther_brand') === 'true';
    const includeOtherShape = searchParams.get('includeOther_shape') === 'true';
    const includeOtherMaterial = searchParams.get('includeOther_material') === 'true';
    const includeOtherSex = searchParams.get('includeOther_sex') === 'true';
    const includeOtherTags = searchParams.get('includeOther_tags') === 'true';

    // Build match stage
    let matchStage = {};

    // Date range filter
    if (dateFrom || dateTo) {
      matchStage.createdAt = {};
      if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        matchStage.createdAt.$lte = endDate;
      }
    }

    // Price range filter
    if (priceFrom || priceTo) {
      matchStage.price = {};
      if (priceFrom) matchStage.price.$gte = parseFloat(priceFrom);
      if (priceTo) matchStage.price.$lte = parseFloat(priceTo);
    }

    // Sold status filter
    if (soldStatus && soldStatus !== 'all') {
      if (soldStatus === 'sold') {
        matchStage.sold = true;
      } else if (soldStatus === 'not_sold') {
        matchStage.sold = false;
      }
    }

    // Basic attribute filters with "other" support
    const basicAttributesData = {
      brand: ["a", "b", "c", "d", "e"],
      shape: ["a", "b", "c", "d", "e"],
      material: ["a", "b", "c", "d", "e"],
      sex: ["Male", "Female", "Kids"],
      tags: ["a", "b", "c", "d", "e"]
    };

    // Brand filter
    if (brand && brand.length > 0 || includeOtherBrand) {
      let brandConditions = [];
      if (brand && brand.length > 0) {
        brandConditions.push({ brand: { $in: brand } });
      }
      if (includeOtherBrand) {
        brandConditions.push({ brand: { $nin: basicAttributesData.brand } });
      }
      if (brandConditions.length > 0) {
        matchStage.$and = matchStage.$and || [];
        matchStage.$and.push({ $or: brandConditions });
      }
    }

    // Shape filter
    if (shape && shape.length > 0 || includeOtherShape) {
      let shapeConditions = [];
      if (shape && shape.length > 0) {
        shapeConditions.push({ shape: { $in: shape } });
      }
      if (includeOtherShape) {
        shapeConditions.push({ shape: { $nin: basicAttributesData.shape } });
      }
      if (shapeConditions.length > 0) {
        matchStage.$and = matchStage.$and || [];
        matchStage.$and.push({ $or: shapeConditions });
      }
    }

    // Material filter
    if (material && material.length > 0 || includeOtherMaterial) {
      let materialConditions = [];
      if (material && material.length > 0) {
        materialConditions.push({ material: { $in: material } });
      }
      if (includeOtherMaterial) {
        materialConditions.push({ material: { $nin: basicAttributesData.material } });
      }
      if (materialConditions.length > 0) {
        matchStage.$and = matchStage.$and || [];
        matchStage.$and.push({ $or: materialConditions });
      }
    }

    // Sex filter
    if (sex && sex.length > 0 || includeOtherSex) {
      let sexConditions = [];
      if (sex && sex.length > 0) {
        sexConditions.push({ sex: { $in: sex } });
      }
      if (includeOtherSex) {
        sexConditions.push({ sex: { $nin: basicAttributesData.sex } });
      }
      if (sexConditions.length > 0) {
        matchStage.$and = matchStage.$and || [];
        matchStage.$and.push({ $or: sexConditions });
      }
    }

    // Tags filter
    if (tags && tags.length > 0 || includeOtherTags) {
      let tagsConditions = [];
      if (tags && tags.length > 0) {
        tagsConditions.push({ tags: { $in: tags } });
      }
      if (includeOtherTags) {
        tagsConditions.push({ tags: { $nin: basicAttributesData.tags } });
      }
      if (tagsConditions.length > 0) {
        matchStage.$and = matchStage.$and || [];
        matchStage.$and.push({ $or: tagsConditions });
      }
    }

    // Execute query
    let frames;
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
      pipeline.push({ $sort: { createdAt: -1 } });
      pipeline.push({ $limit: 100 });
      frames = await Frame.aggregate(pipeline);
    } else {
      frames = await Frame.find().sort({ createdAt: -1 }).limit(100);
    }

    return NextResponse.json({ success: true, data: frames });
  } catch (error) {
    console.error('Error fetching frames:', error);
    return NextResponse.json({ success: false, error: error.message });
  }
}

export async function DELETE(req) {
  try {
    await dbConnect();
    const { id } = await req.json();
    const deletedFrame = await Frame.findOneAndDelete({ id });
    if (!deletedFrame) {
      return NextResponse.json({ success: false, error: 'Frame not found' });
    }
    return NextResponse.json({ success: true, data: deletedFrame });
  } catch (error) {
    console.error('Error deleting frame:', error);
    return NextResponse.json({ success: false, error: error.message });
  }
}