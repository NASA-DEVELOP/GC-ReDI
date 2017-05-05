/*
Notices:
This software may be used, reproduced, and provided to others only as permitted under the terms of the agreement under which it was acquired from the U.S. Government. Neither title to, nor ownership of, the software is hereby transferred. This notice shall remain on all copies of the software.
  
Disclaimers
No Warranty: THE SUBJECT SOFTWARE IS PROVIDED "AS IS" WITHOUT ANY WARRANTY OF ANY KIND, EITHER EXPRESSED, IMPLIED, OR STATUTORY, INCLUDING, BUT NOT LIMITED TO, ANY WARRANTY THAT THE SUBJECT SOFTWARE WILL CONFORM TO SPECIFICATIONS, ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR FREEDOM FROM INFRINGEMENT, ANY WARRANTY THAT THE SUBJECT SOFTWARE WILL BE ERROR FREE, OR ANY WARRANTY THAT DOCUMENTATION, IF PROVIDED, WILL CONFORM TO THE SUBJECT SOFTWARE. THIS AGREEMENT DOES NOT, IN ANY MANNER, CONSTITUTE AN ENDORSEMENT BY GOVERNMENT AGENCY OR ANY PRIOR RECIPIENT OF ANY RESULTS, RESULTING DESIGNS, HARDWARE, SOFTWARE PRODUCTS OR ANY OTHER APPLICATIONS RESULTING FROM USE OF THE SUBJECT SOFTWARE.  FURTHER, GOVERNMENT AGENCY DISCLAIMS ALL WARRANTIES AND LIABILITIES REGARDING THIRD-PARTY SOFTWARE, IF PRESENT IN THE ORIGINAL SOFTWARE, AND DISTRIBUTES IT "AS IS." 
 
Waiver and Indemnity:  RECIPIENT AGREES TO WAIVE ANY AND ALL CLAIMS AGAINST THE UNITED STATES GOVERNMENT, ITS CONTRACTORS AND SUBCONTRACTORS, AS WELL AS ANY PRIOR RECIPIENT.  IF RECIPIENT'S USE OF THE SUBJECT SOFTWARE RESULTS IN ANY LIABILITIES, DEMANDS, DAMAGES, EXPENSES OR LOSSES ARISING FROM SUCH USE, INCLUDING ANY DAMAGES FROM PRODUCTS BASED ON, OR RESULTING FROM, RECIPIENT'S USE OF THE SUBJECT SOFTWARE, RECIPIENT SHALL INDEMNIFY AND HOLD HARMLESS THE UNITED STATES GOVERNMENT, ITS CONTRACTORS AND SUBCONTRACTORS, AS WELL AS ANY PRIOR RECIPIENT, TO THE EXTENT PERMITTED BY LAW.  RECIPIENT'S SOLE REMEDY FOR ANY SUCH MATTER SHALL BE THE IMMEDIATE, UNILATERAL TERMINATION OF THIS AGREEMENT.
*/

//*******************2016 Land Cover Classification************************************//
// Land Cover Classification
// Study Area: Lake Mead and Lower Grand Canyon
// Study Period: March 1, 2016 - May 31, 2016

//**************************************************************************************//
//*************GLOBAL VARIABLES TO BE UPDATED DEPENDING ON YEAR STUDIED*****************//
//**************************************************************************************//
// When using the master to update specific years, these are the only lines 
// of code that should be changed. Everything else should remain consistent.

// Time boundaries for the season of analysis
var startSeason = '2016-03-01';               
var endSeason = '2016-05-31'; 

// Configure the variables for the applicable Landsat sensor
var Landsat_Sensor = 'LANDSAT/LC8_SR'          
var blue = 'B2';                              
var green = 'B3';                            
var red = 'B4';                              
var nir = 'B5';                              
var swir1 = 'B6';                            
var swir2 = 'B7';   

// Specify the name and location of your Digital Elevation Model (DEM) file
var dem_file_name = 'users/USER_NAME/ASTER_GDEM_V2';

