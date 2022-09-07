/*
 * SPDX-FileCopyrightText: 2022 Siemens AG
 *
 * SPDX-License-Identifier: MIT
 */

import * as SDK from "azure-devops-extension-sdk";
import * as React from "react";

// UI
import { Icon, IconSize } from "azure-devops-ui/Icon";
import { Card } from "azure-devops-ui/Card";
import { Page } from "azure-devops-ui/Page";
import { Table, ITableColumn, ColumnSelect, ColumnSorting, SortOrder, sortItems, TableColumnStyle } from "azure-devops-ui/Table";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { ListSelection } from "azure-devops-ui/List";
import { ISelectionRange } from "azure-devops-ui/Utilities/Selection";
import {
  CustomHeader,
  HeaderDescription,
  HeaderIcon,
  HeaderTitle,
  HeaderTitleArea,
  HeaderTitleRow,
  TitleSize
} from "azure-devops-ui/Header";
import { IHeaderCommandBarItem, HeaderCommandBar } from "azure-devops-ui/HeaderCommandBar";

// API
import {
    IWorkItemChangedArgs,
    IWorkItemLoadedArgs,
    WorkItem,
} from "azure-devops-extension-api/WorkItemTracking";
import { showRootComponent } from "../Common";


// Internal
import "../Common.scss";
import { IConformanceMeasure, IConformanceSettings, SettingsManager } from "../ProjectSettings/ConformanceSettings";
import {
  renderNameColumn,
  renderWorkItem,
  renderWorkItemStateColumn,
  renderDateColumn,
  renderPersonaColumn,
  renderTagColumn,
  TableItemType
} from "./Table"
import { WorkItemHandling } from "./WorkItemHandling";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import { IdentityRef } from "azure-devops-extension-api/WebApi";

