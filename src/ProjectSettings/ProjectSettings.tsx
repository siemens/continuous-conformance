/*
 * SPDX-FileCopyrightText: 2022 Siemens AG
 *
 * SPDX-License-Identifier: MIT
 */

import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";

import {
    TabList,
    TabSize,
    TabProvider,
    IVssContributedTab,
    TabContent,
    TabGroupProvider
} from "azure-devops-ui/Tabs";
import { ObservableValue, ObservableArray, IReadonlyObservableValue } from "azure-devops-ui/Core/Observable";
import { ITabGroup } from "azure-devops-ui/Components/Tabs/Tabs.Props";
import { showRootComponent } from "../Common";
import { IConformanceMeasure, IConformanceSettings, SettingsManager } from "./ConformanceSettings";
import { Page } from "azure-devops-ui/Page";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { TextField, TextFieldStyle, TextFieldWidth } from "azure-devops-ui/TextField";
import { FormItem } from "azure-devops-ui/FormItem";
import { IMenuProps } from "azure-devops-ui/Menu";
import { Panel } from "azure-devops-ui/Panel";
import { Button, IButtonProps } from "azure-devops-ui/Button";
import { Dropdown } from "azure-devops-ui/Dropdown";
import { DropdownSelection } from "azure-devops-ui/Utilities/DropdownSelection";
import { IListBoxItem } from "azure-devops-ui/ListBox";
import { WorkItemType } from "azure-devops-extension-api/WorkItemTracking";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import { Pill, PillVariant, PillSize } from "azure-devops-ui/Pill";
import { PillGroup, PillGroupOverflow } from "azure-devops-ui/PillGroup";
import { Icon } from "azure-devops-ui/Icon";
import { EditableDropdown } from "azure-devops-ui/EditableDropdown";
import { CommonServiceIds, IGlobalMessagesService, MessageBannerLevel } from "azure-devops-extension-api";
import { Link } from "azure-devops-ui/Link";

export interface ISettingsHubsState {
    settings: IConformanceSettings,
    saveButtonEnabled: boolean,
    isLoaded: boolean,
    showAddMeasurePanel: boolean,
    newMeasure: IConformanceMeasure,
    isAddingTag: boolean
}


export class SettingsHub extends React.Component<{}, ISettingsHubsState> {
    private selectedTabId: ObservableValue<string>;
    private providers = new ObservableArray<IVssContributedTab>();
    private groupProviders = new ObservableArray<ITabGroup>();
    private workItemTypes: WorkItemType[] = [];
    private workItemTypeSelection = new DropdownSelection();
    private aggregateWorkItemTypeSelection = new DropdownSelection();

    constructor(props: {}) {
        super(props);
        this.selectedTabId = new ObservableValue("General");
        this.onAddMeasure = this.onAddMeasure.bind(this)
        this.onCreateAddMeasurePanel = this.onCreateAddMeasurePanel.bind(this)
        this.onDismissAddMeasurePanel = this.onDismissAddMeasurePanel.bind(this)
        this.renderAddMeasurePanel = this.renderAddMeasurePanel.bind(this)
        this.onChangeNameAddMeasurePanel = this.onChangeNameAddMeasurePanel.bind(this)
        this.onChangeTemplateAddMeasurePanel = this.onChangeTemplateAddMeasurePanel.bind(this)
        this.onDeleteMeasure = this.onDeleteMeasure.bind(this)
        this.onRestoreDefaultSettings = this.onRestoreDefaultSettings.bind(this)
        this.onSave = this.onSave.bind(this)
        this.renderMeasureContent = this.renderMeasureContent.bind(this)
        this.onChangeTemplate = this.onChangeTemplate.bind(this)
        this.onChangeDescriptionAddMeasurePanel = this.onChangeDescriptionAddMeasurePanel.bind(this)
        this.onChangeDescription = this.onChangeDescription.bind(this)
        this.onPillAddClick = this.onPillAddClick.bind(this)
        this.onPillRemovedClick = this.onPillRemovedClick.bind(this)
        this.getPills = this.getPills.bind(this)
    }

    private static groupIdMeasures:string = "Measures"

    public componentDidMount() {
        SDK.init({loaded: false}).then(async () => {
            let settings  = await SettingsManager.GetSettings();
            this.workItemTypes = await SettingsManager.GetWorkItemTypes();
            this.initialize(settings)            
            this.setState({
                settings: settings,
                saveButtonEnabled: true,
                isLoaded: true,
                showAddMeasurePanel: false,
                isAddingTag: false
            })
            SDK.notifyLoadSucceeded()
        });    
        
    }    

