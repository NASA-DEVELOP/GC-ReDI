Notices:
This software may be used, reproduced, and provided to others only as permitted under the terms of the agreement under which it was acquired from the U.S. Government. Neither title to, nor ownership of, the software is hereby transferred. This notice shall remain on all copies of the software.
  
Disclaimers
No Warranty: THE SUBJECT SOFTWARE IS PROVIDED "AS IS" WITHOUT ANY WARRANTY OF ANY KIND, EITHER EXPRESSED, IMPLIED, OR STATUTORY, INCLUDING, BUT NOT LIMITED TO, ANY WARRANTY THAT THE SUBJECT SOFTWARE WILL CONFORM TO SPECIFICATIONS, ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR FREEDOM FROM INFRINGEMENT, ANY WARRANTY THAT THE SUBJECT SOFTWARE WILL BE ERROR FREE, OR ANY WARRANTY THAT DOCUMENTATION, IF PROVIDED, WILL CONFORM TO THE SUBJECT SOFTWARE. THIS AGREEMENT DOES NOT, IN ANY MANNER, CONSTITUTE AN ENDORSEMENT BY GOVERNMENT AGENCY OR ANY PRIOR RECIPIENT OF ANY RESULTS, RESULTING DESIGNS, HARDWARE, SOFTWARE PRODUCTS OR ANY OTHER APPLICATIONS RESULTING FROM USE OF THE SUBJECT SOFTWARE.  FURTHER, GOVERNMENT AGENCY DISCLAIMS ALL WARRANTIES AND LIABILITIES REGARDING THIRD-PARTY SOFTWARE, IF PRESENT IN THE ORIGINAL SOFTWARE, AND DISTRIBUTES IT "AS IS." 
 
Waiver and Indemnity:  RECIPIENT AGREES TO WAIVE ANY AND ALL CLAIMS AGAINST THE UNITED STATES GOVERNMENT, ITS CONTRACTORS AND SUBCONTRACTORS, AS WELL AS ANY PRIOR RECIPIENT.  IF RECIPIENT'S USE OF THE SUBJECT SOFTWARE RESULTS IN ANY LIABILITIES, DEMANDS, DAMAGES, EXPENSES OR LOSSES ARISING FROM SUCH USE, INCLUDING ANY DAMAGES FROM PRODUCTS BASED ON, OR RESULTING FROM, RECIPIENT'S USE OF THE SUBJECT SOFTWARE, RECIPIENT SHALL INDEMNIFY AND HOLD HARMLESS THE UNITED STATES GOVERNMENT, ITS CONTRACTORS AND SUBCONTRACTORS, AS WELL AS ANY PRIOR RECIPIENT, TO THE EXTENT PERMITTED BY LAW.  RECIPIENT'S SOLE REMEDY FOR ANY SUCH MATTER SHALL BE THE IMMEDIATE, UNILATERAL TERMINATION OF THIS AGREEMENT.

Grand Canyon Regions of Drought Impact (GC-ReDI)
READ_ME.txt
Last Updated: 11/10/2016

Purpose: 
Beginning in 1998, a drought in the Southwestern United States caused water levels in Lake Mead to fall to historic lows and uncover thousands of acres of lakebed sediment along the shoreline. This software quantifies and visualizes the decreasing water levels and land cover changes in the Lower Grand Canyon. The software provides images, statistics, and graphs to understand these changes.

The software has been designed for use by the Grand Canyon National Park Service to support future monitoring of the changing spatial extents of water and riparian land cover due to multi-year drought.

How to Use: The scripts are designed to be used in the following ways: 
(1) Water Feature Extraction from the Lower Grand Canyon for every year between 1998-2016;
(2) Land Cover Classification of the Lower Grand Canyon in 1998, 2003, 2007, 2011, and 2016;
(3) Change Detection over the study period.