// Specify the id of the fusion table containing your study area geometry
var study_area_FT = 'ft:study_area_GCW_fusion_table_id';

// Specify the id of the fusion table containing the training areas
var training_area_FT = 'ft:Polygons_2016_fusion_table_id';

// Specify the inputs to the classifer
var inputs = [nir, red, green, blue, 'DEM', 'ndvi', 'slope', swir1, swir2,'costBuffer','1998_mask'];

// Specify the seed for the pseudo-random number generator
// If running the bootstrap aggregation, change this value every time you run the script
var seed = 1;

// Specify the palette colors for the display of the classification
var waterColor = '00008B';
var ripVegColor = '009933';
var ripSedColor = 'B8860B';
var deadVegColor = '666633';
var canyonColor = 'ff944d';
var exposedLakeBedColor = 'e6e600';

// Specify the name for the exported classified image and the Google Drive Folder
var drive_export_name = 'Classified_2016';
var drive_visualized_export_name = 'Classified_Visualized_2016';
var google_drive_folder = 'ClassificationResults';
var asset_export_name = 'Classified_2016_Seed_1';

//*************************************************************************************//
//**********************Main Script for the Compositing & Classification***************//
//*************************************************************************************//

// Import and store the Study Area geometry as a Feature Collection of type geometry
var study_area = ee.FeatureCollection(study_area_FT, 'geometry');

// Import and store the Study Area geometry as a Feature Collection of type geometry
var training_areas = ee.FeatureCollection(training_area_FT, 'geometry');
var water = ee.FeatureCollection(training_areas.filterMetadata('property', 'equals', 'water'));
var riparianVegetation = ee.FeatureCollection(training_areas.filterMetadata('property', 'equals', 'riparianVegetation'));
var riparianSediment = ee.FeatureCollection(training_areas.filterMetadata('property', 'equals', 'riparianSediment'));
var deadVegetation = ee.FeatureCollection(training_areas.filterMetadata('property', 'equals', 'deadVegetation'));
var canyon = ee.FeatureCollection(training_areas.filterMetadata('property', 'equals', 'canyon'));
var exposedLakeBed = ee.FeatureCollection(training_areas.filterMetadata('property', 'equals', 'exposedLakeBed'));


//*************************************************************************************//
//**********Part 1: Reduce the seasonal imagery into a single composite image*********//
//*************************************************************************************//

// Compile the 1998 Water Mask 
// Build the Season Collection for the 1998 Water Mask
var waterCollection = ee.ImageCollection('LANDSAT/LT5_SR')
   .filterBounds(study_area)
  .filterDate('1998-03-01', '1998-05-31');
  
// Apply the Cloud Mask and Threshold for Water in 1998 to produce the 1998 water extent
var season1998 = waterCollection.map(addIndicesAndRemoveCloud1995);
var waterMaskMin = season1998.min()
var waterMaskMax = season1998.max()
var NDVIMask = waterMaskMin.select('ndvi').lt(0).rename(ee.String('ndvi_mask'));
var NDWIMask = waterMaskMax.select('ndwi').gt(0).rename(ee.String('ndwi_mask'));
var MNDWIMask = waterMaskMax.select('mndwi').gt(0).rename(ee.String('mndwi_mask'));
var masks1998 = NDVIMask.addBands([NDWIMask, MNDWIMask]).clip(study_area);
var waterMask1998 = masks1998.reduce(ee.Reducer.mode()).rename('1998_mask');

// Compile the Landsat seasonal composite for the current study year
var seasonCollection = ee.ImageCollection(Landsat_Sensor)
   .filterBounds(study_area)
  .filterDate(startSeason, endSeason);
  
// Add the Cloud Mask, the NDVI, and the Water Mask for every image in the season
var seasonIndices = seasonCollection.map(addIndicesAndRemoveCloud);
var maskedSeason = seasonCollection.map(maskClouds);