    public render() {
        if(!this.state || !this.state.isLoaded){
            return (<div></div>)
        }
        let foundTab = this.providers.value.find((tab) => tab.id === this.selectedTabId.value)              
        let enableDeleteButton: boolean = false
        if(foundTab?.groupId === SettingsHub.groupIdMeasures) {
            enableDeleteButton = true
        }

        return (
            <div style={{width: "100%"}}>
                {this.state.showAddMeasurePanel && (<this.renderAddMeasurePanel />)}
                <Page>
                    <Header
                        title={"Continuous Conformance Settings"}
                        titleSize={TitleSize.Large}
                        commandBarItems={[
                            {
                                id: "save",
                                important: true,
                                isPrimary: true,
                                disabled: !this.state.saveButtonEnabled,
                                text: "Save",
                                iconProps: {
                                    iconName: "Save"
                                },
                                onActivate: this.onSave
                            },
                            {
                                id: "addMeasure",
                                important: true,
                                text: "Add Measure",
                                iconProps: {
                                    iconName: "Add"
                                },
                                onActivate: this.onAddMeasure
                            },
                            {
                                id: "DeleteMeasuare",
                                text: "Remove",
                                iconProps: {
                                    iconName: "Delete"
                                },
                                important: true,
                                tooltipProps: this.getDeleteButtonToolTip(),
                                disabled: !enableDeleteButton,
                                onActivate: this.onDeleteMeasure,
                                renderButton: (props: IButtonProps | IMenuProps):JSX.Element => { 
                                    return (
                                    <Button 
                                        {...props}                                
                                        danger={true}
                                        key={"DeleteButtonKey"}                                        
                                    />
                                )}
                            },
                            {
                                id: "restore",
                                text: "Restore Default Settings",
                                iconProps: {
                                    iconName: "Undo"
                                },
                                tooltipProps: {
                                    text: "Restore default settings."
                                },
                                onActivate: this.onRestoreDefaultSettings
                            }
                        ]}
                    />
                    <div className="page-content page-content-top flex-row flex-grow" style={{ height: 1200 }}>
                        <TabGroupProvider providers={this.groupProviders}>
                            <TabProvider providers={this.providers} selectedTabId={this.selectedTabId}>
                                <TabList
                                    key={1}
                                    onSelectedTabChanged={this.onSelectedTabChanged}
                                    selectedTabId={this.selectedTabId}
                                    tabSize={TabSize.Tall}                                    
                                    tabGroups={[
                                        {
                                            id: SettingsHub.groupIdMeasures,
                                            name: SettingsHub.groupIdMeasures,
                                            order: 1
                                        }    
                                    ]}
                                    className="padding-right-16"                                
                                />
                                <div className="flex-grow">
                                    <TabContent />
                                </div>
                            </TabProvider>
                        </TabGroupProvider>
                    </div>
                </Page>
            </div>
        );
    }
    
    private getDeleteButtonToolTip() {
        return {}
    }

    private onSave() {
        SettingsManager.StoreSettings(this.state.settings).then(async ()=>{
            // success
            const globalMessagesSvc = await SDK.getService<IGlobalMessagesService>(CommonServiceIds.GlobalMessagesService);
            globalMessagesSvc.addBanner({
                dismissable: true,
                customIcon: "Save",
                level: MessageBannerLevel.success,
                message: "Continuous Conformance Settings successfully saved for this project."
            })        
        }).catch(async (error) => {
            console.error(error)
            const globalMessagesSvc = await SDK.getService<IGlobalMessagesService>(CommonServiceIds.GlobalMessagesService);
            globalMessagesSvc.addBanner({
                dismissable: true,
                customIcon: "Save",
                level: MessageBannerLevel.error,
                message: `Failed to save Continuous Conformance Settings. ${JSON.stringify(error)}`
            })        
        })
    }

    private onRestoreDefaultSettings() {
        SettingsManager.RestoreDefault().then((defaultSettings) => {
            this.providers.removeAll()            
            this.setState((prevState) => {
                let copy:ISettingsHubsState = JSON.parse(JSON.stringify(prevState))
                copy.settings = defaultSettings
                return copy
            })
            this.initialize(this.state.settings)
        })        
    }

    private onDeleteMeasure() {
        let foundTab = this.providers.value.find((tab) => tab.id === this.selectedTabId.value)
        this.providers.removeAll((tab) => {return tab.name == foundTab?.name})
        this.setState((prevState) => {
            let copy:ISettingsHubsState = JSON.parse(JSON.stringify(prevState))
            let index = copy.settings.availableMeasures.findIndex((item) => item.name == foundTab?.name)
            if(index > -1) {
                copy.settings.availableMeasures.splice(index, 1)
            }
            return copy
        })
    }

