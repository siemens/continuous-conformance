/*
 * SPDX-FileCopyrightText: 2022 Siemens AG
 *
 * SPDX-License-Identifier: MIT
 */

import { IConformanceSettings } from "./ConformanceSettings"

export const defaultSettings: IConformanceSettings = {
    availableMeasures: [
        { 
            name: "Product Architecture",
            additionalTags: "Develop",
            toolTip: "Define product architecture",
            description: "Define product architecture (consider also non-functional requirements like performance and sizing, security, data privacy …)<br>Invite for an architecture check for presenting new features to the system architects."
        },
        { 
            name: "Threat and Risk Analysis",
            additionalTags: "Develop",
            description: "If decided in architecture check, a Security Threat and Risk Analysis has to be done to specify protection goals and impacts, to identify and analyze threats from the security point of view.<br>For more information, see Work Instruction \"Threat and Risk Analysis\".<br><br>Note: A fully or partly executed Threat and Risk Analysis typically will not be done in every release. Basically it has to be done once for every product, if the pre-classification results in medium, high or very high risk.<br>Afterwards, a Threat and Risk Analysis may have to be repeated partly or completely, if there are major architectural changes or new external interfaces.<br>The decision, whether and to what extent a Threat and Risk Analysis has to be done for the current release, is made during architecture check."
        },
        {
            name: "Data Privacy",
            additionalTags: "Develop",
            toolTip: "Check Data privacy issues",
            description: "The following checks have to be done:<br>- Does the Application collect log-files/tracking data related to system events, user log-ins or further user interactions?<br>- Is a deletion policy for the log-files/tracking data in place?<br>- Which (further) personal data are processed within the application in addition to log-files/tracking data?<br>- Is the customer given the choice to configure the data collection within the application by itself?<br>- Does the application implement functions that ensure that personal data processed via the Application are accurate, complete and kept up-to-date during their entire information life cycle?<br>- Is a deletion policy for the personal data processed within or by the application in place?<br>- Please use the Data Privacy toolkit . Fill out the form, create a pdf and store it in the project folder.<br>- If necessary, define measures to mitigate identified deficiencies. Support can be given by the responsible Data Privacy Manager."
        },
        {
            name: "Patent Infringement",
            additionalTags: "Develop",
            description: "- Clarify whether to apply for patents for newly developed technologies<br>- Clarify whether third party patents / intellectual property rights are affected"
        },
        {
            name: "PSS Classification",
            additionalTags: "Develop",
            description: "Identify the security classification of the product developed in this project.<br>Note: The general purpose is to identify security threat scenarios in terms of security weaknesses in the systems or products that might be exploited in attacks. Analyze the resulting security risks to understand which security threats are most significant and need to be addressed.<br>The final decision, whether and to what extent a Threat and Risk Analysis has to be done for the current release, is made during architecture check.<br><br>See Work Instruction \"Threat and Risk Analysis\" for more information.<br><br>In case of developing cloud-based or other infrastructure based systems, it must be determined additionally whether the systems have to undergo an Asset Classification and Protection (ACP) process to identify critical assets."
        },
        {
            name: "Third Party Clearing",
            additionalTags: "Release",
            description: "Do the clearing of third-party components for Open Source Software (OSS) and Commcercial Off-The-Shelf (COTS)."
        },
        {
            name: "Export Control (ECC)",
            additionalTags: "Release",
            description: "Identify components for  \"de minimis calculation\"<br>Write input for \"de minimis calculation\" together with experts (License Manager). Input is a simple list containing name of the third party component / company name / license fee / export procedure indicator (ECC number).<br>Send calculation to export control group<br><br>Note: A \"de minimis calculation\" is a list of all third-party components used in the product. It is necessary to determine the percentage (based on cost) of U.S. software. Dependent on the result it is decided whether a product can be delivered (exported) to any country or if there are limitations."
        },
        {
            name: "User Documentation",
            additionalTags: "Release",
            description: "- Complete all manuals and online helps in source language<br>- Perform review of documents by Experts, Product Lifecycle Manager and Project Manager<br>- Perform proofreading by language professional<br>- Technical editor updates manuals and help files according to review comments<br>- Initiate the translation of manuals and help files (optional; only if translation is required)"
        },
        {
            name: "Customer Care Training",
            additionalTags: "Release",
            description: "Train customer care for new features"
        },
        {
            name: "Cloud Costs",
            additionalTags: "Release",
            description: "For every new feature the impact on the cloud costs has to be considered."
        },
        {
            name: "Usability Check",
            additionalTags: "Release",
            description: ""
        }
        
    ],

    conformanceTag: "Conformance",

    workItemType: "Task",

    aggregationWorkItemType: "User Story",

    id: "settings"
}