// Compute the water mask
var min = seasonIndices.min();
var max = seasonIndices.max();
var NDVIMask = min.select('ndvi').lt(0).rename(ee.String('ndvi_mask'));
var NDWIMask = max.select('ndwi').gt(0).rename(ee.String('ndwi_mask'));
var MNDWIMask = max.select('mndwi').gt(0).rename(ee.String('mndwi_mask'));
var masks = NDVIMask.addBands([NDWIMask, MNDWIMask]).clip(study_area);
var mask = masks.reduce(ee.Reducer.mode()).rename('water_mask');

// Reduce the seasonal collection into a composite image based on median pixel value
var median = maskedSeason.median();
median = median.addBands([min.select('ndvi')])

// Add the Digital Elevation Model and Slope to the Composite Image
var DEM = ee.Image(dem_file_name);
var slope = ee.Terrain.slope(DEM);

// Compute the Water Mask and the Horizontal Distance and Cost Distance to Water
var mask = median.select('ndvi').lt(0).rename('water_mask');
var distance = mask.distance(ee.Kernel.euclidean(90, "meters"));
var image = ee.Image.constant(91).toDouble().clip(study_area).addBands([distance])
var buffer = image.reduce(ee.Reducer.min());
var cost_distance = slope.cumulativeCost(mask, 6000);
var image2 = ee.Image.constant(6001).toDouble().clip(study_area).addBands([cost_distance])
var costBuffer = image2.reduce(ee.Reducer.min());

// Add all the computed inputs to the median image as additional bands
var finalComposite = median.addBands([costBuffer.rename('costBuffer'), waterMask1998.rename('1998_mask'), DEM.rename('DEM'), slope.rename('slope'), buffer.rename('distance')]).clip(study_area); 

// Optional Commands to display the True Color, DEM, Slope, NDVI, and SWIR-NIR, Red
// Remove the // before each line to display on Map 
Map.setCenter(-113.756144, 35.966608, 10);
Map.addLayer(finalComposite, {bands: [ nir, red, green ], min: 0, max: 3500}, 'Color Infrared');
//Map.addLayer(finalComposite, {bands: [ 'dem'], min:282, max:1036}, 'Elevation')
//Map.addLayer(finalComposite, {bands: ['slope'], min:0, max:45}, 'Slope')
//Map.addLayer(finalComposite, {bands: [ 'ndvi'], min:-1, max:1}, 'NDVI')
//Map.addLayer(finalComposite, {bands: [swir1, nir, red], min:500, max:4000}, 'SWIR')
//Map.addLayer(finalComposite, {bands: [ 'costBuffer'], min:0, max:91}, 'Cost Distance')
//Map.addLayer(waterMask1998)


//*************************************************************************************//
//**********Part 2: Classify the Composite Image into 6 land cover types***************//
//*************************************************************************************//

// Add a pseudo-random column to the training polygons in order to divide into test/train
// Add the pseudo-random to each land cover type to preserve class distribution in test/train
var water = water.randomColumn('random', seed);
var riparianVegetation = riparianVegetation.randomColumn('random', seed);
var riparianSediment = riparianSediment.randomColumn('random', seed);
var deadVegetation = deadVegetation.randomColumn('random', seed);
var canyon = canyon.randomColumn('random', seed);
var exposedLakeBed = exposedLakeBed.randomColumn('random', seed);

// Check which classes are present and store to help with confusion matrix
var classesPresent = ee.List([]);
classesPresent = ee.List(ee.Algorithms.If(water.size().neq(0), classesPresent.add(0), classesPresent));
classesPresent = ee.List(ee.Algorithms.If(riparianVegetation.size().neq(0), classesPresent.add(1), classesPresent));
classesPresent = ee.List(ee.Algorithms.If(riparianSediment.size().neq(0), classesPresent.add(2), classesPresent));
classesPresent = ee.List(ee.Algorithms.If(deadVegetation.size().neq(0), classesPresent.add(3), classesPresent));
classesPresent = ee.List(ee.Algorithms.If(canyon.size().neq(0), classesPresent.add(4), classesPresent));
classesPresent = ee.List(ee.Algorithms.If(exposedLakeBed.size().neq(0), classesPresent.add(5), classesPresent));

