
import parkingSpots from '../models/ParkingSpot.js';
import { promises as fs } from 'fs';
import {
  isValidFileUpload,
  isValidJSONContent,
  isValidParkingSpotData,
  isValidObjectId,
  isValidCoordinates,
  sanitizeString,
} from '../utils/validators.js';
import {
  ValidationError,
  NotFoundError,
  ServerError,
  ConflictError,
  formatErrorResponse,
} from '../utils/errorHandler.js';

/**
 * Import parking data from JSON file
 * POST /admin/import-data
 */
export const importData = async (req, res, next) => {
  try {
    // Validate file upload
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    const fileValidation = isValidFileUpload(req.file);
    if (!fileValidation.isValid) {
      // Clean up file if upload is invalid
      await fs.unlink(req.file.path).catch(() => {});
      throw new ValidationError('Invalid file upload', fileValidation.errors);
    }

    // Read and parse JSON file
    let jsonData;
    try {
      const jsonContent = await fs.readFile(req.file.path, 'utf8');
      jsonData = JSON.parse(jsonContent);
    } catch (error) {
      await fs.unlink(req.file.path).catch(() => {});
      throw new ValidationError('Invalid JSON format in uploaded file');
    }

    // Validate JSON content
    const contentValidation = isValidJSONContent(jsonData);
    if (!contentValidation.isValid) {
      await fs.unlink(req.file.path).catch(() => {});
      throw new ValidationError('Invalid parking data format', contentValidation.errors);
    }

    // Transform data
    const processedData = jsonData.map((spot) => ({
      assetId: spot['Parking Lot Asset ID'],
      name: sanitizeString(spot['Park Name'] || ''),
      totalSpaces: spot['Total Spaces'],
      regularSpaces: spot['Parking Spaces'] || 0,
      handicapSpaces: spot['Handicap Parking Spaces'] || 0,
      latitude: parseFloat(spot.Latitude),
      longitude: parseFloat(spot.Longitude),
      access: spot.Access || 'Unknown',
    }));

    // Validate transformed data
    const invalidRecords = processedData
      .map((data, index) => ({
        index,
        validation: isValidParkingSpotData(data),
      }))
      .filter((item) => !item.validation.isValid);

    if (invalidRecords.length > 0) {
      await fs.unlink(req.file.path).catch(() => {});
      const errors = invalidRecords
        .slice(0, 5)
        .map((item) => `Record ${item.index}: ${item.validation.errors.join(', ')}`);
      throw new ValidationError('Invalid parking data in records', errors);
    }

    // Insert data into database
    const result = await parkingSpots.insertMany(processedData, { ordered: false });

    // Clean up uploaded file
    await fs.unlink(req.file.path).catch(() => {});

    res.status(200).json({
      success: true,
      message: 'Parking data imported successfully',
      importedCount: result.length,
      totalRecords: jsonData.length,
    });
  } catch (error) {
    // Clean up file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    if (error instanceof ValidationError || error instanceof ServerError) {
      return next(error);
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return next(
        new ConflictError('Some parking spots already exist in database', {
          duplicateKey: Object.keys(error.keyPattern),
        })
      );
    }

    next(new ServerError('Failed to import parking data', { originalError: error.message }));
  }
};

/**
 * Create a new parking spot
 * POST /admin/parking-spots
 */
export const createParkingSpot = async (req, res, next) => {
  try {
    // Validate parking spot data
    const validation = isValidParkingSpotData(req.body);
    if (!validation.isValid) {
      throw new ValidationError('Invalid parking spot data', validation.errors);
    }

    // Sanitize name
    const spotData = {
      ...req.body,
      name: sanitizeString(req.body.name),
    };

    const newParkingSpot = new parkingSpots(spotData);
    const saved = await newParkingSpot.save();

    res.status(201).json({
      success: true,
      message: 'Parking spot created successfully',
      data: saved,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return next(error);
    }

    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      const details = Object.values(error.errors).map((err) => err.message);
      return next(new ValidationError('Validation error', details));
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return next(
        new ConflictError('Parking spot with this asset ID already exists', {
          duplicateKey: Object.keys(error.keyPattern),
        })
      );
    }

    next(new ServerError('Failed to create parking spot', { originalError: error.message }));
  }
};

/**
 * Update an existing parking spot
 * PUT /admin/parking-spots/:id
 */
export const updateParkingSpot = async (req, res, next) => {
  try {
    // Validate ID
    if (!isValidObjectId(req.params.id)) {
      throw new ValidationError('Invalid parking spot ID format');
    }

    // Validate update data (partial validation allowed)
    if (req.body && Object.keys(req.body).length > 0) {
      const validation = isValidParkingSpotData(req.body);
      if (!validation.isValid) {
        throw new ValidationError('Invalid update data', validation.errors);
      }
    }

    // Sanitize name if provided
    const updateData = {
      ...req.body,
      ...(req.body.name && { name: sanitizeString(req.body.name) }),
    };

    const updatedSpot = await parkingSpots.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedSpot) {
      throw new NotFoundError('Parking spot');
    }

    res.status(200).json({
      success: true,
      message: 'Parking spot updated successfully',
      data: updatedSpot,
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      return next(error);
    }

    if (error.name === 'ValidationError') {
      const details = Object.values(error.errors).map((err) => err.message);
      return next(new ValidationError('Validation error', details));
    }

    next(new ServerError('Failed to update parking spot', { originalError: error.message }));
  }
};

/**
 * Delete a parking spot
 * DELETE /admin/parking-spots/:id
 */
export const deleteParkingSpot = async (req, res, next) => {
  try {
    // Validate ID
    if (!isValidObjectId(req.params.id)) {
      throw new ValidationError('Invalid parking spot ID format');
    }

    const deletedSpot = await parkingSpots.findByIdAndDelete(req.params.id);

    if (!deletedSpot) {
      throw new NotFoundError('Parking spot');
    }

    res.status(200).json({
      success: true,
      message: 'Parking spot deleted successfully',
      deletedSpot: deletedSpot,
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      return next(error);
    }

    next(new ServerError('Failed to delete parking spot', { originalError: error.message }));
  }
}