    private onSelectedTabChanged = (newTabId: string) => {
        this.selectedTabId.value = newTabId;
        this.forceUpdate();
    };

    private onAddMeasure() {
        this.setState( (prevState) => {
            let copy:ISettingsHubsState = JSON.parse(JSON.stringify(prevState))
            copy.showAddMeasurePanel = true;
            copy.newMeasure = {
                name: ""
            }
            return copy
        })
    }

    private onDismissAddMeasurePanel() {
        this.setState((prevState) => {
            let copy:ISettingsHubsState = JSON.parse(JSON.stringify(prevState))
            copy.showAddMeasurePanel = false;
            return copy
        })
    }

    private onCreateAddMeasurePanel() {
        this.setState((prevState) => {
            let copy:ISettingsHubsState = JSON.parse(JSON.stringify(prevState))
            copy.showAddMeasurePanel = false;
            copy.settings.availableMeasures.push(copy.newMeasure)
            this.addMeasureToTabList(copy.newMeasure)
            return copy
        })

    }

    private onChangeNameAddMeasurePanel(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, value: string) {
        this.setState((prevState) => {
            let copy:ISettingsHubsState = JSON.parse(JSON.stringify(prevState))
            copy.newMeasure.name = value
            return copy
        })
    }

    
    private onChangeDescriptionAddMeasurePanel(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, value: string) {
        this.setState((prevState) => {
            let copy:ISettingsHubsState = JSON.parse(JSON.stringify(prevState))
            copy.newMeasure.toolTip = value
            return copy
        })
    }

    private onChangeTemplateAddMeasurePanel(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, value: string) {
        this.setState((prevState) => {
            let copy:ISettingsHubsState = JSON.parse(JSON.stringify(prevState))
            copy.newMeasure.description = value
            return copy
        })
    }

    private onChangeTemplate(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, value: string) {
        let foundTab = this.providers.value.find((tab) => tab.id === this.selectedTabId.value)        
        this.setState((prevState) => {
            let copy:ISettingsHubsState = JSON.parse(JSON.stringify(prevState))
            copy.settings.availableMeasures.forEach( measure => {
                if(measure.name == foundTab?.name) {
                    measure.description = value
                }
            })
            return copy
        })
    }

    private onChangeDescription(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, value: string) {
        let foundTab = this.providers.value.find((tab) => tab.id === this.selectedTabId.value)        
        this.setState((prevState) => {
            let copy:ISettingsHubsState = JSON.parse(JSON.stringify(prevState))
            copy.settings.availableMeasures.forEach( measure => {
                if(measure.name == foundTab?.name) {
                    measure.toolTip = value
                }
            })
            return copy
        })
    }

    // Because we use the name of the measure also as a tag,
    // we need to ensure that the name matches the restrictions
    // for tags and for work item names.
    // https://docs.microsoft.com/en-us/azure/devops/organizations/settings/naming-restrictions?view=azure-devops#tags-work-items
    private isValidMeasureName(name: string): boolean {
        if(!name)
            return false;
                
        if(name.length < 1 || name.length > 400)
            return false;
        
        const specialCharacters =  /[\u0000-\u001f\ud800-\udfff,;\u007f]/
        return (!specialCharacters.test(name))
    }
    
