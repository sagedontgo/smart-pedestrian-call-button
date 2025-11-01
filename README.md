## Smart Pedestrian Call Button

**This repository houses all the code and files utilized in the creation and prototyping of our research project.**

### Local Hosting
*This assumes you already have node.js installed. If not, check out installation instructions [here](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).*


1.) To host the website prototype locally, download the `.zip` file. 


2.) Open the folder named `baguio-safe-cross-main`.


3.) Run the below npm command.
```
npm install vite@^5.4.11 @vitejs/plugin-react-swc@^3.11.0 --legacy-peer-deps
```

4.) After dependencies have been successfully installed, run the below command.

```
npm run dev
```

### ESP32 Behavior
*To recreate the prototype, refer to the Appendices section of the paper, specifically Appendix I, which includes documentation. Circuit diagrams can be found there.*


1.) Prepare 2 ESP32s, one will serve as the "Main" board, and the other will serve as the "Communicator" board.

2.) On the "Main" ESP32, upload the sketch named `main_firmware.ino`. This code handles all logic, including traffic lights, button behavior, buzzer, and sensor math.

3.) On the "Communicator" ESP32, upload the sketch named `communicator_firmware.ino`. This code handles the sensor logic, including when either sensor is broken, the direction a vehicle is going, and approximate vehicle speed.

### 3D Models and Printing
To print the prototype's models, download the .skp file and load them in [SketchUp](https://edu.sketchup.app). There, make any changes you find necessary, then save them as .stl files. Load these files in your 3D printer's software. For this project, we utilized Bambu Labs and their P1S printer.
