/*
Notices:
This software may be used, reproduced, and provided to others only as permitted under the terms of the agreement under which it was acquired from the U.S. Government. Neither title to, nor ownership of, the software is hereby transferred. This notice shall remain on all copies of the software.
  
Disclaimers
No Warranty: THE SUBJECT SOFTWARE IS PROVIDED "AS IS" WITHOUT ANY WARRANTY OF ANY KIND, EITHER EXPRESSED, IMPLIED, OR STATUTORY, INCLUDING, BUT NOT LIMITED TO, ANY WARRANTY THAT THE SUBJECT SOFTWARE WILL CONFORM TO SPECIFICATIONS, ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR FREEDOM FROM INFRINGEMENT, ANY WARRANTY THAT THE SUBJECT SOFTWARE WILL BE ERROR FREE, OR ANY WARRANTY THAT DOCUMENTATION, IF PROVIDED, WILL CONFORM TO THE SUBJECT SOFTWARE. THIS AGREEMENT DOES NOT, IN ANY MANNER, CONSTITUTE AN ENDORSEMENT BY GOVERNMENT AGENCY OR ANY PRIOR RECIPIENT OF ANY RESULTS, RESULTING DESIGNS, HARDWARE, SOFTWARE PRODUCTS OR ANY OTHER APPLICATIONS RESULTING FROM USE OF THE SUBJECT SOFTWARE.  FURTHER, GOVERNMENT AGENCY DISCLAIMS ALL WARRANTIES AND LIABILITIES REGARDING THIRD-PARTY SOFTWARE, IF PRESENT IN THE ORIGINAL SOFTWARE, AND DISTRIBUTES IT "AS IS." 
 
Waiver and Indemnity:  RECIPIENT AGREES TO WAIVE ANY AND ALL CLAIMS AGAINST THE UNITED STATES GOVERNMENT, ITS CONTRACTORS AND SUBCONTRACTORS, AS WELL AS ANY PRIOR RECIPIENT.  IF RECIPIENT'S USE OF THE SUBJECT SOFTWARE RESULTS IN ANY LIABILITIES, DEMANDS, DAMAGES, EXPENSES OR LOSSES ARISING FROM SUCH USE, INCLUDING ANY DAMAGES FROM PRODUCTS BASED ON, OR RESULTING FROM, RECIPIENT'S USE OF THE SUBJECT SOFTWARE, RECIPIENT SHALL INDEMNIFY AND HOLD HARMLESS THE UNITED STATES GOVERNMENT, ITS CONTRACTORS AND SUBCONTRACTORS, AS WELL AS ANY PRIOR RECIPIENT, TO THE EXTENT PERMITTED BY LAW.  RECIPIENT'S SOLE REMEDY FOR ANY SUCH MATTER SHALL BE THE IMMEDIATE, UNILATERAL TERMINATION OF THIS AGREEMENT.
*/

//********************************** LAND COVER CHANGE DETECTION **********************************//
// Land Cover Change Detection
// Study Area: Lake Mead and Lower Grand Canyon
// Study Period: 1998-2016
// Purpose: To compute and visualize the changes in land cover between each of the classified 
// image years -- 1998, 2003, 2007, 2011, and 2016.

//**************************************************************************************//
//*************************************GLOBAL VARIABLES*********************************//
//**************************************************************************************//

// Specify the id of the fusion table containing your study area geometry
var study_area_FT = 'ft:study_area_GCW_fusion_table_id';

// Specify the ids for the classified images 
// The images will need to be uploaded to Assets, the id can then 
// be located under "Image ID" after clicking on the Asset
var landcover_1998_file_path = 'users/USER_NAME/Classified_1998_Final';
var landcover_2003_file_path = 'users/USER_NAME/Classified_2003_Final';
var landcover_2007_file_path = 'users/USER_NAME/Classified_2007_Final';
var landcover_2011_file_path = 'users/USER_NAME/Classified_2011_Final';
var landcover_2016_file_path = 'users/USER_NAME/Classified_2016_Final';

// Specify the CSS colors you would like to use to display and visualize the classified images
var waterColor = '00008B';
var ripVegColor = '009933';
var ripSedColor = 'B8860B';
var deadVegColor = '666633';
var bareCanyonColor = 'f5f5dc';
var exposedLakeBedColor = 'e6e600';

