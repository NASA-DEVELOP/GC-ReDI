/*
Notices:
This software may be used, reproduced, and provided to others only as permitted under the terms of the agreement under which it was acquired from the U.S. Government. Neither title to, nor ownership of, the software is hereby transferred. This notice shall remain on all copies of the software.
  
Disclaimers
No Warranty: THE SUBJECT SOFTWARE IS PROVIDED "AS IS" WITHOUT ANY WARRANTY OF ANY KIND, EITHER EXPRESSED, IMPLIED, OR STATUTORY, INCLUDING, BUT NOT LIMITED TO, ANY WARRANTY THAT THE SUBJECT SOFTWARE WILL CONFORM TO SPECIFICATIONS, ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR FREEDOM FROM INFRINGEMENT, ANY WARRANTY THAT THE SUBJECT SOFTWARE WILL BE ERROR FREE, OR ANY WARRANTY THAT DOCUMENTATION, IF PROVIDED, WILL CONFORM TO THE SUBJECT SOFTWARE. THIS AGREEMENT DOES NOT, IN ANY MANNER, CONSTITUTE AN ENDORSEMENT BY GOVERNMENT AGENCY OR ANY PRIOR RECIPIENT OF ANY RESULTS, RESULTING DESIGNS, HARDWARE, SOFTWARE PRODUCTS OR ANY OTHER APPLICATIONS RESULTING FROM USE OF THE SUBJECT SOFTWARE.  FURTHER, GOVERNMENT AGENCY DISCLAIMS ALL WARRANTIES AND LIABILITIES REGARDING THIRD-PARTY SOFTWARE, IF PRESENT IN THE ORIGINAL SOFTWARE, AND DISTRIBUTES IT "AS IS." 
 
Waiver and Indemnity:  RECIPIENT AGREES TO WAIVE ANY AND ALL CLAIMS AGAINST THE UNITED STATES GOVERNMENT, ITS CONTRACTORS AND SUBCONTRACTORS, AS WELL AS ANY PRIOR RECIPIENT.  IF RECIPIENT'S USE OF THE SUBJECT SOFTWARE RESULTS IN ANY LIABILITIES, DEMANDS, DAMAGES, EXPENSES OR LOSSES ARISING FROM SUCH USE, INCLUDING ANY DAMAGES FROM PRODUCTS BASED ON, OR RESULTING FROM, RECIPIENT'S USE OF THE SUBJECT SOFTWARE, RECIPIENT SHALL INDEMNIFY AND HOLD HARMLESS THE UNITED STATES GOVERNMENT, ITS CONTRACTORS AND SUBCONTRACTORS, AS WELL AS ANY PRIOR RECIPIENT, TO THE EXTENT PERMITTED BY LAW.  RECIPIENT'S SOLE REMEDY FOR ANY SUCH MATTER SHALL BE THE IMMEDIATE, UNILATERAL TERMINATION OF THIS AGREEMENT.
*/

//********************************** WATER FEATURE EXTRACTION ***************************************//
// Water Feature Extraction
// Study Area: Lake Mead and Lower Grand Canyon
// Study Period: 1998-2016
// Purpose: Script to compute the water mask for each year in the study period by calculating
// the NDVI, NDWI, and MNDWI and applying a threshold to them in order to distinguish water.
// Note: Referenced https://gist.github.com/berlinermorgenpost/22e034f45dfff8efc6594e5327c74ee3 
// for how to run single loop with two different Landsat Collections
//**************************************************************************************//
//*************************************GLOBAL VARIABLES*********************************//
//**************************************************************************************//

//Set the temporal boundaries of the analysis
var startYear = 1998;
var endYear = 2016;
var startDay = '-03-01';
var endDay = '-05-31';
var years = ee.List.sequence(startYear, endYear).remove(2012);  // Remove 2012 because of the coverage gap between Landsat 5 and 8

// Specify the id of the fusion table containing your study area geometry
var study_area_FT = 'ft:study_area_GCW_fusion_table_id';

// Specify the id of the fusion table containing the training areas for water/non-water
var validation_areas_FT = 'ft:WaterAccuracyPolygons_fusion_table_id';

//Build a Feature Collection of the Landsat Sensors
// this allows the script to apply to any year covered by Landsat 5 or 8
var landsatSensors = ee.FeatureCollection([
  ee.Feature(null, {collection: ee.ImageCollection('LANDSAT/LC8_SR'), mir: 'B6', swir: 'B7', nir: 'B5', red: 'B4', green: 'B3', from: 2013, to: 2016}),
  ee.Feature(null, {collection: ee.ImageCollection('LANDSAT/LT5_SR'), mir: 'B5',  swir: 'B7', nir: 'B4', red: 'B3', green: 'B2', from: 1998, to: 2012})
]);