var riparianPresent = ee.List([]);
riparianPresent = ee.List(ee.Algorithms.If(classesPresent.contains(1), riparianPresent.add(1), riparianPresent));
riparianPresent = ee.List(ee.Algorithms.If(classesPresent.contains(2), riparianPresent.add(2), riparianPresent));
riparianPresent = ee.List(ee.Algorithms.If(classesPresent.contains(3), riparianPresent.add(3), riparianPresent));
riparianPresent = ee.List(ee.Algorithms.If(classesPresent.contains(5), riparianPresent.add(5), riparianPresent));

// Merge all the training areas into a single Feature Collection 
var aoi = water.merge(riparianVegetation).merge(riparianSediment).merge(deadVegetation).merge(canyon).merge(exposedLakeBed);

// Select the selected classification inputs from the composite image
var inputComposite = finalComposite.select(inputs)

// Build the sample regions of the image as defined by the training areas
// Only bring the numeric class id (landcover), random column, and inputs
var samples = inputComposite.sampleRegions({
  collection: aoi,
  properties: ['landcover', 'random'],
  scale: 30
})


// Divide the Sample Areas into Training (90%) and Testing (10%)
// Store the order of inputs to add make into the training/testing feature collections
var band_order = ee.List(samples.get('band_order'))

// Function which identifies the random number of the pixel that marks the 10% divide
var identifyThresholds = function(classNumber, list) {
  // Filter for all the sample pixels of the land cover class type
  var classType = ee.FeatureCollection(samples).filterMetadata('landcover', 'equals', classNumber);
  // Sort the list of pixels in order by the random number column
  var polys = classType.sort("random").toList(3000);
  // Identify the index of the pixel that marks 10% of the total pixels
  var end = ee.Number(polys.size().divide(10)).toInt();
  // Assuming the list has data, get the random number value from the pixel at the threshold
  var threshold = ee.Algorithms.If(end.neq(0), (ee.Feature(polys.get(end)).get('random')), 0);
  return ee.List(list).add(threshold);
}
// Identify the threshold value for each of the classes present
var thresholds = ee.List(classesPresent.iterate(identifyThresholds, ee.List([])));

// Function to filter for the testing set based on the threshold -- it will take any pixel not greater than the threshold
// This means that the testing will be more than 10% because it will take whole polygons (all the pixels within them)
var buildTesting = function(classNumber, fc) {
  var classType = ee.FeatureCollection(samples).filterMetadata('landcover', 'equals', classNumber);
  return ee.FeatureCollection(fc).merge(ee.FeatureCollection(classType.filterMetadata('random', 'not_greater_than', thresholds.get(classesPresent.indexOf(classNumber)))));
}
var testing = ee.FeatureCollection(classesPresent.iterate(buildTesting, ee.FeatureCollection([])));

// Function to filter for the training set based on the threshold
var buildTraining = function(classNumber, fc) {
  var classType = ee.FeatureCollection(samples).filterMetadata('landcover', 'equals', classNumber);
  return ee.FeatureCollection(fc).merge(ee.FeatureCollection(classType.filterMetadata('random', 'greater_than', thresholds.get(classesPresent.indexOf(classNumber)))));
}
var training = ee.FeatureCollection(classesPresent.iterate(buildTraining, ee.FeatureCollection([])));

// Add the input band order back to the training and testing sets
testing = testing.set('band_order', band_order);
training = training.set('band_order', band_order);

print('Number Training Pixels: ', training.toList(3000).size());
print('Number Testing Pixels: ', testing.toList(3000).size());