    private renderAddMeasurePanel(): JSX.Element {        
        
        let errorMessage: IReadonlyObservableValue<React.ReactNode> | React.ReactNode = '\u00A0'
        let validationError: boolean = false

        if(! this.isValidMeasureName(this.state.newMeasure.name)) {
            // errorMessage = "Name must be a valid tag name in Azure DevOps."
            errorMessage = <React.Fragment>Conformance name must be a valid tag name. See <Link target="_blank" href="https://docs.microsoft.com/en-us/azure/devops/organizations/settings/naming-restrictions?view=azure-devops#tags-work-items">Azure DevOps naming restrictions</Link> for more information.</React.Fragment>
            validationError = true
        }

        if(!validationError && this.state.settings.availableMeasures.some(existingMeasure => existingMeasure.name === this.state.newMeasure.name)){
            errorMessage = "A measure with this name exists already."
            validationError = true
        }

        return(
            <Panel
                onDismiss={this.onDismissAddMeasurePanel}
                titleProps={{ text: "Add new Conformance Measure" }}
                description={
                    "You need to provide a unique name. Optionally you can also provide a template."
                }
                footerButtonProps={[
                    { 
                        text: "Cancel", 
                        onClick: this.onDismissAddMeasurePanel
                    },
                    { 
                        text: "Create", 
                        primary: true ,
                        onClick: this.onCreateAddMeasurePanel,
                        disabled: validationError
                    }
                ]}
            >
                <div className="full-width full-height rhythm-vertical-16">
                    <FormItem label="Name:" error={validationError} message={errorMessage}>     
                        <TextField
                            ariaLabel="Aria label"
                            width={TextFieldWidth.auto}
                            value={this.state.newMeasure.name}
                            readOnly={false}
                            required={true}
                            onChange={this.onChangeNameAddMeasurePanel}
                        />
                    </FormItem>

                    <FormItem label="Tooltip:">
                        <TextField
                            ariaLabel="Measurement description"
                            value={this.state.newMeasure.toolTip}
                            onChange={this.onChangeDescriptionAddMeasurePanel}
                            multiline
                            rows={5}
                            width={TextFieldWidth.auto}
                        />
                    </FormItem>

                    <FormItem label="Description:">     
                        <TextField
                            ariaLabel="Aria label"
                            multiline
                            rows={10}
                            value={this.state.newMeasure.description}
                            width={TextFieldWidth.auto}
                            onChange={this.onChangeTemplateAddMeasurePanel} 
                        />
                    </FormItem>
                </div>
            </Panel>
        )
    }

    private renderOverviewContent(){
        let workItemTypeIndex: number | undefined = undefined;
        let aggregateTypeIndex: number | undefined = undefined;
        const items: IListBoxItem[] = []
        for (let i = 0; i < this.workItemTypes.length; i++) {
            let type: WorkItemType = this.workItemTypes[i]
            items.push({
                id: type.name,
                text: type.name,
                iconProps: {
                    render: (className) => {
                        return (
                            <img className={className} src={type.icon.url} alt={type.icon.id} width="16px"  />
                        )
                    }
                },
                tooltipProps: {
                    text: type.description
                }
            })
            if(type.name == this.state.settings.workItemType) {
                workItemTypeIndex = i
            }
            if(type.name == this.state.settings.aggregationWorkItemType) {
                aggregateTypeIndex = i
            }
        }
        const provider = new ArrayItemProvider<IListBoxItem>(items)
        if(workItemTypeIndex) {
            this.workItemTypeSelection.select(workItemTypeIndex);
        }

        if(aggregateTypeIndex) {
            this.aggregateWorkItemTypeSelection.select(aggregateTypeIndex);
        }
        
        return(
            <Page className="padding-right-16 flex-grow" >
            
    
            <div className="page-content page-content-top flex-stretch rhythm-vertical-16">

                <FormItem label="Work Item Type for aggregating Work Item:">
                    <Dropdown
                        ariaLabel="Single select"
                        className="bolt-textfield-default-width"
                        placeholder="Select an Option"
                        enforceSingleSelect={true}
                        items={provider}
                        selection={this.aggregateWorkItemTypeSelection}
                        onSelect={(event, newValue) => {
                            let currentState = this.state
                            currentState.settings.aggregationWorkItemType = newValue.id
                            this.setState(currentState)
                        }}
                    /> 
                </FormItem>

                <FormItem label="Work Item Type for Measures:">
                    <Dropdown
                        ariaLabel="Single select"
                        className="bolt-textfield-default-width"
                        placeholder="Select an Option"
                        enforceSingleSelect={true}
                        items={provider}
                        selection={this.workItemTypeSelection}
                        onSelect={(event, newValue) => {
                            let currentState = this.state
                            currentState.settings.workItemType = newValue.id
                            this.setState(currentState)
                        }}
                    /> 
                </FormItem>
                
                <FormItem label="Common Tag:">
                    <TextField
                        value={this.state.settings.conformanceTag}
                        onChange={(e, newValue) => { 
                            let currentState = this.state
                            currentState.settings.conformanceTag = newValue
                            this.setState(currentState)
                        }}
                        width={TextFieldWidth.standard}
                    />
                </FormItem>            
            </div>
          </Page>   
        )
    }