// Specify the CSS colors for the change maps
var full_palette = ['ffffff', // No Change
                    '996600', // Water To Riparian Sediment
                    '009933', // Water to Riparian Vegetation
                    'ffff80', // Water to Exposed Lake Bed
                    '99ff66', //  Riparian Sediment to Riparian Vegetation
                    '997a00', //  Riparian Sediment to Dead Vegetation
                    'ffffcc', //  Riparian Sediment to Exposed Lake Bed?
                    '333300', //  Riparian Vegetation to Dead Vegetation
                    'b3b300', //  Riparian Vegetation to Exposed Lake Bed
                    '00008B', // Water to Dead Vegetation
];

//*************************************************************************************//
//**********************Main Script for Land Cover Change Detection********************//
//*************************************************************************************//

// Import and store the Study Area geometry as a Feature Collection of type geometry
var study_area = ee.FeatureCollection(study_area_FT, 'geometry');
Map.setCenter(-113.756144, 35.966608, 10);

// Import and store the classified images and clip them to the study boundaries
var lc_1998 = ee.Image(landcover_1998_file_path).clip(study_area);
var lc_2003 = ee.Image(landcover_2003_file_path).clip(study_area);
var lc_2007 = ee.Image(landcover_2007_file_path).clip(study_area);
var lc_2011 = ee.Image(landcover_2011_file_path).clip(study_area);
var lc_2016 = ee.Image(landcover_2016_file_path).clip(study_area);


//*************************************************************************************//
//**********Part 1: Identify Areas of Water Loss and Color Those Areas*****************//
//*************************************************************************************//

// For each of the intervals find the area where water was lost and what type of 
// land cover replaced it

var color_palette = ['ffffff', ripVegColor, ripSedColor, deadVegColor, exposedLakeBedColor];

// 1998 - 2003
var waterLoss_1998_2003 = lc_1998.eq(0).and(lc_2003.neq(0));
var change_1998_2003 = identifyChange(waterLoss_1998_2003, lc_2003);
//Map.addLayer(change_1998_2003, {palette: color_palette}, 'Change from Water 1998 to 2003');

// 2003 - 2007
var waterLoss_2003_2007 = lc_2003.eq(0).and(lc_2007.neq(0));
var change_2003_2007 = identifyChange(waterLoss_2003_2007, lc_2007);
//Map.addLayer(change_2003_2007, {palette: color_palette}, 'Change from Water 2003 to 2007');

// 2007 - 2016
var waterLoss_2007_2011 = lc_2007.eq(0).and(lc_2011.neq(0));
var change_2007_2011 = identifyChange(waterLoss_2007_2011, lc_2011);
//Map.addLayer(change_2007_2011, {palette: color_palette}, 'Change from Water 2007 to 2011');

// 2011 - 2016
var waterLoss_2011_2016 = lc_2011.eq(0).and(lc_2016.neq(0));
var change_2011_2016 = identifyChange(waterLoss_2011_2016, lc_2016);
//Map.addLayer(change_2011_2016, {palette: color_palette}, 'Change from Water 2011 to 2016');

// 1998 - 2016
var waterLoss_1998_2016 = lc_1998.eq(0).and(lc_2016.neq(0));
var change_1998_2016 = identifyChange(waterLoss_1998_2016, lc_2016);
Map.addLayer(change_1998_2016, {palette: color_palette}, 'Change from Water 1998 to 2016');

Export.image.toDrive({
  image: change_1998_2016,
  description: 'change_1998_2016_bound_by_water',
  scale: 30,
  region: study_area.geometry().bounds()
});


// Helper function to compute changes in water lost zones
function identifyChange(waterLoss, newClassified) {
  // water to exposed lake bed
  var first = waterLoss.eq(1).and(newClassified.eq(5)).remap([1], [5]);
  // water to dead vegetation
  var second = waterLoss.eq(1).and(newClassified.eq(3)).remap([1], [3]);
  // water to riparian sediment
  var third = waterLoss.eq(1).and(newClassified.eq(2)).remap([1], [2]);
  // water to riparian vegetation
  var fourth = waterLoss.eq(1).and(newClassified.eq(1)).remap([1], [1]);
  var fifth = waterLoss.remap([0,1], [0, 6])
  var change = fifth.addBands([first, second, third, fourth]);
  change = change.reduce(ee.Reducer.min())
  return change;
}


//*************************************************************************************//
//*****Part 2: Display Images for Each Land Cover as Color Ramps over Time*************//
//*************************************************************************************//

// Show the progression of various classes over time