//*************************************************************************************//
//**********************Main Script for Extracting Water Features**********************//
//*************************************************************************************//

// Import and store the Study Area geometry as a Feature Collection of type geometry
var study_area = ee.FeatureCollection(study_area_FT, 'geometry');
Map.setCenter(-113.756144, 35.966608, 10);

//*************************************************************************************//
//**********Part 1: Calculate and Apply Thresholds to Every Year***********************//
//*************************************************************************************//

// Function to apply to each year
// Filters the image collection, calculates the indices, masks clouds, applies thresholds,
// and takes the mode of the three binary images to return a single water mask
var processByYear = function(year, imageCollection) {
  
  // Select the Landsat Sensor based on the current year
  var startDate = ee.Date(ee.String(ee.Number(year).toInt()).cat(startDay));
  var endDate = ee.Date(ee.String(ee.Number(year).toInt()).cat(endDay));
  var landsat = getLandsatYear(year);
  
  // Filter the Landsat Collection for imagery for study area and current season
  var yearCollection = ee.ImageCollection(landsat.get('collection'))
    .filter(ee.Filter.eq('wrs_path', 38))
    .filter(ee.Filter.eq('wrs_row', 35))
    .filterDate(startDate, endDate);
  
  // Calculate the indices and apply the cloud mask to every image
  var NDWICollection = yearCollection.map(calculateNDWI(landsat)); // calculates NDWI 
  var MNDWICollection = NDWICollection.map(calculateMNDWI(landsat)); // calculates MNDWI
  var NDVICollection = MNDWICollection.map(calculateNDVI(landsat)); //calculates NDVI 
  var maskedNDVICollection = NDVICollection.map(cloudMask(landsat)); // apply the cloud mask
  
  // Reduce the season collection by minimum pixel value and maximum
  var compositeMin = ee.Image(maskedNDVICollection.reduce(ee.Reducer.min()));
  var compositeMax = ee.Image(maskedNDVICollection.reduce(ee.Reducer.max()));
  
  // Apply a threshold to each of the indices to create a binary water/non-water mask
  // Use the minimum composite for the NDVI because water has negtive values
  // Use the maximum composite for the NDWI and MNDWI because water has positive values
  var NDVIMask = compositeMin.select('ndvi_min').lt(0).rename(ee.String('ndvi_mask'));
  var NDWIMask = compositeMax.select('ndwi_max').gt(0).rename(ee.String('ndwi_mask'));
  var MNDWIMask = compositeMax.select('mndwi_max').gt(0).rename(ee.String('mndwi_mask'));
  
  // Create a single image with 3 bands: NDVI mask, NDWI mask, and MNDWI mask
  var masks = NDVIMask.addBands([NDWIMask, MNDWIMask]).clip(study_area);
  // Reduce the image into a single band based on the mode of each pixel
  // This means that in the reduced image; water must have been identified
  // in at least 2 out of 3 of the masks in order to be considered water
  // Also set the property 'YEAR' equal to the current year and rename the band
  var mask = masks.reduce(ee.Reducer.mode()).set('YEAR', year).rename('mask');
  
  // Place the final mask in an image collection to be able to return the image
  var tempCollection = ee.ImageCollection([mask.addBands([NDVIMask, NDWIMask, MNDWIMask])]);
  
  // Merge the water mask collection (imageCollection) with the new image collection
  // containing this year's water mask
  return tempCollection.merge(imageCollection);
};

// Iterate through the list of years and apply the above function to each year
// The result will be an image collection (maskCollection) of the masks from every year
var maskCollection = ee.ImageCollection(years.iterate(processByYear, ee.ImageCollection([])));
print('Mask Collection: ', maskCollection)

// Add the start year and end year to the map layer
var mask_start = ee.Image(maskCollection.filter(ee.Filter.eq('YEAR', startYear)).first()).select('mask');
var mask_end = ee.Image(maskCollection.filter(ee.Filter.eq('YEAR', endYear)).first()).select('mask');

Map.addLayer(mask_start, {bands: ['mask'], min: 0, max: 1}, 'First Year');
Map.addLayer(mask_end, {bands: ['mask'], min: 0, max: 1}, 'Last Year');


//*************************************************************************************//
//**********Part 2: Evaluate the Results for Five of the Year**************************//
//*************************************************************************************//

// Set the list of years to validate
var validationYears = ee.List([1998, 2003, 2007, 2011, 2016]);
var training_areas = ee.FeatureCollection(validation_areas_FT, 'geometry');

