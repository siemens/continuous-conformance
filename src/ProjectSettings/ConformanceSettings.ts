/*
 * SPDX-FileCopyrightText: 2022 Siemens AG
 *
 * SPDX-License-Identifier: MIT
 */

import { WorkItem, WorkItemTrackingRestClient, WorkItemType } from "azure-devops-extension-api/WorkItemTracking";
import * as SDK from "azure-devops-extension-sdk";
import { CommonServiceIds, IExtensionDataManager, IExtensionDataService, IProjectInfo, IProjectPageService, IDocumentOptions, getClient } from "azure-devops-extension-api";
import { defaultSettings } from "./DefaultSettings"

export interface IConformanceMeasure {
    name: string;
    toolTip?: string,
    workitem?: WorkItem,
    description?: string,
    additionalTags?: string
}


export type IConformanceSettings = {
    
    id: string

    __etag?: string
    
    /**
     * List of configured Conformance Measures.
     */
    availableMeasures: IConformanceMeasure[]

    conformanceTag: string

    workItemType: string

    aggregationWorkItemType: string
}





export class SettingsManager {
    constructor() {
        throw new Error('You cannot instantiate SettingsManager.');
    }

    private static DataManager: IExtensionDataManager

    private static Project: IProjectInfo

    private static WorkItemTypes: WorkItemType[]

    public static async GetSettings(): Promise<IConformanceSettings> {        
        if(this.DataManager == undefined || this.Project == undefined || this.Project.id == undefined) {
            await this.Initialize();
        }
        let settingsDocument: IConformanceSettings;
        try {
            settingsDocument = await this.DataManager.getDocument(this.Project.id, defaultSettings.id, {defaultValue: defaultSettings}) 
            
        } catch (error) {
            console.debug("Using default settings")            
            return defaultSettings;
        }

        if (settingsDocument.workItemType == undefined) {
            settingsDocument.workItemType = defaultSettings.workItemType
        }

        // use default values if required
        if(settingsDocument.availableMeasures == undefined) {
            settingsDocument.availableMeasures = defaultSettings.availableMeasures
        }

        if(settingsDocument.conformanceTag == undefined) {
            settingsDocument.conformanceTag = defaultSettings.conformanceTag
        }
        console.debug("Active Settings:")
        console.debug(settingsDocument)
        return settingsDocument
    }

    public static async GetWorkItemTypes():Promise<WorkItemType[]> {
        if(this.WorkItemTypes == undefined) {
            await this.Initialize();
        }
        return this.WorkItemTypes
    }

    public static async StoreSettings(settings: IConformanceSettings) {
        if(this.DataManager == undefined || this.Project == undefined) {
            await this.Initialize();
        }
        // required to indicate that we want to override any existing setting
        settings.__etag = "-1"
        console.debug("StoreSettings")
        console.debug(settings)
        return this.DataManager.setDocument(this.Project.id, settings)
    }

    public static async RestoreDefault(): Promise<IConformanceSettings> {
        if(this.DataManager == undefined || this.Project == undefined) {
            await this.Initialize();
        }
        // we don't need to wait for completing the delete operation        
        this.DataManager.deleteDocument(this.Project.id, defaultSettings.id).catch(
            error => console.debug("No stored settings.")
        )
        
        return Promise.resolve(defaultSettings)
    }


    private static async Initialize() {
        await SDK.ready();
        const [accessToken, extDataService, projectService, workItemClient] = await Promise.all([
            SDK.getAccessToken(), 
            SDK.getService<IExtensionDataService>(CommonServiceIds.ExtensionDataService), 
            SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService),
            getClient(WorkItemTrackingRestClient)
        ])        
        const project: IProjectInfo | undefined = await projectService.getProject();        
        if(project == undefined) {
            console.error("Unable to get project info.")
            return defaultSettings
        }
        this.Project = project

        const [typeResult, DataManager] = await Promise.all([
            workItemClient.getWorkItemTypes(this.Project.id),
            extDataService.getExtensionDataManager(SDK.getExtensionContext().id, accessToken)
        ])
        console.log(typeResult)
        this.WorkItemTypes = typeResult
        this.DataManager = DataManager
    }
    
}