// Riparian Vegetation 
// Show Vegetation Gain in Green, Vegetation Loss in Red, and Vegetation Gain then Loss in Yellow
var vegetationLost = lc_1998.eq(1).and(lc_2016.neq(1)).remap([0, 1], [0, 1]); // Pixels where Vegetation was present in 1998 and not in 2016
var vegetationGained = lc_1998.neq(1).and(lc_2016.eq(1)).remap([0, 1], [0, 2]); // Pixels where Vegetation was not present in 1998 and was in 2016
// Pixels where there was no vegetation in 1998 or 2016, but had riparian vegetation at some point between the years
var vegetationBase = lc_1998.neq(1).and(lc_2016.neq(1));
var vegetationGainLoss1 = vegetationBase.eq(1).and(lc_2003.eq(1)).remap([0, 1], [0, 3]); 
var vegetationGainLoss2 = vegetationBase.eq(1).and(lc_2007.eq(1)).remap([0, 1], [0, 3]);
var vegetationGainLoss3 = vegetationBase.eq(1).and(lc_2011.eq(1)).remap([0, 1], [0, 3]);
var vegetationChange = vegetationLost.addBands([vegetationGained, vegetationGainLoss1, vegetationGainLoss2, vegetationGainLoss3]);
vegetationChange = vegetationChange.reduce(ee.Reducer.max())
Map.addLayer(vegetationChange, {palette: ['b3b3cc', 'cc0000', '009933', 'e6b800'], min: 0, max: 3}, 'Riparian Vegetation Change');

Export.image.toDrive({
  image: vegetationChange,
  description: 'VegetationChange',
  folder: 'ChangeResults',
  scale: 30,
  region: study_area.geometry().bounds()
});

// Exposed Lake Bed 
// show the addition of exposed lake bed during each of the four time intervals
var lakeBedGain_1998_2003 = lc_1998.neq(5).and(lc_2003.eq(5)).remap([0,1], [0,1]);
var lakeBedGain_2003_2007 = lc_2003.neq(5).and(lc_2007.eq(5)).remap([0,1], [0,2]);
var lakeBedGain_2007_2011 = lc_2007.neq(5).and(lc_2011.eq(5)).remap([0,1], [0,3]);
var lakeBedGain_2011_2016 = lc_2011.neq(5).and(lc_2016.eq(5)).remap([0,1], [0,4]);
var lakeBedChange = lakeBedGain_1998_2003.addBands([lakeBedGain_2003_2007, lakeBedGain_2007_2011, lakeBedGain_2011_2016]);
lakeBedChange = lakeBedChange.reduce(ee.Reducer.max())
Map.addLayer(lakeBedChange, {palette: ['b3b3cc', '806c00', 'ccad00', 'ffe033', 'fff4b3'], min: 0, max: 4}, 'Exposed Lake Bed Change');

Export.image.toDrive({
  image: lakeBedChange,
  description: 'LakeBedChange',
  scale: 30,
  region: study_area.geometry().bounds()
});


var water_palette = ['b3b3cc', '000080', '0000e6', '4d4dff', 'ccccff', 'e6e6ff'];

// Water changes over time -- classification results not water feature extraction 
var waterExtent2016 = lc_2016.eq(0);
var waterLoss = waterLoss_1998_2003.addBands([waterLoss_2003_2007.remap([0,1], [0,2]), 
                                              waterLoss_2007_2011.remap([0,1], [0,3]), 
                                              waterLoss_2011_2016.remap([0,1], [0,4]), 
                                              waterExtent2016.remap([0,1], [0,5])])
waterLoss = waterLoss.reduce(ee.Reducer.max());
Map.addLayer(waterLoss, {palette: water_palette}, 'Water Loss');

//*************************************************************************************//
//*****Part 3: Compare all changes to have full change image with multiple classes*****//
//*************************************************************************************//

// The Change Classes are as follows: 
//      (0) None of the Below Changes
//      (1) Water To Riparian Sediment
//      (2) Water to Riparian Vegetation
//      (3) Water to Exposed Lake Bed
//      (4) Riparian Sediment to Riparian Vegetation
//      (5) Riparian Sediment to Dead Vegetation
//      (6) Riparian Sediment to Exposed Lake Bed
//      (7) Riparian Vegetation to Dead Vegetation
//      (8) Riparian Vegetation to Exposed Lake Bed
//      (9) Water to Dead Vegetation

// 1998 - 2003
var fullChange_1998_2003 = identifyFullChange(lc_1998, lc_2003).set('Change', '1998 to 2003').set('Number', 1);
//Map.addLayer(fullChange_1998_2003, {palette: full_palette}, 'Change 1998 to 2003');