// Build the Dictionary of the Feature Collections for each of the years 
var aois = ee.Dictionary.fromLists(['1998', '2003', '2007', '2011', '2016'],
                                   [(ee.FeatureCollection(training_areas.filterMetadata('year', 'equals', "'1998'"))), 
                                    (ee.FeatureCollection(training_areas.filterMetadata('year', 'equals', "'2003'"))), 
                                    (ee.FeatureCollection(training_areas.filterMetadata('year', 'equals', "'2007'"))),
                                    (ee.FeatureCollection(training_areas.filterMetadata('year', 'equals', "'2011'"))),
                                    (ee.FeatureCollection(training_areas.filterMetadata('year', 'equals', "'2016'")))]);

// Function to compute the accuracy for each of the validation years
var assessWaterMasks = function(year, featureCollection) {
  
  // Select the mask for the current year
  var masks = ee.Image(maskCollection.filter(ee.Filter.eq('YEAR', year)).first());
  
  // Identify the correct Feature Collection of sample areas
  var aoi = aois.get(ee.String(ee.Number(year).toInt()));
  
  // Select the Regions specified in aoi from the water mask
  var samples = masks.sampleRegions({
    collection: aoi,
    properties: ['water'],
    scale: 30
  });
  
  // Populate the Error Matrix
  var emMask = samples.errorMatrix('water', 'mask');
  var aMask = emMask.accuracy();
  var emNDVIMask = samples.errorMatrix('water', 'ndvi_mask');
  var aNDVIMask = emNDVIMask.accuracy();
  var emNDWIMask = samples.errorMatrix('water', 'ndwi_mask');
  var aNDWIMask = emNDWIMask.accuracy();
  var emMNDWIMask = samples.errorMatrix('water', 'mndwi_mask');
  var aMNDWIMask = emMNDWIMask.accuracy();
  
  // Add a Feature of the current year's error matrix and accuracy
  var yearAccuracies = ee.Feature(null, {year: ee.String(ee.Number(year).toInt()),
                                         ErrorMatrixFinal: emMask,
                                         AccuracyFinal: aMask,
                                         ErrorMatrixNDVI: emNDVIMask,
                                         AccuracyNDVI: aNDVIMask,
                                         ErrorMatrixNDWI: emNDWIMask,
                                         AccuracyNDWI: aNDWIMask,
                                         ErrorMatrixMNDWI: emMNDWIMask,
                                         AccuracyMNDWI: aMNDWIMask,
  });
  yearAccuracies = yearAccuracies.set('system:index', ee.String(ee.Number(year).toInt()));
  
  return ee.FeatureCollection(featureCollection).merge(ee.FeatureCollection([yearAccuracies]));
};

// Iterate through the list of validation years and apply the above function to each year
// The result will be an feature collection of all the error matrices and accuracies
var validation = ee.FeatureCollection(validationYears.iterate(assessWaterMasks, ee.FeatureCollection([])));
print('Validation: ', validation);

// Iterate through and find the Average Accuracy
var accuracy = findAverage('AccuracyFinal', validation);
print('Overall Accuracy: ', accuracy);
var ndvi_accuracy = findAverage('AccuracyNDVI', validation);
print('NDVI Accuracy: ', ndvi_accuracy);
var ndwi_accuracy = findAverage('AccuracyNDWI', validation);
print('NDWI Accuracy: ', ndwi_accuracy);
var mndwi_accuracy = findAverage('AccuracyMNDWI', validation);
print('MNDWI Accuracy: ', mndwi_accuracy);

function findAverage(value, collection) {
  var total = ee.List(collection.iterate(getAllValues(value), ee.List([])))
  var average = ee.Number(0);
  for(var i = 0; i < 5; i++) {average = average.add(total.get(i));}
  average = average.divide(5);
  return average;
}
function getAllValues(value) {return function(feature, list) {return ee.List(list).add(feature.get(value));}}

//*************************************************************************************//
//**********Part 3: Compute the Water Surface Areas for Each Year***********************//
//*************************************************************************************//

// Function to calculate the total surface area for each of the years
var calculateSurfaceArea = function(year, areaFeatureCollection) {
  
  // Select the mask for the current year
  var mask = ee.Image(maskCollection.filter(ee.Filter.eq('YEAR', year)).select('mask').first());
  
  // Multiply the mask by 0.0009 -- the area of each pixel in square kilometers
  // If the pixel is 1 (water) the multiplication will produce the water area for the pixel
  // If the pixel is 0 (non-water) the multiplication will remain 0 for the pixel
  var maskArea = mask.multiply(0.0009);
  
  // Reduce the image of areas by the sum to find the total water surface area
  var surfaceArea = maskArea.reduceRegion({reducer: ee.Reducer.sum(), scale: 30, geometry: study_area}).get('mask');
  
  // Create a feature with the surface area value
  var yearArea = ee.Feature(null, {year: ee.String(ee.Number(year).toInt()),
                                   Surface_Area: surfaceArea
  });
  
  return ee.FeatureCollection(areaFeatureCollection).merge(ee.FeatureCollection([yearArea]));
};