// Train the Random Forest Model on the 90% training areas
var classifier = ee.Classifier.randomForest(10).train({
 features: training, 
 classProperty: 'landcover'
});
  
// Run the full study area through the classifier
var classified = finalComposite.classify(classifier);

// Set the Palette to display the classification 
var palette = [waterColor, ripVegColor, ripSedColor, deadVegColor, canyonColor, exposedLakeBedColor];

// Display the Classified Image on the Map
Map.addLayer(classified, {min: 0, max: 5, palette: palette}, 'classification');


//*************************************************************************************//
//**********Part 3: Assess the Accuracy of the Classification**************************//
//*************************************************************************************//

// Run the testing sample areas through the classifier
var validation = testing.classify(classifier); 

// Build an Error Matrix from the testing areas
// The Rows are the true land cover values and the columns are the predicted
var errorMatrix = validation.errorMatrix('landcover', 'classification'); 

// Convert the ErrorMatrix to both a simple array and a Confusion Matrix object
var em = errorMatrix.array();
var confusionMatrix = ee.ConfusionMatrix(em);

// Using built-in functionality, calculate user and producer accuracy
var producers = confusionMatrix.producersAccuracy();
var consumers = confusionMatrix.consumersAccuracy();

// Build the confusion matrix to display based on which classess are present in the classification
var buildCMRow = function(classNumberRow, array) {
  var ColumnValues = function(classNumberColumn, array) {
    return ee.List(array).add(em.get([classNumberRow, classNumberColumn]));
  }
  
  var rowList = ee.List(classesPresent.iterate(ColumnValues, ee.List([])))
  
  return ee.List(array).add(rowList);
}

var ConfusionMatrix = ee.List(classesPresent.iterate(buildCMRow, ee.List([])))

// Calculate the accuraic for the Riparian Classes -- 
// Riparian Vegetation, Riparian Sediment, Dead Vegetation, and Exposed Lake Bed
var Rproducer = function(classNumber, sum) {
  return ee.Number(sum).add(producers.get([classNumber, 0]));
}
var R_producer = ee.Number(riparianPresent.iterate(Rproducer, ee.Number(0))).divide(riparianPresent.length());

var Rconsumer = function(classNumber, sum) {
  return ee.Number(sum).add(consumers.get([0, classNumber]));
}
var R_consumer = ee.Number(riparianPresent.iterate(Rconsumer, ee.Number(0))).divide(riparianPresent.length());

// Calculate the accuracies for all the classes present
var producerAll = function(classNumber, sum) {
  return ee.Number(sum).add(producers.get([classNumber, 0]));
}
var producer = ee.Number(classesPresent.iterate(producerAll, ee.Number(0))).divide(classesPresent.length());

var consumerAll = function(classNumber, sum) {
  return ee.Number(sum).add(consumers.get([0, classNumber]));
}
var consumer = ee.Number(classesPresent.iterate(consumerAll, ee.Number(0))).divide(classesPresent.length());


// Display the Accuracy Calculations to the User on the Console
print('Overall Accuracy: ', confusionMatrix.accuracy());
print('Overall Consumer Accuracy (Row): ', consumer);
print('Overall Producer Accuracy (Column): ', producer);
print('Riparian Consumer Accuracy: ', R_consumer);
print('Riparian Producer Accuracy: ', R_producer);


// Build the List of the class names present in this classification
var classDictionary = ee.Dictionary.fromLists(['0','1','2','3','4','5'], ['Water', 'Riparian Vegetation', 'Riparian Sediment', 'Dead Vegetation', 'Bare Canyon', 'Exposed Lake Bed'])
var buildClassList = function(classNumber, list) {
  return ee.List(list).add(classDictionary.get(ee.String(classNumber)))
}

var classList = ee.List(classesPresent.iterate(buildClassList, ee.List([])))

// Display the Full Confusion Matrix
var chart = ui.Chart.array.values(ConfusionMatrix, 0, classList)
  .setChartType('Table')
  .setOptions({
    yLabels: classList 
  })
