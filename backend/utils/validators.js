/**
 * Input Validation Utilities
 * Centralized validation functions for parking app
 */

/**
 * Validate latitude coordinate
 * Valid range: -90 to 90
 */
export const isValidLatitude = (lat) => {
  const num = parseFloat(lat);
  return !isNaN(num) && num >= -90 && num <= 90;
};

/**
 * Validate longitude coordinate
 * Valid range: -180 to 180
 */
export const isValidLongitude = (lng) => {
  const num = parseFloat(lng);
  return !isNaN(num) && num >= -180 && num <= 180;
};

/**
 * Validate coordinates object
 * Expected: { latitude, longitude } or { lat, lng }
 */
export const isValidCoordinates = (coordinates) => {
  if (!coordinates || typeof coordinates !== 'object') return false;

  const lat = coordinates.latitude || coordinates.lat;
  const lng = coordinates.longitude || coordinates.lng;

  return isValidLatitude(lat) && isValidLongitude(lng);
};

/**
 * Validate search query
 * Must be non-empty string, max 100 characters
 */
export const isValidSearchQuery = (query) => {
  if (typeof query !== 'string') return false;
  const trimmed = query.trim();
  return trimmed.length > 0 && trimmed.length <= 100;
};

/**
 * Validate parking spot name
 * Required, max 200 characters
 */
export const isValidParkingName = (name) => {
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= 200;
};

/**
 * Validate parking spot data for creation/update
 * Checks required fields and data types
 */
export const isValidParkingSpotData = (data) => {
  if (!data || typeof data !== 'object') return false;

  const errors = [];

  // Check required fields
  if (!data.name || !isValidParkingName(data.name)) {
    errors.push('name: Must be a string between 1-200 characters');
  }

  if (data.latitude === undefined || !isValidLatitude(data.latitude)) {
    errors.push('latitude: Must be a number between -90 and 90');
  }

  if (data.longitude === undefined || !isValidLongitude(data.longitude)) {
    errors.push('longitude: Must be a number between -180 and 180');
  }

  // Check optional numeric fields if provided
  if (data.totalSpaces !== undefined) {
    const total = parseInt(data.totalSpaces);
    if (isNaN(total) || total < 0) {
      errors.push('totalSpaces: Must be a non-negative number');
    }
  }

  if (data.regularSpaces !== undefined) {
    if (typeof data.regularSpaces !== 'number' || data.regularSpaces < 0) {
      errors.push('regularSpaces: Must be a non-negative number');
    }
  }

  if (data.handicapSpaces !== undefined) {
    if (typeof data.handicapSpaces !== 'number' || data.handicapSpaces < 0) {
      errors.push('handicapSpaces: Must be a non-negative number');
    }
  }

  // Check access type (if provided)
  if (data.access !== undefined) {
    const validAccessTypes = ['Public', 'Private', 'Permit', 'Unknown'];
    if (!validAccessTypes.includes(data.access)) {
      errors.push(`access: Must be one of ${validAccessTypes.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
};

/**
 * Validate file upload
 * Checks if file exists and is JSON
 */
export const isValidFileUpload = (file) => {
  if (!file) return false;

  const errors = [];

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    errors.push('File size must not exceed 10MB');
  }

  // Check file type
  const validMimeTypes = ['application/json', 'text/plain'];
  const validExtensions = ['.json'];

  const isMimeValid = validMimeTypes.includes(file.mimetype);
  const isExtensionValid = validExtensions.some((ext) => file.originalname?.endsWith(ext));

  if (!isMimeValid || !isExtensionValid) {
    errors.push('File must be a valid JSON file');
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
};

/**
 * Validate JSON content (parking data)
 * Checks if JSON is array of objects with required fields
 */
export const isValidJSONContent = (content) => {
  try {
    if (!Array.isArray(content)) {
      return {
        isValid: false,
        errors: ['JSON content must be an array of parking records'],
      };
    }

    if (content.length === 0) {
      return {
        isValid: false,
        errors: ['JSON array cannot be empty'],
      };
    }

    const errors = [];

    // Check first 5 records for required fields
    const recordsToCheck = content.slice(0, 5);
    recordsToCheck.forEach((record, index) => {
      if (!record['Parking Lot Asset ID']) {
        errors.push(`Record ${index}: Missing 'Parking Lot Asset ID'`);
      }
      if (!record['Park Name']) {
        errors.push(`Record ${index}: Missing 'Park Name'`);
      }
      if (record['Latitude'] === undefined || record['Latitude'] === null) {
        errors.push(`Record ${index}: Missing 'Latitude'`);
      }
      if (record['Longitude'] === undefined || record['Longitude'] === null) {
        errors.push(`Record ${index}: Missing 'Longitude'`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: ['Invalid JSON content'],
    };
  }
};

/**
 * Validate MongoDB ObjectId
 */
export const isValidObjectId = (id) => {
  if (!id) return false;
  // MongoDB ObjectId is 24 hex characters
  return /^[0-9a-fA-F]{24}$/.test(id.toString());
};

/**
 * Validate distance value (for nearest spots)
 * Should be positive number
 */
export const isValidDistance = (distance) => {
  const num = parseFloat(distance);
  return !isNaN(num) && num >= 0;
};

/**
 * Sanitize string input - remove extra whitespace and trim
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/\s+/g, ' ');
};

/**
 * Validate pagination parameters
 */
export const isValidPaginationParams = (page, limit) => {
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  return (
    !isNaN(pageNum) &&
    !isNaN(limitNum) &&
    pageNum >= 1 &&
    limitNum >= 1 &&
    limitNum <= 100
  );
};
