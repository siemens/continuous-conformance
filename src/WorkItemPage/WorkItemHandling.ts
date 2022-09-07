/*
 * SPDX-FileCopyrightText: 2022 Siemens AG
 *
 * SPDX-License-Identifier: MIT
 */

import * as SDK from "azure-devops-extension-sdk";
import * as React from "react";

import { IWorkItemFormService, WorkItem, WorkItemErrorPolicy, WorkItemExpand, WorkItemTrackingRestClient, WorkItemTrackingServiceIds } from "azure-devops-extension-api/WorkItemTracking";
import { IConformanceMeasure, IConformanceSettings, SettingsManager } from "../ProjectSettings/ConformanceSettings";
import { CommonServiceIds, getClient, IProjectPageService } from "azure-devops-extension-api";

export class WorkItemHandling {

    constructor() {             
        
      }

    private myWorkItemID: number | undefined;  

    private settings: IConformanceSettings | undefined;

    private aggregateWorkItemId: number | undefined;

    public async GetMyWorkItemID() : Promise<number> {
        if(this.myWorkItemID) return this.myWorkItemID
    
        const workItemFormService = await SDK.getService<IWorkItemFormService>(WorkItemTrackingServiceIds.WorkItemFormService);
        this.myWorkItemID = await workItemFormService.getId();
        return this.myWorkItemID
    }
    
    private async getCurrentWorkItemURL():Promise<string> {
        const workItemFormService = await SDK.getService<IWorkItemFormService>(WorkItemTrackingServiceIds.WorkItemFormService)
        const workItemID = await this.GetMyWorkItemID()
        return workItemFormService.getWorkItemResourceUrl(workItemID)
    }
    
    private async creageAggregateWorkItem(): Promise<number> {
        if(this.settings == undefined) {
            this.settings = await SettingsManager.GetSettings()
        }
        const myURL:string = await this.getCurrentWorkItemURL()
        const workItemFormService = await SDK.getService<IWorkItemFormService>(WorkItemTrackingServiceIds.WorkItemFormService)
        const parentTitle:string = await workItemFormService.getFieldValue("System.Title", {returnOriginalValue: false}) as string

        let document = [
            {
            "op": "add",
            "path": "/fields/System.Title",
            "value": `Conformance (${parentTitle})`
            },      
            {
            "op": "add",
            "path": "/relations/-",
            "value": {
                "rel": "System.LinkTypes.Hierarchy-Reverse",
                "url": myURL
            }
            },
            {
            "op": "add",
            "path": "/fields/System.Tags",
            "value": `${this.settings.conformanceTag}`
            }
        ]

        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project = await projectService.getProject();
        const projectName: string = project?.name || ""    
        
        let restClient = getClient(WorkItemTrackingRestClient)
        let createdWorkItem: WorkItem = await restClient.createWorkItem(document, projectName, this.settings.aggregationWorkItemType, undefined , undefined, undefined, WorkItemExpand.All)
        this.aggregateWorkItemId = createdWorkItem.id
        return createdWorkItem.id
    }
    
