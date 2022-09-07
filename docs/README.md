<!--- 
    SPDX-FileCopyrightText: 2022 Siemens AG
    SPDX-License-Identifier: MIT 
-->
# Documentation


## UI Components
An overview about available UI components for Azure Devops extensions is available here: 

https://developer.microsoft.com/en-us/azure-devops/components/


## REST API
This extensions uses the Azure DevOps REST Api to retrieve information about the work items: 

https://docs.microsoft.com/en-us/rest/api/azure/devops/wit/wiql/query%20by%20wiql?view=azure-devops-rest-6.1


### Queries via REST
For finding continuous-conformance work items the work item query language (WIQL) is used:

https://docs.microsoft.com/en-us/azure/devops/boards/queries/wiql-syntax?view=azure-devops#query-for-links-between-work-items

## Storing data for extensions
This document seems to be quite old, but it's still valid and the only documentation available which describes the `__etag` property:

https://docs.microsoft.com/en-us/azure/devops/extend/develop/data-storage?view=azure-devops

## Further links
https://docs.microsoft.com/en-us/azure/devops/extend/overview?view=azure-devops

https://docs.microsoft.com/en-us/azure/devops/extend/develop/add-workitem-extension?view=azure-devops#add-a-page