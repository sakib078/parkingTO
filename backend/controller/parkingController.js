// parkingController.js

import parkingSpots from '../models/ParkingSpot.js';
import nearestSpot from '../utils/nearestSpots.js';
import {
  isValidSearchQuery,
  isValidCoordinates,
  isValidLatitude,
  isValidLongitude,
  sanitizeString,
} from '../utils/validators.js';
import {
  ValidationError,
  NotFoundError,
  ServerError,
  formatErrorResponse,
} from '../utils/errorHandler.js';

/**
 * Get all parking spots
 * GET /park/spots
 */
export const getSpots = async (req, res, next) => {
  try {
    const spots = await parkingSpots.find().lean();

    if (!spots || spots.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No parking spots found',
        spots: [],
      });
    }

    res.status(200).json({
      success: true,
      message: 'Parking spots retrieved successfully',
      count: spots.length,
      spots: spots,
    });
  } catch (error) {
    next(new ServerError('Failed to fetch parking spots', { originalError: error.message }));
  }
};

/**
 * Search parking spot names by query
 * GET /park/spots/searchNames/:query
 */
export const searchNames = async (req, res, next) => {
  try {
    const { query } = req.params;

    // Validate search query
    if (!isValidSearchQuery(query)) {
      throw new ValidationError('Search query must be between 1-100 characters');
    }

    // Sanitize query to prevent injection
    const sanitizedQuery = sanitizeString(query);

    // Create case-insensitive regex
    const regex = new RegExp(`^${sanitizedQuery}`, 'i');

    const names = await parkingSpots
      .find({ name: regex })
      .select('name')
      .limit(20)
      .lean();

    // Get unique names
    const uniqueNames = [...new Set(names.map((spot) => spot.name))];

    res.status(200).json({
      success: true,
      message: 'Parking names retrieved successfully',
      count: uniqueNames.length,
      names: uniqueNames,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return next(error);
    }
    next(new ServerError('Failed to fetch parking names', { originalError: error.message }));
  }
};

/**
 * Search parking spots by name to get coordinates
 * GET /park/spots/search/:name
 */
export const searchSpots = async (req, res, next) => {
  try {
    const { name } = req.params;

    // Validate name parameter
    if (!isValidSearchQuery(name)) {
      throw new ValidationError('Parking spot name must be between 1-100 characters');
    }

    // Sanitize name
    const sanitizedName = sanitizeString(name);

    // Find parking spots matching the name exactly
    const locations = await parkingSpots
      .find({ name: { $regex: `^${sanitizedName}$`, $options: 'i' } })
      .select('latitude longitude name')
      .lean();

    if (!locations || locations.length === 0) {
      throw new NotFoundError('Parking spot', { query: name });
    }

    res.status(200).json({
      success: true,
      message: 'Parking spot coordinates retrieved successfully',
      count: locations.length,
      coordinates: locations,
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      return next(error);
    }
    next(new ServerError('Failed to search parking spots', { originalError: error.message }));
  }
};

/**
 * Find nearest parking spots from given coordinates
 * POST /park/spots/nearestSpot
 * Body: { latitude, longitude }
 */
export const nearestSpots = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;

    // Validate coordinates
    if (!isValidLatitude(latitude)) {
      throw new ValidationError('Invalid latitude. Must be between -90 and 90');
    }

    if (!isValidLongitude(longitude)) {
      throw new ValidationError('Invalid longitude. Must be between -180 and 180');
    }

    // Fetch all parking spots
    const spots = await parkingSpots
      .find()
      .select('latitude longitude name totalSpaces access')
      .lean();

    if (!spots || spots.length === 0) {
      throw new NotFoundError('No parking spots available');
    }

    // Calculate nearest spots
    const results = nearestSpot([latitude, longitude], spots);

    if (!results || results.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No nearby parking spots found',
        results: [],
      });
    }

    res.status(200).json({
      success: true,
      message: 'Nearest parking spots retrieved successfully',
      count: results.length,
      results: results,
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      return next(error);
    }
    next(new ServerError('Failed to fetch nearest parking spots', { originalError: error.message }));
  }
}


// // Get a specific parking spot by ID
// export const getSpotById = async (req, res) => {

//     const id = req.params.id;
//     try {
//         await parkingSpots.findById(id).then(spotbyId => {

//             if (!spotbyId) {
//                 const error = new Error('could not find the spot');
//                 error.statusCode = 422;
//                 throw error;
//             }
//             res.status(200).json({ spotbyId: spotbyId });
//         })
//     }
//     catch (error) {
//         if (!error.statusCode) {
//             error.statusCode = 500;
//         }
//         console.log(error);
//     }
// };

// Book a parking spot
export const bookSpot = (req, res) => {
    // Implementation for booking a parking spot
};

// Release a parking spot
export const releaseSpot = (req, res) => {
    // Implementation for releasing a parking spot
};

// // Create a new parking spot
// export const addSpot = (req, res) => {
//     // Implementation for creating a new parking spot
// };




// // Update an existing parking spot's information
// export const updateSpot = (req, res) => {
//     // Implementation for updating an existing parking spot
// };

// // Delete a parking spot
// export const deleteSpot = (req, res) => {
//     // Implementation for deleting a parking spot
// };