interface WorkItemPageState {
  itemProvider : ArrayItemProvider<TableItemType>
  createEnabled: boolean
  isLoaded     : boolean
  columnSorting: SortOrder[]
}
export class WorkItemFormGroupComponent extends React.Component<{}, WorkItemPageState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      itemProvider: new ArrayItemProvider<IConformanceMeasure>([]),
      createEnabled: false,
      isLoaded: false,
      columnSorting: Array(7).fill(undefined)
    }
    this.onCreateClick = this.onCreateClick.bind(this)
    this.onSelectionChanged = this.onSelectionChanged.bind(this)
    // this.getSelectedItems = this.getSelectedItems.bind(this)
    this.selection.subscribe(this.onSelectionChanged)
    this.pageRef = React.createRef()
    this.divRef = React.createRef()
  }
  
  

  private settings: IConformanceSettings | undefined;
  private selection                                                           = new ListSelection({selectOnFocus: false, multiSelect: true})
  private workItemHandler: WorkItemHandling                                   = new WorkItemHandling()
  private pageRef: React.RefObject<Page>
  private divRef: React.RefObject<HTMLDivElement>

  private columns:ITableColumn<TableItemType>[] = [
  new ColumnSelect() as unknown as ITableColumn<TableItemType>,
  {
    id: "name",
    name: "Name",
    columnStyle: TableColumnStyle.Primary,
    renderCell: renderNameColumn,
    sortProps: {
      ariaLabelAscending: "Sorted A to Z",
      ariaLabelDescending: "Sorted Z to A"
    },
    
    readonly: true,
    width: -15
  },
  {
    id: "workitem",
    name: "Work Item",
    renderCell: renderWorkItem,
    sortProps: {
      ariaLabelAscending: "Sorted 0 to 9",
      ariaLabelDescending: "Sorted 9 to 1"
    },
    width: -25
  },
  {
    id: "workitem-tags",
    name: "Tags",
    renderCell: renderTagColumn,
    sortProps: {
      ariaLabelAscending: "Sorted A to Z",
      ariaLabelDescending: "Sorted Z to A"
    },
    width: -15
  },
  {
    id: "workitem-state",
    name: "State",
    renderCell: renderWorkItemStateColumn,
    sortProps: {
      ariaLabelAscending: "Sorted A to Z",
      ariaLabelDescending: "Sorted Z to A"
    },
    width: -15
  },
  {
    id: "modified",
    name: "Last Modified",
    renderCell: renderDateColumn,
    sortProps: {
      ariaLabelAscending: "Sorted new to old",
      ariaLabelDescending: "Sorted old to new"          
    },
    readonly: true,
    width: -10
  },
  {
    id: "persona",
    name: "Assigned To",
    renderCell: renderPersonaColumn,
    sortProps: {
      ariaLabelAscending: "Sorted A to Z",
      ariaLabelDescending: "Sorted Z to A"       
    },
    readonly: true,
    width: -15
  }
]

  private getColumns(): ITableColumn<TableItemType>[] {
    // set sortOrder only when defined
    for (let index = 1; index < this.columns.length; index++) {
      const col = this.columns[index];
      if(col.sortProps == undefined) {
        continue
      }
      
      if(!this.state.columnSorting[index]) {
        col.sortProps.sortOrder = SortOrder.ascending
        continue
      }      
      col.sortProps.sortOrder = this.state.columnSorting[index]
    }

    return this.columns
  }

  private commandBarItems: IHeaderCommandBarItem[] = [
    {
      iconProps: {
        iconName: "Add"
      },
      id: "createWorkItems",
      important: true,
      isPrimary: true,
      onActivate: this.onCreateClick.bind(this),
      text: "Create",
      tooltipProps: {
          text: "Create Conformance Work Items to track the selected measures."
      }    
    }
  ]  

  private onSelectionChanged(value: ISelectionRange[], action: string) {
    const relevantActions:string[] = [
      "select",
      "unselect"
    ]
    
    if(!relevantActions.includes(action)) {
      return;
    }

    let selectedItems: (TableItemType)[] = this.getSelectedItems()
    let createEnabled: boolean = false;
    if(selectedItems.length > 0) {
      createEnabled = true
    }
    
    this.setState(prevState => ({
      ...prevState,
      isLoaded: true,
      createEnabled: createEnabled
    }))
  }

  private getSelectedItems():TableItemType[] {
    let selectedItems: TableItemType[] = [];    
    for(let selectedRange of this.selection.value)
    {
      for (let index = selectedRange.beginIndex; index <= selectedRange.endIndex; index++) {
        const item = this.state.itemProvider.value[index]        
        selectedItems.push(item)
      }
    }
    return selectedItems
  }

  

  private onCreateClick() {
    this.handleCreateClick()
  }

  private async handleCreateClick() {
    // this.isLoaded = false
    this.setState(prevState => ({
      ...prevState,
      isLoaded: false
    }))
    let selectedItems = this.getSelectedItems()    
    this.selection.clear()
    
    let updatedItems:TableItemType[] = this.state.itemProvider.value
    for(let observableItem of selectedItems) {
      let item:IConformanceMeasure|undefined = this.getConformanceMeasure(observableItem)
      if(!item || item.workitem) {
        // Skip if there's no IConformanceMeasure available,
        // or if there is already a linked workItem
        continue
      }      
      let index:number = this.state.itemProvider.value.findIndex( (arrayElement) => {return arrayElement == observableItem} )
      
      let createdWorkItem: WorkItem|undefined = await this.workItemHandler.createWorkItem(item)    
      if(!item || !createdWorkItem) {
        return
      }
      item.workitem = createdWorkItem
      // this.itemProvider.value[index] = item
      updatedItems[index] = item
      
      this.selection.addUnselectable(index)
    }    

    this.setState(prevState => {        
      let copy:WorkItemPageState = JSON.parse(JSON.stringify(prevState))
      
      copy.itemProvider = new ArrayItemProvider(updatedItems)
      copy.isLoaded = true
      return copy
    })
  }


  private getConformanceMeasure(object: TableItemType) : IConformanceMeasure | undefined {
    if(object instanceof ObservableValue ) {
      return object.value as IConformanceMeasure
    }
    return object
  }

  private compareMeasures(item1: IConformanceMeasure|undefined, item2: IConformanceMeasure|undefined): number | undefined {
    if(item1 == undefined && item2 == undefined) {
      return 0
    }
    if(item1 == undefined) {
      return -1
    }

    if(item2 == undefined) {
      return 1
    }

    return undefined
  }

  

  private compareObjects(a: any, b: any):number|undefined {
      // both null or undefined
      if(a == undefined && b == undefined) return 0
  
      // one null or undefined and two is defined
      if(a == undefined && b  !== undefined) return 1
      
      // one defined and two null or  undefined
      if(a !== undefined && b == undefined) return -1

      // both are defined
      return undefined
  }

  private sortFunctions: (((item1: TableItemType, item2: TableItemType) => number)|null)[] = [
    // Checkbox column
    null,

    // Sort on Name column
    (item1: TableItemType, item2: TableItemType): number => {
      let m1 = this.getConformanceMeasure(item1) 
      let m2 = this.getConformanceMeasure(item2)
      const compareResult = this.compareMeasures(m1, m2)
      if(compareResult) {
        return compareResult
      }
      return m1!.name.localeCompare(m2!.name);      
    },

    // Sort on WorkItem column    
    (item1: TableItemType, item2: TableItemType): number => {      
      let m1 = this.getConformanceMeasure(item1) 
      let m2 = this.getConformanceMeasure(item2)      
      
      let id1 = m1?.workitem?.id
      let id2 = m2?.workitem?.id

      let undefinedCheck: number | undefined = this.compareObjects(id1, id2)      
      if(undefinedCheck !== undefined) return undefinedCheck

      return id1! - id2!
    },

    // Tag
    (item1: TableItemType, item2: TableItemType): number => {
      let m1 = this.getConformanceMeasure(item1) 
      let m2 = this.getConformanceMeasure(item2)      
      
      let tags1: string = `${m1?.additionalTags}`
      let tags2: string = `${m2?.additionalTags}`

      return tags1.localeCompare(tags2);
    },

    // State
    (item1: TableItemType, item2: TableItemType): number => {
      let m1 = this.getConformanceMeasure(item1) 
      let m2 = this.getConformanceMeasure(item2)
      
      let state1:string = `${m1?.workitem?.fields['System.State']}`      
      let state2:string = `${m2?.workitem?.fields['System.State']}`
      
      let stateComparision: number = state1.localeCompare(state2)
      if(state1.localeCompare(state2) !== 0) return stateComparision

      let reason1: string = `${m1?.workitem?.fields['System.Reason']}`
      let reason2: string = `${m2?.workitem?.fields['System.Reason']}`
      
      return reason1.localeCompare(reason2)
    },

    // Last Modified  
    (item1: TableItemType, item2: TableItemType): number => {
      let m1 = this.getConformanceMeasure(item1) 
      let m2 = this.getConformanceMeasure(item2)
      
      let lastModified1:Date = m1?.workitem?.fields['System.ChangedDate']
      let lastModified2:Date = m2?.workitem?.fields['System.ChangedDate']
      
      let undefinedCheck: number | undefined = this.compareObjects(lastModified1, lastModified2)      
      if(undefinedCheck !== undefined) return undefinedCheck
      
      return (lastModified2.valueOf() - lastModified1.valueOf())
    },

    // Assigned To let user = measure.workitem.fields['System.AssignedTo'] as IdentityRef
    (item1: TableItemType, item2: TableItemType): number => {
      let m1 = this.getConformanceMeasure(item1) 
      let m2 = this.getConformanceMeasure(item2)
      
      let user1 = `${(m1?.workitem?.fields['System.AssignedTo'] as IdentityRef)?.displayName}`
      let user2 = `${(m2?.workitem?.fields['System.AssignedTo'] as IdentityRef)?.displayName}`
      
      return user1.localeCompare(user2)
    },
]

  private getSortingBevahior() : ColumnSorting<TableItemType>[] 
  {
    let colSort: ColumnSorting<TableItemType>[] = [
      new ColumnSorting<TableItemType>(
        (
            columnIndex: number,
            proposedSortOrder: SortOrder,
            event: React.KeyboardEvent<HTMLElement> | React.MouseEvent<HTMLElement>
        ) => {
          const sortedItemProvider = new ArrayItemProvider(
            sortItems<TableItemType>(
              columnIndex,
              proposedSortOrder,
              this.sortFunctions,
              this.columns,
              this.state.itemProvider.value
            )
          )
          this.setState(prevState => {
            let copy:WorkItemPageState = JSON.parse(JSON.stringify(prevState))
            copy.columnSorting[columnIndex] = proposedSortOrder
            copy.itemProvider = sortedItemProvider
            return copy
          })
        }
      )
    ]
  
    return colSort;
  }

  // IconNames:
  // ReceiptCheck Certificate CheckList WorkItem
  public render(): JSX.Element {
    let commandBarItems:IHeaderCommandBarItem[] = this.commandBarItems
    commandBarItems[0].disabled = !this.state.createEnabled
    
    let mainContent: JSX.Element;
    if(!this.state.isLoaded) {
      mainContent = <></>
    } else {
      mainContent = <Card
                      className="flex-grow bolt-table-card"
                      contentProps={{ contentPadding: true }}
                      
                    >
                      <Table<TableItemType>
                        ariaLabel="continuos-conformance-table"                        
                        columns={this.columns}
                        itemProvider={this.state.itemProvider}
                        role="table"
                        className="table-conformance"
                        showLines={true}
                        selection={this.selection}
                        behaviors={this.getSortingBevahior()}
                      />
                    </Card>
    }
    
    return (
      <Page
        className="padding-right-16 flex-grow"        
        ref={this.pageRef}
      >
        <CustomHeader className="bolt-header-with-commandbar">
            <HeaderIcon
                className="bolt-table-status-icon-large"
                iconProps={{ render: this.renderStatus }}
                titleSize={TitleSize.Large}
            />
            <HeaderTitleArea>
                <HeaderTitleRow>
                    <HeaderTitle className="text-ellipsis" titleSize={TitleSize.Large}>
                      Conformance Measures
                    </HeaderTitle>
                </HeaderTitleRow>
                <HeaderDescription>
                  Linked Conformance Work-Items.
                </HeaderDescription>
            </HeaderTitleArea>
            <HeaderCommandBar items={commandBarItems} />            
        </CustomHeader>
        <div className="page-content page-content-top flex-stretch full-height" ref={this.divRef} id="page-content" >          
          {mainContent}          
        </div>
      </Page>        
    );
  }

  private renderStatus = (className?: string) => {
    return <Icon className={className} iconName="WorkItem" size={IconSize.large} />;
};



  private async UpdateItems() {
    if(this.settings == undefined){
      this.settings = await SettingsManager.GetSettings()
    }
    let linkedConformanceWorkItems = await this.workItemHandler.GetConformanceWorkItems()
    let updateItems:TableItemType[] = []
    
    for(let index = 0; index < this.settings.availableMeasures.length; index++)
    {
      let  measure = this.settings.availableMeasures[index]
      measure.workitem = linkedConformanceWorkItems.find((workItem) => {
        let tags: string = workItem.fields["System.Tags"]
        if(tags && tags.toLowerCase().includes(measure.name.toLowerCase())) {
          return true
        }
        return false
      })
      if(measure.workitem) {
        this.selection.addUnselectable(index)
      }
      else {
        this.selection.removeUnselectable(index)
      }      
      // Update 
      updateItems.push(new ObservableValue<IConformanceMeasure|undefined>(measure))
    }
    
    this.setState(prevState => {
      let copy:WorkItemPageState = JSON.parse(JSON.stringify(prevState))
      copy.itemProvider = new ArrayItemProvider<TableItemType>(updateItems)
      copy.isLoaded = true
      return copy
    })
  }

  public componentDidMount() {
    SDK.init({loaded: false});

    SDK.ready().then( async () => {
      await this.UpdateItems();
      this.registerEvents();
      SDK.notifyLoadSucceeded();
    });
  }


  private registerEvents() {
    SDK.register(SDK.getContributionId(), () => {
      return {
        
        // Called when a new work item is being loaded in the UI
        onLoaded: (args: IWorkItemLoadedArgs) => {
          this.workItemHandler.GetMyWorkItemID().then(async (oldId) => {
            if(oldId == args.id) {               
              return
            }
            await this.UpdateItems();
          })
        },
        
        // Called after the work item has been saved
        onSaved: async (args: IWorkItemChangedArgs) => {
          await this.UpdateItems();
        },

        // Called when the work item is reset to its unmodified state (undo)
        onReset: async (args: IWorkItemChangedArgs) => {
          await this.UpdateItems();
        },

        // Called when the work item has been refreshed from the server
        onRefreshed: async (args: IWorkItemChangedArgs) => {
          this.setState(prevState => {
            const emptyArray:TableItemType[] = new Array(prevState.itemProvider.length)
            emptyArray.fill(new ObservableValue<IConformanceMeasure|undefined>(undefined))
            const copy:WorkItemPageState = {
              ...prevState,
              itemProvider: new ArrayItemProvider<TableItemType>(emptyArray)
              }
            return copy
          })
          await this.UpdateItems();
        }
      };
    });
  }
}

export default WorkItemFormGroupComponent;

showRootComponent(<WorkItemFormGroupComponent />);
