/*
Notices:
This software may be used, reproduced, and provided to others only as permitted under the terms of the agreement under which it was acquired from the U.S. Government. Neither title to, nor ownership of, the software is hereby transferred. This notice shall remain on all copies of the software.
  
Disclaimers
No Warranty: THE SUBJECT SOFTWARE IS PROVIDED "AS IS" WITHOUT ANY WARRANTY OF ANY KIND, EITHER EXPRESSED, IMPLIED, OR STATUTORY, INCLUDING, BUT NOT LIMITED TO, ANY WARRANTY THAT THE SUBJECT SOFTWARE WILL CONFORM TO SPECIFICATIONS, ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR FREEDOM FROM INFRINGEMENT, ANY WARRANTY THAT THE SUBJECT SOFTWARE WILL BE ERROR FREE, OR ANY WARRANTY THAT DOCUMENTATION, IF PROVIDED, WILL CONFORM TO THE SUBJECT SOFTWARE. THIS AGREEMENT DOES NOT, IN ANY MANNER, CONSTITUTE AN ENDORSEMENT BY GOVERNMENT AGENCY OR ANY PRIOR RECIPIENT OF ANY RESULTS, RESULTING DESIGNS, HARDWARE, SOFTWARE PRODUCTS OR ANY OTHER APPLICATIONS RESULTING FROM USE OF THE SUBJECT SOFTWARE.  FURTHER, GOVERNMENT AGENCY DISCLAIMS ALL WARRANTIES AND LIABILITIES REGARDING THIRD-PARTY SOFTWARE, IF PRESENT IN THE ORIGINAL SOFTWARE, AND DISTRIBUTES IT "AS IS." 
 
Waiver and Indemnity:  RECIPIENT AGREES TO WAIVE ANY AND ALL CLAIMS AGAINST THE UNITED STATES GOVERNMENT, ITS CONTRACTORS AND SUBCONTRACTORS, AS WELL AS ANY PRIOR RECIPIENT.  IF RECIPIENT'S USE OF THE SUBJECT SOFTWARE RESULTS IN ANY LIABILITIES, DEMANDS, DAMAGES, EXPENSES OR LOSSES ARISING FROM SUCH USE, INCLUDING ANY DAMAGES FROM PRODUCTS BASED ON, OR RESULTING FROM, RECIPIENT'S USE OF THE SUBJECT SOFTWARE, RECIPIENT SHALL INDEMNIFY AND HOLD HARMLESS THE UNITED STATES GOVERNMENT, ITS CONTRACTORS AND SUBCONTRACTORS, AS WELL AS ANY PRIOR RECIPIENT, TO THE EXTENT PERMITTED BY LAW.  RECIPIENT'S SOLE REMEDY FOR ANY SUCH MATTER SHALL BE THE IMMEDIATE, UNILATERAL TERMINATION OF THIS AGREEMENT.
*/

//*******************PRODUCE FINAL CLASSIFICATION************************************//
// Land Cover Classification - Combining Results of Bootstrap Aggregation
// Study Area: Lake Mead and Lower Grand Canyon

//**************************************************************************************//
//*************GLOBAL VARIABLES TO BE UPDATED DEPENDING ON YEAR STUDIED*****************//
//**************************************************************************************//
// When using the master to update specific years, these are the only lines 
// of code that should be changed. Everything else should remain consistent.

// In your Asset folder, create a new image collection and place all the classifications for a single
// year in that folder. Then add the path to that folder in below.
// Specify the name of the image collection with all the classifications for this study year
var classifiedCollection_file_path = 'users/USER_NAME/Classified_YEAR_IMAGECOLLECTION';

// Specify the id of the fusion table containing your study area geometry
var study_area_FT = 'ft:study_area_GCW_fusion_table_id';

// Specify the palette colors for the display of the classification
var waterColor = '00008B';
var ripVegColor = '009933';
var ripSedColor = 'B8860B';
var deadVegColor = '666633';
var canyonColor = 'ff944d';
var exposedLakeBedColor = 'e6e600';

// Specify the name for the exported classified image and the Google Drive Folder
var drive_export_name = 'Classified_1998';
var drive_visualized_export_name = 'Classified_Visualized_1998';
var google_drive_folder = 'ClassificationResults';
var asset_name = 'Classified_1998_Final';


//*************************************************************************************//
//**********************Main Script for the Compositing & Classification***************//
//*************************************************************************************//

// Upload the folder with all the image classifications as an image collection
var classifiedCollection = ee.ImageCollection(classifiedCollection_file_path);

// Import and store the Study Area geometry as a Feature Collection of type geometry
var study_area = ee.FeatureCollection(study_area_FT, 'geometry');

// Clip the entire collection to the study area
var clipImage = function(image) {return image.clip(study_area);};
classifiedCollection = classifiedCollection.map(clipImage);

// Reduce the Classified Collection to a single image by taking the mode value for each pixel
var classifiedMode = classifiedCollection.reduce(ee.Reducer.mode());

// Set the Palette to display the classification 
var palette = [waterColor, ripVegColor, ripSedColor, deadVegColor, canyonColor, exposedLakeBedColor];

// Display the Classified Image on the Map
Map.addLayer(classifiedMode, {min: 0, max: 5, palette: palette}, 'classification');

// Export the classified image to Google Drive (to finish the process, select run in 'Tasks')
Export.image.toDrive({
  image: classifiedMode,
  folder: google_drive_folder,
  description: drive_export_name,
  scale: 30,
  region: study_area.geometry().bounds()
})

// Export the visualized classified image to Google Drive (to finish the process, select run in 'Tasks')
var classified_Viz = [waterColor, ripVegColor, ripSedColor, deadVegColor, canyonColor, exposedLakeBedColor];
var imageFinal = classifiedMode.visualize({palette: classified_Viz, min: 0, max: 5});
Export.image.toDrive({
  image: imageFinal,
  folder: google_drive_folder,
  description: drive_visualized_export_name,
  scale: 30,
  region: study_area.geometry().bounds()
})

// Export the final image to the Asset folder for use in Change Detection
Export.image.toAsset({
  image: classifiedMode,
  description: asset_name,
  scale: 30,
  region: study_area.geometry().bounds()
})

// Display a Legend for the Classified Image

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
classifiedMode.toDictionary().evaluate(function(result) {
  var palette = [waterColor, ripVegColor, ripSedColor, exposedLakeBedColor, deadVegColor, canyonColor];
  var names = ['Water', 'Riparian Vegetation', 'Riparian Sediment', 'Exposed Lake Bed', 'Dead Vegetation', 'Canyon'];
  for (var i = 0; i < names.length; i++) {
    legend.add(makeRow(palette[i], names[i]));
  }
});

// Add the legend to the map.
Map.add(legend);

// Display a Legend for the Classified Image

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
classifiedMode.toDictionary().evaluate(function(result) {
  var palette = [waterColor, ripVegColor, ripSedColor, exposedLakeBedColor, deadVegColor, canyonColor];
  var names = ['Water', 'Riparian Vegetation', 'Riparian Sediment', 'Exposed Lake Bed', 'Dead Vegetation', 'Canyon'];
  for (var i = 0; i < names.length; i++) {
    legend.add(makeRow(palette[i], names[i]));
  }
});

// Add the legend to the map.
Map.add(legend);
