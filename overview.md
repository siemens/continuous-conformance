<!--- 
    SPDX-FileCopyrightText: 2022 Siemens AG
    SPDX-License-Identifier: MIT 
-->
# Azure DevOps - Continuous Conformance Extension

This repository generates an [Azure DevOps extension](https://docs.microsoft.com/en-us/azure/devops/extend/overview?view=vsts) by adding a new tab for work items.

## Using the extension

Main entry point for this extension is an additional tab which is part of the detailed view of a work item (see below).

![work-item-page](img/extension.png)

1. The new tab which is available for work items. You can configure via the Azure DevOps process configuration for which work items this tab is shown (see below).
2. Checkbox column to select one or more measures for which a work item will be created.
3. Tooltip which gives a short explanation about each measure.
4. Link to the work item which has been created.
5. Separate columns for work item tags, state, modification date and assignment.

When you create a conformance measure the following work item hierarchy is created:

![work-item-hierarchy](img/hierarchy.png)

1. The feature for which the conformance measure is applicable.
2. Aggregating work item which is the parent for all conformance measures for a single feature. Per default it will get the title "Conformance (Title of Feature)"
3. Specific conformance measure.

The specific measure and the aggregating work item are identified by using tags and relations. You can change the title of the aggregating work item and any specific conformance measures task as you like.

It's also possible to use link a single conformance measure to multiple aggregating work items (e.g. if you do the software clearing in one shot for multiple features). You can also link a single aggregating work item to multiple features. In this case all specific conformance measures aggregated by the linked work item are mapped to multiple features.


## Configure the extension

### General Settings
![general-settings](img/general.png)

👉 Modifying these general settings is not recommended. This should be only done in very rare circumstances. 

It's possible to configure for a project to use different work item types or a custom tag for identifying conformance work items.

Also you can change the types of the work items which are used for aggregation and for the conformance measures itself.

### Configure Conformance Measures
![measure-settings](img/measure.png)

Every measure has certain properties which you can configure.

1. Tooltip
The tooltip is shown in the conformance tab when you hoover your mouse over the name of a conformance measure (see above).

2. Description
You can provide a default description for a conformance measure. This description will be added to the newly create conformance measure.

3. Menu
All modifications must be saved, otherwise their are not applied. You can modify different measure and save your changes when you're done or you can save in between.

Additional you have the possibility to create new measures or remove existing measures. For adding a new measure just click on the create button. If you want to delete an existing measure, you need to select measure and then click on the **Remove** button.

There's also the possibility to revert all your changes and use the default settings again.

‼ Reverting to the default settings is done immediately and you don't need to save this change. ‼

4. Tags
You can add additional tags for each measure. This tags will be assigned to each newly created work item and will be also shown in the conformance tab (see above).

### Disable conformance tab for specific work items

You need to adapt the Azure Boards process via the Organization settings:

![configure-tab](img/customization.png)