    private getPills(measure: IConformanceMeasure){
        let pills = [] 
        let key = 0
        let tags: string[] = []
        if(measure.additionalTags){
            tags = measure.additionalTags?.split(";")
            for (let index = 0; index < tags.length; index++) {
                key++
                pills.push(
                    <Pill key={index} size={PillSize.large} onRemoveClick={() => this.onPillRemovedClick(tags[index], measure)} >
                        {tags[index]}
                    </Pill>
                )
            }
        }
        if(this.state.isAddingTag){
            let uniqueTags: string[] = []
            for(let otherMeasure of this.state.settings.availableMeasures) {
                if(!otherMeasure.additionalTags){ continue }
                let otherTags = otherMeasure.additionalTags.split(";")
                for(let tag of otherTags) {
                    if(uniqueTags.includes(tag) || tags.includes(tag)) { continue }
                    uniqueTags.push(tag)
                }
            }

            let items: IListBoxItem<{}>[] = uniqueTags.map(tag => {
                return {
                    id: tag,
                    text: tag
                }
            })            

            pills.push(
                <EditableDropdown
                    key={key + 1}
                    items={items}                    
                    allowFreeform={true}
                    allowTextSelection={true}
                    onValueChange={(value?: IListBoxItem<{}>) => {
                        const newTags = measure.additionalTags ? `${measure.additionalTags};${value?.text}` : value?.text
                        this.setState(prevState => {
                            let copy:ISettingsHubsState = JSON.parse(JSON.stringify(prevState))
                            for(let existingMeasure of copy.settings.availableMeasures){
                                if(existingMeasure.name == measure.name) {
                                    existingMeasure.additionalTags = newTags
                                }
                            }
                            copy.isAddingTag = false
                            return copy
                        })
                    }}
                    onCollapse={() => {
                        this.setState(prevState => ({
                            ...prevState,
                            isAddingTag: false
                        }))
                    }}
                />
            )
        } else {
            pills.push(
                <Pill key={key + 1} size={PillSize.large} onClick={this.onPillAddClick} >
                    <Icon iconName="Add" />
                </Pill>
            )            
        }

        return pills
    }

    private onPillAddClick(event?: React.MouseEvent<HTMLDivElement>){
        this.setState(prevState => ({
            ...prevState,
            isAddingTag: true
        }))
    }

    private onPillRemovedClick(tag: string, measure: IConformanceMeasure){
        this.setState(prevState => {
            let copy:ISettingsHubsState = JSON.parse(JSON.stringify(prevState))
            for(let existingMeasure of copy.settings.availableMeasures){
                if(existingMeasure.name == measure.name && existingMeasure.additionalTags) {
                    existingMeasure.additionalTags = existingMeasure.additionalTags.replace(new RegExp(`${tag};?`), '')
                    if(existingMeasure.additionalTags.endsWith(";")){
                        existingMeasure.additionalTags = existingMeasure.additionalTags.slice(0,-1)
                    }
                }
            }
            copy.isAddingTag = false
            return copy
        })
    }

    private renderMeasureContent(measure: IConformanceMeasure): JSX.Element {
        let index = this.state.settings.availableMeasures.findIndex((item) => item.name == measure.name)        
        const pills = this.getPills(this.state.settings.availableMeasures[index])        
        return(
            <Page className="padding-right-16 flex-grow" >
                <div className="page-content page-content-top flex-stretch rhythm-vertical-16">
                    <FormItem label="Tooltip:" message="This text is shown while hovering over the conformance measure name in the table view.">
                        <TextField
                            ariaLabel="Measurement description"
                            value={this.state.settings.availableMeasures[index].toolTip}
                            onChange={this.onChangeDescription}
                            multiline
                            rows={5}
                            width={TextFieldWidth.auto}
                        />
                    </FormItem>

                    <FormItem label="Description:" message="Template for description field of the work item.">
                        <TextField
                            ariaLabel="Measurement description"
                            value={this.state.settings.availableMeasures[index].description}
                            onChange={this.onChangeTemplate}
                            multiline
                            rows={10}
                            width={TextFieldWidth.auto}
                        />
                    </FormItem>

                    <FormItem label="Additional Tags:" message="Additional tags which will be added when this conformance measure work item is created.">
                        <PillGroup className="flex-row" overflow={PillGroupOverflow.wrap}>
                            {pills}
                        </PillGroup>
                    </FormItem>
                    
                    
                </div>
          </Page>   
        )
    }

    private initialize(settings: IConformanceSettings) {
        this.providers.push({
            id: "General",
            name: "General",
            render: () => this.renderOverviewContent()
        })
        for(let measure of settings.availableMeasures ) {
            this.addMeasureToTabList(measure)
        }
    }


    private addMeasureToTabList(measure: IConformanceMeasure) {
        this.providers.push({
            id: `${measure.name}-${SettingsHub.groupIdMeasures}`,
            name: measure.name,
            groupId: SettingsHub.groupIdMeasures,
            render: () => this.renderMeasureContent(measure)            
        })
    }
}


showRootComponent(<SettingsHub  />);