// 2003  - 2007
var fullChange_2003_2007 = identifyFullChange(lc_2003, lc_2007).set('Change', '2003 to 2007').set('Number', 2);
//Map.addLayer(fullChange_2003_2007, {palette: full_palette}, 'Change 2003 to 2007');

// 1998  - 2007
var fullChange_1998_2007 = identifyFullChange(lc_1998, lc_2007).set('Change', '1998 to 2007').set('Number', 3);
//Map.addLayer(fullChange_1998_2007, {palette: full_palette}, 'Change 1998 to 2007');

// 2007 - 2011
var fullChange_2007_2011 = identifyFullChange(lc_2007, lc_2011).set('Change', '2007 to 2011').set('Number', 4);
//Map.addLayer(fullChange_2007_2011, {palette: full_palette}, 'Change 2007 to 2011');

// 2011 - 2016
var fullChange_2011_2016 = identifyFullChange(lc_2011, lc_2016).set('Change', '2011 to 2016').set('Number', 5);
//Map.addLayer(fullChange_2011_2016, {palette: full_palette}, 'Change 2011 to 2016');

// 2007 - 2016
var fullChange_2007_2016 = identifyFullChange(lc_2007, lc_2016).set('Change', '2007 to 2016').set('Number', 6);
//Map.addLayer(fullChange_2007_2016, {palette: full_palette}, 'Change 2007 to 2016');

// 1998 - 2016
var fullChange_1998_2016 = identifyFullChange(lc_1998, lc_2016).set('Change', '1998 to 2016').set('Number', 7);
//Map.addLayer(fullChange_1998_2016, {palette: full_palette}, 'Change 1998 to 2016');

var changeCollection = ee.ImageCollection([fullChange_1998_2003, fullChange_2003_2007, fullChange_1998_2007,  fullChange_2007_2011, fullChange_2011_2016, fullChange_2007_2016, fullChange_1998_2016])

Export.image.toDrive({
  image: fullChange_1998_2016,
  description: 'fullChange_1998_2016',
  folder: 'ChangeResults',
  scale: 30,
  region: study_area.geometry().bounds()
});

// Function to calculate the total surface area for each class for each of the years
var calculateSurfaceAreaChanges = function(number, areaFeatureCollection) {
  
  // Select the classified image for the current year
  var c = ee.Image(changeCollection.filter(ee.Filter.eq('Number', number)).first());
  var changeClass = c.get('Change');
  
  var waterToRS = c.eq(1).multiply(0.0009).reduceRegion({reducer: ee.Reducer.sum(), scale: 30, geometry: study_area}).get('max');
  var waterToRV = c.eq(2).multiply(0.0009).reduceRegion({reducer: ee.Reducer.sum(), scale: 30, geometry: study_area}).get('max');
  var waterToELB = c.eq(3).multiply(0.0009).reduceRegion({reducer: ee.Reducer.sum(), scale: 30, geometry: study_area}).get('max');
  var RSToRV = c.eq(4).multiply(0.0009).reduceRegion({reducer: ee.Reducer.sum(), scale: 30, geometry: study_area}).get('max');
  var RSToDV = c.eq(5).multiply(0.0009).reduceRegion({reducer: ee.Reducer.sum(), scale: 30, geometry: study_area}).get('max');
  var RSToELB = c.eq(6).multiply(0.0009).reduceRegion({reducer: ee.Reducer.sum(), scale: 30, geometry: study_area}).get('max');
  var RVToDV = c.eq(7).multiply(0.0009).reduceRegion({reducer: ee.Reducer.sum(), scale: 30, geometry: study_area}).get('max');
  var RVToELB = c.eq(8).multiply(0.0009).reduceRegion({reducer: ee.Reducer.sum(), scale: 30, geometry: study_area}).get('max');
  
  // Create a feature with the surface area value
  var yearArea = ee.Feature(null, {year: changeClass,
                                   WaterToRipSed: waterToRS,
                                   WaterToRipVeg: waterToRV, 
                                   WaterToELB: waterToELB, 
                                   RipSedToRipVeg: RSToRV,
                                   RipSedToDeadVeg: RSToDV,
                                   RipSedToELB: RSToELB,
                                   RipVegToDeadVeg: RVToDV,
                                   RipVegToELB: RVToELB
  });
  
  return ee.FeatureCollection(areaFeatureCollection).merge(ee.FeatureCollection([yearArea]));
};
var listImages = ee.List([1,2,3,4,5,6,7]);
// Iterate through the list of years and apply the above function to each year
// The result will be an feature collection of all the surface years
var surfaceAreasSpecific = listImages.iterate(calculateSurfaceAreaChanges, ee.FeatureCollection([]));