How to Run: These scripts are designed to be run through Google Earth Engine's Code Editor. First, you will need a developer account with Google Earth Engine, which can be requested at https://earthengine.google.com/. Then you will need to copy the scripts located here and paste them into your Code Editor. You can then save the script into your personal repository. To run, press the 'Run' button located at the top of the Code Editor.

Below are the details for running for each of the two functions: 

Water Feature Extraction: 
(1) Create a new Google Fusion Table by uploading the KML file containing the shape of the training area (study_area_GCW.kml)
(2) Copy the table id (File > About the Table > ID) to the space provided in line 21 (study_area_FT)
(3) Create a new Google Fusion Table by uploading the KML file 'WaterAccuracyPolygons'. 
(4) Copy the table id (File > About this Table > ID) to the space provided in line 24 (validation_areas_FT). 
(5) Run the script
(6) On the console will be displayed an interactive chart with the water surface areas over time as well as the accuracy measurements for a subset of the study years. 
To Export to Google Drive: An example of how to export one of the water masks is written in Part 4 of the script. Uncomment these lines by remove the '//' at the beginning of each line and change any details to the relevant year you would like to export. Once these changes are made, run the script, navigate to 'Tasks' on the right side, and select 'Run' next to the name of the export.

Land Cover Classification: 
(1) Upload the provided ASTER DEM file to 'Assets' in your personal Google Earth Engine account. Copy the file path of the uploaded dem (Click on the Asset > Image ID) to line 26 (dem_file_name) in the classification script. 
(2) Create a new Google Fusion Table by uploading the KML file containing the shape of the training area (study_area_GCW.kml)
(3) Copy the table id (File > About the Table > ID) to the space provided in line 29 (study_area_FT)
(4) Create a new Google Fusion Table by uploading the KML file containing the training areas for the year for which you would like to run the classification. (Polygons_YEAR.kml)
(5) Copy the table id (File > About the Table > ID) to the space provided in line 32
(6) Run the script
(7) On the console will be displayed the accuracy measurments based on the ~10% of pixels reserved for validation
To Export: Navigate to the "Tasks" bar on the far right, and select 'Run' next to the export of your choice:
- Classified_YEAR : the complete classified image, ideal if you would like to manipulate it further in other processing software, exports to Google Drive
- Classified_Visualized_YEAR : the classified image visualized in the specified color scheme. Image ready for display immediately after export, exports to Google Drive
- Classified_YEAR_Seed_NUMBER: the same as classified image, but exports to the Asset folder on Google Earth Engine

To run Bootstrap Aggregation:
(1) Set the seed number (we used 1, 2, 3, 4, 5) in line 39 and line 53
(2) Run the script and manually record the accuracies to average manually later
(3) Run the export task 'Classified_YEAR_Seed_NUMBER'
(4) Repeat 1-3 for as many seeds as you would like
(5) Navigate to your assets folder and create a new image collection (+ New image collection)
(6) Move all the Classified_YEAR_Seed_NUMBER files to the image collection
(7) Navigate to the script titled 'FinalResultBootstrapAggregation' 
(8) Copy the file path of the image collection (Click on the Asset > ImageCollection ID) to line 14 (classifiedCollection_file_path)
(9) Run the script
(10) Export the result by navigating to the 'Tasks' and selecting the export version you want


Change Detection: 
(1) Make sure all the image years (1998, 2003, 2007, 2011, and 2016) classified images are stored in your Assets
(2) Copy the file path of the classified images to lines 18-22 (landcover_YEAR_file_path)
(3) Multiple change images and graphs will be displayed 


For a tutorial on uploading KML files to a Google Fusion Table, see: https://developers.google.com/earth-engine/importing. 


How to Modify: Once the scripts have been saved in Google Earth Engine's Code Editor, you are able to modify them. Visualization colors are all defined at the top of the scripts in the section marked "Global Variables", you can easily adjust the CSS Colors there and the changes will be applied to the results. The Water Feature Extraction script can be easily changed to include more years as time passes. However, the land cover classification scripts have selected training and testing areas which have been chosen for a specific year. The script can be applied to new years, but new training areas will need to be selected.  