    public async createWorkItem(measure: IConformanceMeasure): Promise<WorkItem|undefined> {
        if(measure.workitem) {
            return
        }

        if(this.settings == undefined) {
            this.settings = await SettingsManager.GetSettings()
        }

        if(!this.aggregateWorkItemId) {
            this.aggregateWorkItemId = await this.creageAggregateWorkItem()
        }
        
        let existingWorkItem: (WorkItem|undefined) = await this.GetLinkedWorkItem(this.aggregateWorkItemId, measure.name)
        if(existingWorkItem) {
            return existingWorkItem
        }
        
        const workItemFormService = await SDK.getService<IWorkItemFormService>(WorkItemTrackingServiceIds.WorkItemFormService)    
        const myURL = await workItemFormService.getWorkItemResourceUrl(this.aggregateWorkItemId)
        console.debug(`aggregateWorkItemId "${this.aggregateWorkItemId}", myURL: "${myURL}"`)
        const tags: string = measure.additionalTags ? `${this.settings.conformanceTag};${measure.name};${measure.additionalTags}` : `${this.settings.conformanceTag};${measure.name}`
        let document = [
            {
            "op": "add",
            "path": "/fields/System.Title",
            "value": measure.name
            },      
            {
            "op": "add",
            "path": "/relations/-",
            "value": {
                "rel": "System.LinkTypes.Hierarchy-Reverse",
                "url": myURL
            }
            },
            {
            "op": "add",
            "path": "/fields/System.Tags",
            "value": tags
            }
        ]

        if(measure.description) {
            document.push(
            {
                "op": "add",
                "path": "/fields/System.Description",
                "value": measure.description
            }
            );
        }
        
        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project = await projectService.getProject();
        const projectName: string = project?.name || ""    
        
        let restClient = getClient(WorkItemTrackingRestClient)
        let createdWorkItem: WorkItem = await restClient.createWorkItem(document, projectName, this.settings.workItemType, undefined , undefined, undefined, WorkItemExpand.All)    
        return createdWorkItem
    }


    public async GetConformanceWorkItems():Promise<WorkItem[]> {
        if(this.settings == undefined){
            this.settings = await SettingsManager.GetSettings()
        }
        const myID: number = await this.GetMyWorkItemID();
        let restClient = getClient(WorkItemTrackingRestClient)
        let foundWorkItems: WorkItem[] = []

        // 1. Get Aggreation Work-Item
        const aggreatiedQuery = `SELECT [System.Id] FROM WorkItemLinks WHERE ([Source].[System.Id] = '${myID}') AND ( ([System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward') OR ([System.Links.LinkType] = 'System.LinkTypes.Related-Forward' )) AND ([Target].[System.Tags] CONTAINS '${this.settings.conformanceTag}')`
        let aggregateResult = await restClient.queryByWiql({query: aggreatiedQuery})
        if(!aggregateResult || !aggregateResult.workItemRelations || aggregateResult.workItemRelations.length < 2 || !aggregateResult.workItemRelations[1].target.id)
        {
            return Promise.resolve(foundWorkItems);
        }   
        this.aggregateWorkItemId = aggregateResult.workItemRelations[1].target.id
        // 2. Get Conformance Work-Items by tag
        const relationQuery = `SELECT [System.Id] FROM WorkItemLinks WHERE ([Source].[System.Id] = '${this.aggregateWorkItemId}') AND ( ([System.Links.LinkType] = 'Child') OR ([System.Links.LinkType] = 'Related' )) AND ([Target].[System.Tags] CONTAINS '${this.settings.conformanceTag}')`
        let queryResult = await restClient.queryByWiql({ "query": relationQuery})
        
        if(!queryResult || !queryResult.workItemRelations || queryResult.workItemRelations.length < 2)
        {
            return Promise.resolve(foundWorkItems);
        }
        let workItemIDs: number[] = []
        for(let index=1; index < queryResult.workItemRelations.length; index++) {
            workItemIDs.push(queryResult.workItemRelations[index].target.id)
        }
        return restClient.getWorkItems(workItemIDs, undefined, undefined, undefined, WorkItemExpand.All, WorkItemErrorPolicy.Fail)    
        }
        
    private async GetLinkedWorkItem(parentID: number, tag: string):Promise<WorkItem|undefined> {
        const relationQuery = `SELECT [System.Id] FROM WorkItemLinks WHERE ([Source].[System.Id] = '${parentID}') AND ( ([System.Links.LinkType] = 'Child') OR ([System.Links.LinkType] = 'Related' )) AND ([Target].[System.Tags] CONTAINS '${tag}')`
        let restClient = getClient(WorkItemTrackingRestClient)
        let queryResult = await restClient.queryByWiql({ "query": relationQuery})
        if(!queryResult || !queryResult.workItemRelations || queryResult.workItemRelations.length < 2)
        {
            return undefined
        }    
        return restClient.getWorkItem(queryResult.workItemRelations[1].target.id, undefined, undefined, undefined, WorkItemExpand.All)
        }
    }