print('Rows True Values, Columns Predicted Values', chart)


//*************************************************************************************//
//**********Part 4: Supporting Functions to Export and add Legend**********************//
//*************************************************************************************//

// Export the classified image to Google Drive (to finish the process, select run in 'Tasks')
Export.image.toDrive({
  image: classified,
  folder: google_drive_folder,
  description: drive_export_name,
  scale: 30,
  region: study_area.geometry().bounds()
})

// Export the visualized classified image to Google Drive (to finish the process, select run in 'Tasks')
var classified_Viz = [waterColor, ripVegColor, ripSedColor, deadVegColor, canyonColor, exposedLakeBedColor];
var imageFinal = classified.visualize({palette: classified_Viz, min: 0, max: 5});
Export.image.toDrive({
  image: imageFinal,
  folder: google_drive_folder,
  description: drive_visualized_export_name,
  scale: 30,
  region: study_area.geometry().bounds()
})

// Export the classified image to the asset folder, this should be done for Bootstrap Aggregation
Export.image.toAsset({
  image: classified,
  description: asset_export_name,
  assetId: asset_export_name,
  scale: 30,
  region: study_area.geometry().bounds()
})

// Display a Legend for the Classified Image
// Code modified from the GEE tutorial

// Create the panel for the legend items.
var legend = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px'
  }
});

// Create and add the legend title.
var legendTitle = ui.Label({
  value: 'Land Cover Classification',
  style: {
    fontWeight: 'bold',
    fontSize: '18px',
    margin: '0 0 4px 0',
    padding: '0'
  }
});
legend.add(legendTitle);

var makeRow = function(color, name) {
  // Create the label that is actually the colored box.
  var colorBox = ui.Label({
    style: {
      backgroundColor: '#' + color,
      // Use padding to give the box height and width.
      padding: '8px',
      margin: '0 0 4px 0'
    }
  });

  // Create the label filled with the description text.
  var description = ui.Label({
    value: name,
    style: {margin: '0 0 4px 6px'}
  });

  return ui.Panel({
    widgets: [colorBox, description],
    layout: ui.Panel.Layout.Flow('horizontal')
  });
};

// Get the list of palette colors and class names from the image.
classified.toDictionary().evaluate(function(result) {
  var palette = [waterColor, ripVegColor, ripSedColor, deadVegColor, canyonColor, exposedLakeBedColor];
  var names = ['Water', 'Riparian Vegetation', 'Riparian Sediment', 'Dead Vegetation', 'Canyon', 'Exposed Lake Bed'];

  for (var i = 0; i < names.length; i++) {
    legend.add(makeRow(palette[i], names[i]));
  }
});

// Add the legend to the map.
Map.add(legend);

// function to compute the vegetation and water indices
function addIndicesAndRemoveCloud(image) {
  var ndvi = image.normalizedDifference([nir, red]);
  var ndwi = image.normalizedDifference([green, nir]);
  var mndwi = image.normalizedDifference([green, swir1]);
  image = image.addBands([ndvi.rename('ndvi'), ndwi.rename('ndwi'), mndwi.rename('mndwi')]);
  var cloud = image.select('cfmask').lt(2);
  return image.updateMask(cloud);
}

// function to apply the cloud mask 
function maskClouds(image) {
  var cloud = image.select('cfmask').lt(2);
  return image.updateMask(cloud);
}

// function to compute the vegetation and water indices and add them to the image for Landsat 5
function addIndicesAndRemoveCloud1995(image) {
  var ndvi = image.normalizedDifference(['B4', 'B3']);
  var ndwi = image.normalizedDifference(['B2', 'B4']);
  var mndwi = image.normalizedDifference(['B2', 'B5']);
  image = image.addBands([ndvi.rename('ndvi'), ndwi.rename('ndwi'), mndwi.rename('mndwi')]);
  var cloud = image.select('cfmask').lt(2);
  return image.updateMask(cloud);
}