// Display the Surface Areas as a line graph to the console
var chartSpecific = ui.Chart.feature.byFeature(surfaceAreasSpecific, 'year')
  .setChartType('ColumnChart')
  .setOptions({
    title: 'Land Cover Surface Area Change Categories',
    titleTextStyle: {bold: true, fontSize: 14},
    legend: {position: 'right'},
    fontName: 'Garamond',
    isStacked: true,
    hAxis: {title: 'Year', titleTextStyle: {fontSize:12}, gridlines: {count: 1}, showTextEvery: 1},
    vAxis: {title: 'Surface Area (square km)', titleTextStyle: {fontSize: 12}, gridlines: {count: 10}, maxValue: 60, minValue: 0},
    colors: ['996600','009933', 'ffff80', '99ff66',  '997a00', 'ffffcc', '333300', 'b3b300']
});

// Helper function to compute all the 'interesting' changes in the two images
function identifyFullChange(oldClassified, newClassified) {
  var waterToRS = oldClassified.eq(0).and(newClassified.eq(2)).remap([0, 1], [0, 1]);
  var waterToRV = oldClassified.eq(0).and(newClassified.eq(1)).remap([0, 1], [0, 2]);
  var waterToELB = oldClassified.neq(0).and(newClassified.eq(5)).remap([0, 1], [0, 3]);
  var RSToRV = oldClassified.eq(2).and(newClassified.eq(1)).remap([0, 1], [0, 4]);
  var RSToDV = oldClassified.eq(2).and(newClassified.eq(3)).remap([0, 1], [0, 5]);
  var RSToELB = oldClassified.eq(2).and(newClassified.eq(5)).remap([0, 1], [0, 6]);
  var RVToDV = oldClassified.eq(1).and(newClassified.eq(3)).remap([0, 1], [0, 7]);
  var RVToELB = oldClassified.eq(1).and(newClassified.eq(5)).remap([0, 1], [0, 8]);
  var waterToDV = oldClassified.eq(0).and(newClassified.eq(3)).remap([0, 1], [0, 9]);
  var change = waterToRS.addBands([waterToRV, waterToELB, RSToRV, RSToDV, RSToELB, RVToELB, RVToDV, waterToDV])
  change = change.reduce(ee.Reducer.max())
  return change;
}



//*************************************************************************************//
//*****Part 4: Compute the Surface Areas for the LandCover Over Time*******************//
//*************************************************************************************//

var classifiedCollection = ee.ImageCollection([lc_1998.set('YEAR', 1998), 
                                               lc_2003.set('YEAR', 2003), 
                                               lc_2007.set('YEAR', 2007), 
                                               lc_2011.set('YEAR', 2011), 
                                               lc_2016.set('YEAR', 2016)]);
var classifiedYears = ee.List([1998, 2003, 2007, 2011, 2016]);

// Function to calculate the total surface area for each class for each of the years
var calculateSurfaceArea = function(year, areaFeatureCollection) {
  
  // Select the classified image for the current year
  var classified = ee.Image(classifiedCollection.filter(ee.Filter.eq('YEAR', year)).first());
  classified = classified.rename('b1')
  
  // Identify a land cover type and then multiply by 0.0008 -- area of pixel in square kilometers
  var waterArea = classified.eq(0).multiply(0.0009).reduceRegion({reducer: ee.Reducer.sum(), scale: 30, geometry: study_area}).get('b1');
  var ripVegArea = classified.eq(1).multiply(0.0009).reduceRegion({reducer: ee.Reducer.sum(), scale: 30, geometry: study_area}).get('b1');
  var ripSedArea = classified.eq(2).multiply(0.0009).reduceRegion({reducer: ee.Reducer.sum(), scale: 30, geometry: study_area}).get('b1');
  var deadVegArea = classified.eq(3).multiply(0.0009).reduceRegion({reducer: ee.Reducer.sum(), scale: 30, geometry: study_area}).get('b1');
  var exposedLakeBedArea = classified.eq(5).multiply(0.0009).reduceRegion({reducer: ee.Reducer.sum(), scale: 30, geometry: study_area}).get('b1');
  
  // Create a feature with the surface area value
  var yearArea = ee.Feature(null, {year: ee.String(ee.Number(year).toInt()),
                                   Water: waterArea,
                                   RiparianVegetation: ripVegArea, 
                                   RiparianSediment: ripSedArea, 
                                   DeadVegetation: deadVegArea,
                                   ExposedLakeBed: exposedLakeBedArea
  });
  
  return ee.FeatureCollection(areaFeatureCollection).merge(ee.FeatureCollection([yearArea]));
};