// Iterate through the list of years and apply the above function to each year
// The result will be an feature collection of all the surface years
var surfaceAreas = years.iterate(calculateSurfaceArea, ee.FeatureCollection([]));
print('Surface Areas: ', surfaceAreas);

// Display the Surface Areas as a line graph to the console
var chart = ui.Chart.feature.byFeature(surfaceAreas, 'year')
  .setChartType('LineChart')
  .setOptions({
    title: 'Water Surface Area by Year',
    titleTextStyle: {bold: true, fontSize: 40},
    legend: {position: 'none'},
    fontName: 'Garamond',
    hAxis: {title: 'Year', titleTextStyle: {fontSize:30}, gridlines: {count: 1}, showTextEvery: 2},
    vAxis: {title: 'Surface Area (square km)', titleTextStyle: {fontSize:30}, gridlines: {count: 10}, maxValue: 115, minValue: 0},
    colors: ['0000FF']
  })
print(chart)



//*************************************************************************************//
//**********Part 4: Print the Median Images for Validation Years***********************//
//*************************************************************************************//
// This part can be removed once all the aois have been selected and finalized

// Function to apply to each year
// Filters the image collection, masks clouds, takes the median to produce season composite 
var processByYearFullImage = function(year, imageCollection) {
  
  // Select the Landsat Sensor based on the current year
  var startDate = ee.Date(ee.String(ee.Number(year).toInt()).cat(startDay));
  var endDate = ee.Date(ee.String(ee.Number(year).toInt()).cat(endDay));
  var landsat = getLandsatYear(year);
  
  // Filter the Landsat Collection for imagery for study area and current season
  var yearCollection = ee.ImageCollection(landsat.get('collection'))
    .filterBounds(study_area)
    .filterDate(startDate, endDate);

  // Apply the cloud mask to every image
  var mask = yearCollection.map(cloudMask(landsat)); // apply the cloud mask
  
  // Reduce the season collection to a single image by taking median values
  var compositeMedian = ee.Image(mask.median()).clip(study_area).set('YEAR', year);
  
  // Place the season composite in an image collection to be able to return the image
  var tempCollection = ee.ImageCollection([compositeMedian]);
  
  // Merge the water mask collection (imageCollection) with the new image collection
  return tempCollection.merge(imageCollection);
};

// Iterate through the list of validation years and apply the above function to each year
// The result will be an image collection (medianCollection) of the median seasonal composites
var medianCollection = ee.ImageCollection(years.iterate(processByYearFullImage, ee.ImageCollection([])));

// Filter out each of the validation years and add them to the Map 
var median_1998 = medianCollection.filter(ee.Filter.eq('YEAR', 1998));
var median_2003 = medianCollection.filter(ee.Filter.eq('YEAR', 2003));
var median_2007 = medianCollection.filter(ee.Filter.eq('YEAR', 2007));
var median_2011 = medianCollection.filter(ee.Filter.eq('YEAR', 2011));
var median_2016 = medianCollection.filter(ee.Filter.eq('YEAR', 2016));

Map.addLayer(median_1998, {bands: ['B3', 'B2', 'B1'], min: 0, max: 3000}, '1998');
Map.addLayer(median_2003, {bands: ['B3', 'B2', 'B1'], min: 0, max: 3000}, '2003');
Map.addLayer(median_2007, {bands: ['B3', 'B2', 'B1'], min: 0, max: 3000}, '2007');
Map.addLayer(median_2011, {bands: ['B3', 'B2', 'B1'], min: 0, max: 3000}, '2011');
Map.addLayer(median_2016, {bands: ['B4', 'B3', 'B2'], min: 0, max: 3000}, '2016');


// Helper Functions which support the script by finding the sensor, performing calculations,
// and cloud masking

function getLandsatYear(year) {
  return landsatSensors
    .filter(ee.Filter.lte('from', year))
    .filter(ee.Filter.gte('to', year))
    .first();
}

function calculateNDVI(landsat) {
  return function(image) {
    var ndvi = image.normalizedDifference([landsat.get('nir'), landsat.get('red')]);
    return image.addBands(ndvi.rename('ndvi'));
  };
}

function calculateNDWI(landsat) {
  return function(image) {
    var ndwi = image.normalizedDifference([landsat.get('green'), landsat.get('nir')]);
    return image.addBands(ndwi.rename('ndwi'));
  };
}

function calculateMNDWI(landsat) {
  return function(image) {
    var mndwi = image.normalizedDifference([landsat.get('green'), landsat.get('mir')]);
    return image.addBands(mndwi.rename('mndwi'));
  };
}

function cloudMask(landsat) {
  return function(image) {
    var cloud_free = image.select('cfmask').lt(2);
    return image.updateMask(cloud_free);
  };
}