# Bolt App Template

This project demonstrates the usage of the `@bldrs-ai/conway` viewer component,
built with Three.js. It provides a simple web interface to load 3D models,
allowing users to interact with the scene and adjust rendering settings.

## Features

*   Loads 3D models (including IFC and STEP formats) from user-selected files.
*   Provides a GUI (using `lil-gui`) to control:
    *   Ambient Occlusion
    *   Ambient Light
    *   Shadows (Enable/Disable)
    *   Shadow Quality (Low, Medium, High)

## Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (which includes npm)
*   [Yarn](https://yarnpkg.com/) (recommended package manager)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/bldrs-ai/conway-viewer-demo.git
    cd conway-viewer-demo
    ```
2.  Install dependencies:
    ```bash
    yarn install
    ```

### Running the Demo

To start the development server and open the demo in your browser:

```bash
yarn start
```

This will compile the TypeScript code and launch a local server using Parcel.

### Building for Distribution

To create a distribution-ready build in the `dist/` directory:

```bash
yarn build
```

## Usage

Once the demo is running in your browser:

1.  **Load Model:** Click the "Load Model" button in the GUI and select a 3D model file (e.g., IFC, STEP) from your computer. The viewer uses the `@bldrs-ai/conway` library's loading mechanism.
2.  **Load Environment Map:** OPTIONAL (requires adding HDR maps to the data directory.  See [conway-viewer-demo repo](https://github.com/bldrs-ai/conway-viewer-demo)) Click the "Load Environment Map" button and select an `.hdr` file to use for image-based lighting. Loading an environment map will automatically disable the default ambient light. A good source of free HDR based environments is [Poly Haven](https://polyhaven.com/hdris).
3.  **Adjust Settings:** Use the controls in the GUI to toggle features like Ambient Occlusion, Shadows, and Ambient Light, and to change the Shadow Quality.

## License

This project is licensed under the AGPL-3.0 license. See the [LICENSE](LICENSE) file for details.