// Iterate through the list of years and apply the above function to each year
// The result will be an feature collection of all the surface years
var surfaceAreas = classifiedYears.iterate(calculateSurfaceArea, ee.FeatureCollection([]));

// Display the Surface Areas as a line graph to the console
var surfaceAreaChart = ui.Chart.feature.byFeature(surfaceAreas, 'year')
  .setChartType('ColumnChart')
  .setOptions({
    title: 'Land Cover Surface Area',
    titleTextStyle: {bold: true, fontSize: 14},
    legend: {position: 'right'},
    fontName: 'Garamond',
    isStacked: false,
    hAxis: {title: 'Year', titleTextStyle: {fontSize:12}, gridlines: {count: 1}, showTextEvery: 2},
    vAxis: {title: 'Surface Area (square km)', titleTextStyle: {fontSize:12}, gridlines: {count: 10}, maxValue: 115, minValue: 0},
    colors: [deadVegColor, exposedLakeBedColor, ripSedColor, ripVegColor, waterColor]
});

//*************************************************************************************//
//*****Part 5: Compute the changes between water and anything 1998-2016****************//
//*************************************************************************************//

// identify the pixels where water in 1998 changed to something else by 2016
var waterToWater = lc_1998.eq(0).and(lc_2016.eq(0)).remap([0, 1], [0, 1]);
var waterToRV = lc_1998.eq(0).and(lc_2016.eq(1)).remap([0, 1], [0, 2]);
var waterToRS = lc_1998.eq(0).and(lc_2016.eq(2)).remap([0, 1], [0, 3]);
var waterToDv = lc_1998.eq(0).and(lc_2016.eq(3)).remap([0, 1], [0, 4]);
var waterToELB = lc_1998.eq(0).and(lc_2016.eq(5)).remap([0, 1], [0, 5]);

var change2 = waterToWater.addBands([waterToRV, waterToRS, waterToDv, waterToELB]);
change2 = change2.reduce(ee.Reducer.max())

// Calculate the areas of these changes
var waterToWaterArea = (change2.eq(1)).multiply(0.0009).reduceRegion({reducer: ee.Reducer.sum(), scale: 30, geometry: study_area}).get('max');
var waterToRVArea = (change2.eq(2)).multiply(0.0009).reduceRegion({reducer: ee.Reducer.sum(), scale: 30, geometry: study_area}).get('max');
var waterToRSArea = (change2.eq(3)).multiply(0.0009).reduceRegion({reducer: ee.Reducer.sum(), scale: 30, geometry: study_area}).get('max');
var waterToDvArea = (change2.eq(4)).multiply(0.0009).reduceRegion({reducer: ee.Reducer.sum(), scale: 30, geometry: study_area}).get('max');
var waterToELBArea = (change2.eq(5)).multiply(0.0009).reduceRegion({reducer: ee.Reducer.sum(), scale: 30, geometry: study_area}).get('max');

var CHANGEAREA = ee.FeatureCollection([ee.Feature(null, {type: 'Water to Water', area: waterToWaterArea}),
                                      ee.Feature(null, {type: 'Water to RV', area: waterToRVArea}),
                                      ee.Feature(null, {type: 'Water to RS', area: waterToRSArea}), 
                                      ee.Feature(null, {type: 'Water to DV', area: waterToDvArea}), 
                                      ee.Feature(null, {type: 'Water to ELB', area: waterToELBArea})]
  );

  
var waterToAnythingChange = ui.Chart.feature.byFeature(CHANGEAREA, 'type')
  .setChartType('PieChart')
  .setOptions({
    title: 'Water Surface Area Change 1998-2016',
    titleTextStyle: {bold: true, fontSize: 12},
    legend: {position: 'right'},
    fontName: 'Garamond',
    fontSize: 12,
    colors: [waterColor, ripVegColor, ripSedColor, deadVegColor, exposedLakeBedColor]
});



print(surfaceAreaChart);
print(waterToAnythingChange);
print(chartSpecific);