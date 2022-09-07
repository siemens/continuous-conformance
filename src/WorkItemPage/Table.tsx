/*
 * SPDX-FileCopyrightText: 2022 Siemens AG
 *
 * SPDX-License-Identifier: MIT
 */

import * as SDK from "azure-devops-extension-sdk";
import * as React from "react";

// UI
import { Icon, IconSize } from "azure-devops-ui/Icon";
import { Link } from "azure-devops-ui/Link";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { Persona, PersonaSize } from "azure-devops-ui/Persona";
import { CoinSize } from "azure-devops-ui/Coin";
import { 
  ColumnSorting,
  ITableColumn, 
  SimpleTableCell,
  SortOrder,  
} from "azure-devops-ui/Table";
import { Ago } from "azure-devops-ui/Ago";
import { AgoFormat } from "azure-devops-ui/Utilities/Date"

// API
import { CommonServiceIds, IHostNavigationService  } from "azure-devops-extension-api";
import { WorkItem } from "azure-devops-extension-api/WorkItemTracking";
import { IdentityRef } from "azure-devops-extension-api/WebApi";

// Internal
import "../Common.scss";
import { IConformanceMeasure } from "../ProjectSettings/ConformanceSettings";
import { Pill } from "azure-devops-ui/Pill";
import { PillGroup, PillGroupOverflow } from "azure-devops-ui/PillGroup";
import { ObservableValue } from "azure-devops-ui/Core/Observable";

export type TableItemType = IConformanceMeasure | ObservableValue<IConformanceMeasure|undefined>
// export type TableItemType = {} | ObservableValue<{}|undefined>


export function renderNameColumn(
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<TableItemType>,
    tableItem: TableItemType
  ): JSX.Element {
    let measure = tableItem as IConformanceMeasure
    let toolTip: string = measure.name
    if(measure.toolTip) {
      toolTip = measure.toolTip
    }
    return (
        <SimpleTableCell
            columnIndex={columnIndex}
            tableColumn={tableColumn}
            key={"col-" + columnIndex}
            contentClassName="fontSizeM font-size-m scroll-hidden"
        >
            <div className="flex-row scroll-hidden">
              <Tooltip text={toolTip}>
                  <span className="text-ellipsis">{measure.name}</span>
              </Tooltip>            
            </div>
        </SimpleTableCell>
    );
  }
  
export function renderWorkItem(
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<TableItemType>,
    tableItem: TableItemType
  ): JSX.Element {
    let measure = tableItem as IConformanceMeasure
    if(!measure.workitem)
    {
      return (<SimpleTableCell
                columnIndex={columnIndex}
                tableColumn={tableColumn}
                key={"col-" + columnIndex}
                contentClassName="bolt-table-cell-content-with-inline-link" 
        />
      );
    }
    
    const workItemID = measure.workitem?.id  
    const lineOne = `#${workItemID} \u00b7 ${measure.workitem.fields['System.Title']}`  
    
    
    return (
      <SimpleTableCell
              className="bolt-table-cell-content-with-inline-link no-v-padding"
              key={"col-" + columnIndex}
              columnIndex={columnIndex}
              tableColumn={tableColumn}            
      >
        <span className="flex-row scroll-hidden">
            <Tooltip text={lineOne} overflowOnly>
                <Link
                    className="fontSizeM font-size-m text-ellipsis bolt-table-link bolt-table-inline-link"
                    excludeTabStop
                    href={measure.workitem._links['html'].href}
                    onClick={onLinkClick}
                >
                    #{workItemID} {"\u00b7"} {measure.workitem.fields['System.Title']}
                </Link>
            </Tooltip>
        </span>
      </SimpleTableCell>
      );
    }
  
export function onLinkClick(event: React.MouseEvent<HTMLAnchorElement, MouseEvent> | React.KeyboardEvent<HTMLAnchorElement>) {
  event.preventDefault()
  const target: HTMLAnchorElement = event.target as HTMLAnchorElement
    SDK.getService<IHostNavigationService>(CommonServiceIds.HostNavigationService).then((navigationService: IHostNavigationService) => {
      navigationService.navigate(target.href)
    })
  }

export function renderTagColumn(
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<TableItemType>,
  tableItem: TableItemType
): JSX.Element {
  let measure = tableItem as IConformanceMeasure
  let visibleTags:string[]= []
  if(!measure.workitem)  {
    if(measure.additionalTags)
      visibleTags = measure.additionalTags.split(";").map((tag: string) => tag.trim())
  } else {
    visibleTags = measure.workitem.fields["System.Tags"]
        .split(";")
        .map((tag: string) => tag.trim())
        .filter((tag:string) => {      
          return tag !== measure.name && tag !== "Conformance"
        })  
  } 
   
    
  let pills = []
  for (let index = 0; index < visibleTags.length; index++) {
    pills.push(
      <Pill key={index}>
        {visibleTags[index]}
      </Pill>
    )
    
  }
  
  return (
      <SimpleTableCell
          columnIndex={columnIndex}
          tableColumn={tableColumn}
          key={"col-" + columnIndex}
          contentClassName="fontSizeM font-size-m scroll-hidden"
      >
        <PillGroup className="flex-row" overflow={PillGroupOverflow.wrap}>
          {pills}
        </PillGroup>
          
      </SimpleTableCell>
  );
}  


