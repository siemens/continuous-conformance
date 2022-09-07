<!--- 
    SPDX-FileCopyrightText: 2022 Siemens AG
    SPDX-License-Identifier: MIT 
-->

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](code_of_conduct.md)

Continuous Conformance is an Azure DevOps extension which makes it easy to keep track of easily forgotten task during the software development life-cycle.

# Using

A detailed description how to use this extension can be found in [overview.md](overview.md). You can follow the official description for [installing extensions for Azure DevOps](https://docs.microsoft.com/en-us/azure/devops/marketplace/install-extension?view=azure-devops&tabs=browser).

# Build

## Requirements

Mandatory
- Node.js v16.4.1 or newer
- GitVersion 5.6.10 (only required when you don't use the Visual Studio Dev-Container)

Recommended
- Docker
- Visual Studio Code


## CLI
1. Clone the repository either via Visual Studio Code or command line:
```shell
git clone https://github.com/siemens/continuous-conformance
```

2. Restore dependencies:
```shell
npm i
```

3. Start the build:
```shell
gulp
```

## Visual Studio Code

You can also open the repository in a [Visual Studio DevContainer](https://code.visualstudio.com/docs/remote/containers).
In this case it's recommended to [use a volume mount](https://code.visualstudio.com/docs/remote/containers-advanced#_use-clone-repository-in-container-volume) in order to improve the performance.


## Debugging
You can start a local web-server which can be used to debug your local code by using webpack.
The following command can be used together with the **dev** deployment. It will start a web server listening on https://localhost:44300

The **dev** deployment is configured to load the extension via this URL.
```shell
npm run serve:dev
```

## Dependencies

The sample repository depends on a few Azure DevOps packages:

- [azure-devops-extension-sdk](https://github.com/Microsoft/azure-devops-extension-sdk): Required module for Azure DevOps extensions which allows communication between the host page and the extension iframe.
- [azure-devops-extension-api](https://github.com/Microsoft/azure-devops-extension-api): Contains REST client libraries for the various Azure DevOps feature areas.
- [azure-devops-ui](https://developer.microsoft.com/azure-devops): UI library containing the React components used in the Azure DevOps web UI.

Some external dependencies:

- `React` - Is used to render the UI in the samples, and is a dependency of `azure-devops-ui`.
- `TypeScript` - Samples are written in TypeScript and complied to JavaScript
- `SASS` - Extension samples are styled using SASS (which is compiled to CSS and delivered in webpack js bundles).
- `webpack` - Is used to gather dependencies into a single javascript bundle for each sample.

# References

The full set of documentation for developing extensions can be found at [https://docs.microsoft.com/en-us/azure/devops/extend](https://docs.microsoft.com/en-us/azure/devops/extend/?view=vsts).


# Documentation

Further documentation regarding the development of this extension is available in the [doc folder](docs/README.md).


# Contributions
Contributions are always welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

# License

This project use the following license: [MIT](LICENSE.md)