export function renderDateColumn(
      rowIndex: number,
      columnIndex: number,
      tableColumn: ITableColumn<TableItemType>,
      tableItem: TableItemType
    ): JSX.Element {
  let measure = tableItem as IConformanceMeasure
  if(!measure.workitem)
  {
    return (<SimpleTableCell
              columnIndex={columnIndex}
              tableColumn={tableColumn}
              key={"col-" + columnIndex}
              contentClassName="fontSizeM font-size-m scroll-hidden" 
      />
    );
  }

  const lastModified: Date = measure.workitem.fields['System.ChangedDate']    
  return (
      <SimpleTableCell
          columnIndex={columnIndex}
          tableColumn={tableColumn}
          key={"col-" + columnIndex}
          contentClassName="fontSizeM font-size-m scroll-hidden"
      >
          <Ago date={lastModified} format={AgoFormat.Extended} />          
      </SimpleTableCell>
  );
}
  
  
export function renderPersonaColumn(
      rowIndex: number,
      columnIndex: number,
      tableColumn: ITableColumn<TableItemType>,
      tableItem: TableItemType
    ): JSX.Element {
      
      let measure = tableItem as IConformanceMeasure
      if(!measure.workitem || !measure.workitem.fields['System.AssignedTo'])
      {
        return (<SimpleTableCell
                  columnIndex={columnIndex}
                  tableColumn={tableColumn}
                  key={"col-" + columnIndex}
                  contentClassName="fontSizeM font-size-m scroll-hidden" 
          />
        );
      }
      let user = measure.workitem.fields['System.AssignedTo'] as IdentityRef    
      return (
          <SimpleTableCell 
              columnIndex={columnIndex}
              tableColumn={tableColumn}
              key={"col-" + columnIndex}            
          >
            <span className="flex-row scroll-hidden">
              <Persona identity={user} size={PersonaSize.size40} />
              <span className="flex-row flex-center text-ellipsis margin-left-8">{user.displayName}</span>
            </span>
              
          </SimpleTableCell>
      );
    }
  
export function renderWorkItemStateColumn(
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<TableItemType>,
    tableItem: TableItemType
  ): JSX.Element {
    
    let measure = tableItem as IConformanceMeasure
    if(!measure.workitem)
    {
      return (<SimpleTableCell
                columnIndex={columnIndex}
                tableColumn={tableColumn}
                key={"col-" + columnIndex}
                contentClassName="fontSizeM font-size-m scroll-hidden" 
        />
      );
    }  
    
    const state = measure.workitem.fields['System.State']
    const reason = measure.workitem.fields['System.Reason']
    let text:string = state
    if(state !== reason)
    {
      text = `${state} (${reason})`
    }
    
    return (
      <SimpleTableCell 
            columnIndex={columnIndex}
            tableColumn={tableColumn}
            key={"col-" + columnIndex}            
      >
        <Tooltip text={text} overflowOnly>
          <span className="flex-row flex-center text-ellipsis scroll-hidden">
            {getStateIcon(measure.workitem)}
            <div className="margin-left-8">{text}</div>
          </span>            
          </Tooltip>
      </SimpleTableCell> 
      );
    }
    
  
  
export enum WorkItemStates {
    new = "new", // border-color: rgb(178, 178, 178); background-color: rgb(178, 178, 178);
    active = "active", // rgb(0, 122, 204)
    resolved = "resolved", // border-color: rgb(255, 157, 0);
    closed = "closed", // rgb(51, 153, 51)
    removed = "removed" // border-color: rgb(86, 136, 224); background-color: transparent;
  }
  
export function getStateIcon(workItem: WorkItem | undefined):JSX.Element {
    let state:string = ""
    if(workItem) {
      state = workItem.fields["System.State"] || ""
    }
    state = state.toLowerCase();  
    let style: React.CSSProperties = {
      backgroundColor: "rgb(178, 178, 178)",
      borderColor: "rgb(178, 178, 178)"
    };
    switch(state) {
      case WorkItemStates.active:
        style  = {
          backgroundColor: "rgb(0, 122, 204)",
          borderColor: "rgb(0, 122, 204)"
        }
        break;
      case WorkItemStates.resolved:
        style  = {
          backgroundColor: "rgb(255, 157, 0)",
          borderColor: "rgb(255, 157, 0)"
        }
      break;
      case WorkItemStates.closed:
        style  = {
          backgroundColor: "rgb(51, 153, 51)",
          borderColor: "rgb(51, 153, 51)"
        }
      break;
      case WorkItemStates.removed:
        style  = {
          backgroundColor: "transparent",
          borderColor: "rgb(86, 136, 224)"
        }
      break;
    };
    return (
    <Icon 
              ariaLabel="Status icon"            
              render={() => {return (<div style={style} className="flex-row conformance-state-coloring-enabled" />);} }
              size={IconSize.small}            
              
            />  
    );
  }
  